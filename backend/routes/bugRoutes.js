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

    // Use current user's name and email if logged in
    const currentUser = req.user; // Assuming user info is available in req.user
    const name = currentUser?.name || submittedBy || 'Anonymous';
    const email = currentUser?.email || submittedByEmail || null;

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
      submittedBy: name,
      submittedByEmail: email,
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
    // Removed test case generation logic

    // Step 3: Find potential assignees
    const potentialAssignees = await jiraService.getPotentialAssignees(
      analysis.affectedModule
    );

    const suggestedAssignee = potentialAssignees.length > 0 
      ? potentialAssignees[0].name 
      : null;

    // Step 4: Create JIRA ticket (optional - graceful failure)
    let jiraTicket = null;
    try {
      jiraTicket = await jiraService.createBugTicket({
        summary: analysis.summary,
        description: description,
        reproductionSteps: analysis.reproductionSteps,
        rootCause: analysis.rootCause,
        suggestedFix: analysis.suggestedFix,
        affectedModule: analysis.affectedModule,
        relatedStory: userStoryContext?.key,
        priority: analysis.priority,
        assignee: suggestedAssignee
      });
      console.log(`✅ JIRA ticket created: ${jiraTicket.key}`);
    } catch (jiraError) {
      console.error('⚠️  JIRA ticket creation failed:', jiraError.message);
      // Continue without JIRA ticket - analysis is still valuable
      jiraTicket = {
        error: jiraError.message,
        note: 'JIRA ticket could not be created. Check JIRA permissions.'
      };
    }

    // Step 5: Update Firebase record
    await db.collection('bugs').doc(bugId).update({
      status: 'completed',
      analysis,
      jiraTicket,
      suggestedAssignee,
      potentialAssignees,
      completedAt: new Date().toISOString()
    });

    // Step 6: Send notifications
    if (submittedByEmail) {
      await emailService.sendAnalysisCompleteNotification(
        submittedByEmail,
        { summary: analysis.summary, jiraTicket }
      );
    }

    // Send email to assignee if available
    if (suggestedAssignee) {
      // You'll need to fetch assignee email from JIRA or your system
      // await emailService.sendTicketCreatedNotification(jiraTicket, assigneeEmail);
    }

    console.log(`✅ Bug ${bugId} analyzed and ticket ${jiraTicket.key} created`);

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
      isExisting: true, // Indicate that the bug already exists
      ...bugDoc.data()
    });

  } catch (error) {
    console.error('Error fetching bug:', error);
    res.status(500).json({ error: 'Failed to fetch bug' });
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
