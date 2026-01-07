const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db, storage } = require('../config/firebase');
const llmService = require('../services/llmService');
const jiraService = require('../services/jiraService');
const emailService = require('../services/emailService');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Upload image to Firebase Storage
 */
async function uploadImageToStorage(file, bugId, type) {
  if (!storage) {
    throw new Error('Firebase Storage not configured');
  }

  try {
    const bucket = storage.bucket();
    const timestamp = Date.now();
    const fileName = `bugs/${bugId}/${type}/${timestamp}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    console.log(`📤 Uploading ${type} image: ${fileName}`);

    // Upload file with metadata
    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
      public: true,
      validation: false
    });

    // Make the file publicly accessible
    await fileUpload.makePublic();

    // Return public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log(`✅ Uploaded successfully: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading ${type} image:`, error.message);
    console.error('Error details:', error);
    throw new Error(`Failed to upload ${type} image: ${error.message}`);
  }
}

/**
 * POST /api/bugs/submit
 * Submit a new bug report for analysis
 */
router.post('/submit', upload.fields([
  { name: 'screenshots', maxCount: 5 },
  { name: 'logImages', maxCount: 3 }
]), async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database not configured. Please set up Firebase credentials in .env file.' 
      });
    }

    const {
      description,
      logs,
      relatedStoryKey,
      submittedBy,
      submittedByEmail
    } = req.body;

    // Validate input
    if (!description) {
      return res.status(400).json({ error: 'Bug description is required' });
    }

    // Fetch related user story if provided
    let userStoryContext = null;
    if (relatedStoryKey) {
      try {
        userStoryContext = await jiraService.fetchUserStory(relatedStoryKey);
        // Remove undefined values from userStoryContext
        if (userStoryContext) {
          Object.keys(userStoryContext).forEach(
            key => userStoryContext[key] === undefined && delete userStoryContext[key]
          );
        }
      } catch (error) {
        console.warn('Could not fetch user story:', error.message);
      }
    }

    // Create initial bug record in Firebase
    const bugRef = await db.collection('bugs').add({
      description,
      logs: logs || null,
      relatedStoryKey: relatedStoryKey || null,
      submittedBy: submittedBy || 'Anonymous',
      submittedByEmail: submittedByEmail || null,
      status: 'uploading',
      createdAt: new Date().toISOString(),
      userStoryContext
    });

    // Upload images to Firebase Storage
    const screenshotUrls = [];
    const logImageUrls = [];

    try {
      // Upload screenshots
      if (req.files && req.files.screenshots) {
        console.log(`📸 Processing ${req.files.screenshots.length} screenshot(s)...`);
        for (const file of req.files.screenshots) {
          try {
            const url = await uploadImageToStorage(file, bugRef.id, 'screenshots');
            screenshotUrls.push(url);
          } catch (fileError) {
            console.error(`Failed to upload screenshot ${file.originalname}:`, fileError.message);
            // Continue with other files
          }
        }
      }

      // Upload log images
      if (req.files && req.files.logImages) {
        console.log(`📄 Processing ${req.files.logImages.length} log image(s)...`);
        for (const file of req.files.logImages) {
          try {
            const url = await uploadImageToStorage(file, bugRef.id, 'logs');
            logImageUrls.push(url);
          } catch (fileError) {
            console.error(`Failed to upload log image ${file.originalname}:`, fileError.message);
            // Continue with other files
          }
        }
      }

      // Update bug record with image URLs
      await db.collection('bugs').doc(bugRef.id).update({
        screenshotUrls,
        logImageUrls,
        status: 'analyzing'
      });

      console.log(`✅ Updated bug ${bugRef.id} with ${screenshotUrls.length} screenshots and ${logImageUrls.length} log images`);

    } catch (uploadError) {
      console.error('Error uploading images:', uploadError);
      await db.collection('bugs').doc(bugRef.id).update({
        status: 'upload_failed',
        error: uploadError.message
      });
      return res.status(500).json({ 
        error: 'Failed to upload images',
        details: uploadError.message 
      });
    }

    // Start async analysis (don't wait for completion)
    analyzeBugAsync(bugRef.id, {
      description,
      logs,
      userStoryContext,
      submittedByEmail,
      screenshotUrls,
      logImageUrls
    });

    res.json({
      success: true,
      bugId: bugRef.id,
      message: 'Bug submitted successfully. Analysis in progress...'
    });

  } catch (error) {
    console.error('Error submitting bug:', error);
    res.status(500).json({ error: 'Failed to submit bug report' });
  }
});

/**
 * Async function to analyze bug and create JIRA ticket
 */
async function analyzeBugAsync(bugId, bugData) {
  try {
    const { description, logs, userStoryContext, submittedByEmail, screenshotUrls, logImageUrls } = bugData;

    // Step 1: Analyze bug with LLM (including images)
    const analysis = await llmService.analyzeBug({
      description,
      logs,
      userStoryContext,
      screenshotUrls,
      logImageUrls
    });

    // Step 2: Generate test cases
    const testCases = await llmService.generateTestCases(analysis);

    // Step 3: Find potential assignees
    const potentialAssignees = await jiraService.getPotentialAssignees(
      analysis.affectedModule
    );

    const suggestedAssignee = potentialAssignees.length > 0 
      ? potentialAssignees[0].name 
      : null;

    // Step 4: Update Firebase record (NO automatic JIRA ticket creation)
    await db.collection('bugs').doc(bugId).update({
      status: 'pending_review',  // Changed from 'completed' to 'pending_review'
      analysis,
      testCases,
      suggestedAssignee,
      potentialAssignees,
      analyzedAt: new Date().toISOString()
    });

    // Step 5: Send notification (analysis ready for review)
    if (submittedByEmail) {
      await emailService.sendAnalysisCompleteNotification(
        submittedByEmail,
        { summary: analysis.summary }
      );
    }

    console.log(`✅ Bug ${bugId} analyzed and ready for QA review`);

  } catch (error) {
    console.error('Error in async bug analysis:', error);
    
    // Update status to failed
    await db.collection('bugs').doc(bugId).update({
      status: 'failed',
      error: error.message,
      failedAt: new Date().toISOString()
    });
  }
}

/**
 * GET /api/bugs/:id
 * Get bug analysis by ID
 */
router.get('/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database not configured. Please set up Firebase credentials in .env file.' 
      });
    }

    const { id } = req.params;
    
    const bugDoc = await db.collection('bugs').doc(id).get();
    
    if (!bugDoc.exists) {
      return res.status(404).json({ error: 'Bug not found' });
    }

    res.json({
      id: bugDoc.id,
      ...bugDoc.data()
    });

  } catch (error) {
    console.error('Error fetching bug:', error);
    res.status(500).json({ error: 'Failed to fetch bug' });
  }
});

/**
 * PUT /api/bugs/:id/analysis
 * Update bug analysis (for QA review/editing)
 */
router.put('/:id/analysis', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database not configured. Please set up Firebase credentials in .env file.' 
      });
    }

    const { id } = req.params;
    const { analysis } = req.body;

    if (!analysis) {
      return res.status(400).json({ error: 'Analysis data is required' });
    }

    // Update the analysis in Firestore
    await db.collection('bugs').doc(id).update({
      analysis,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Analysis updated successfully'
    });

  } catch (error) {
    console.error('Error updating analysis:', error);
    res.status(500).json({ error: 'Failed to update analysis' });
  }
});

/**
 * POST /api/bugs/:id/create-ticket
 * Manually create JIRA ticket after QA review
 */
router.post('/:id/create-ticket', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database not configured. Please set up Firebase credentials in .env file.' 
      });
    }

    const { id } = req.params;
    
    // Get the bug data
    const bugDoc = await db.collection('bugs').doc(id).get();
    
    if (!bugDoc.exists) {
      return res.status(404).json({ error: 'Bug not found' });
    }

    const bugData = bugDoc.data();

    // Check if ticket already exists
    if (bugData.jiraTicket && bugData.jiraTicket.key) {
      return res.status(400).json({ 
        error: 'JIRA ticket already exists',
        jiraTicket: bugData.jiraTicket
      });
    }

    // Check if analysis is complete
    if (!bugData.analysis) {
      return res.status(400).json({ 
        error: 'Bug analysis not yet complete. Please wait for analysis to finish.' 
      });
    }

    // Create JIRA ticket
    const jiraTicket = await jiraService.createBugTicket({
      summary: bugData.analysis.summary,
      description: bugData.description,
      reproductionSteps: bugData.analysis.reproductionSteps,
      rootCause: bugData.analysis.rootCause,
      suggestedFix: bugData.analysis.suggestedFix,
      testCases: bugData.testCases || [],
      affectedModule: bugData.analysis.affectedModule,
      relatedStory: bugData.userStoryContext?.key,
      priority: bugData.analysis.priority,
      assignee: bugData.suggestedAssignee
    });

    // Update bug record with JIRA ticket info
    await db.collection('bugs').doc(id).update({
      jiraTicket,
      status: 'completed',
      ticketCreatedAt: new Date().toISOString()
    });

    console.log(`✅ JIRA ticket created manually: ${jiraTicket.key}`);

    res.json({
      success: true,
      jiraTicket,
      message: `JIRA ticket ${jiraTicket.key} created successfully`
    });

  } catch (error) {
    console.error('Error creating JIRA ticket:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({ 
      error: 'Failed to create JIRA ticket',
      details: error.message
    });
  }
});

/**
 * GET /api/bugs
 * Get all bugs with pagination
 */
router.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database not configured. Please set up Firebase credentials in .env file.' 
      });
    }

    const { limit = 20, offset = 0, status } = req.query;

    let query = db.collection('bugs').orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(parseInt(limit)).offset(parseInt(offset)).get();

    const bugs = [];
    snapshot.forEach(doc => {
      bugs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      bugs,
      count: bugs.length,
      hasMore: bugs.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Error fetching bugs:', error);
    res.status(500).json({ error: 'Failed to fetch bugs' });
  }
});

module.exports = router;
