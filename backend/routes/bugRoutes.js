const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db } = require('../config/firebase');
const llmService = require('../services/llmService');
const jiraService = require('../services/jiraService');
const emailService = require('../services/emailService');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * POST /api/bugs/submit
 * Submit a new bug report for analysis
 */
router.post('/submit', upload.single('screenshot'), async (req, res) => {
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
      status: 'analyzing',
      createdAt: new Date().toISOString(),
      userStoryContext
    });

    // Start async analysis (don't wait for completion)
    analyzeBugAsync(bugRef.id, {
      description,
      logs,
      userStoryContext,
      submittedByEmail
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
    const { description, logs, userStoryContext, submittedByEmail } = bugData;

    // Step 1: Analyze bug with LLM
    const analysis = await llmService.analyzeBug({
      description,
      logs,
      userStoryContext
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

    // Step 4: Create JIRA ticket (optional - graceful failure)
    let jiraTicket = null;
    try {
      jiraTicket = await jiraService.createBugTicket({
        summary: analysis.summary,
        description: description,
        reproductionSteps: analysis.reproductionSteps,
        rootCause: analysis.rootCause,
        suggestedFix: analysis.suggestedFix,
        testCases: testCases,
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
      testCases,
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
