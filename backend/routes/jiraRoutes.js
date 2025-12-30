const express = require('express');
const router = express.Router();
const jiraService = require('../services/jiraService');

/**
 * GET /api/jira/story/:key
 * Fetch a user story from JIRA
 */
router.get('/story/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const story = await jiraService.fetchUserStory(key);
    
    res.json({ success: true, story });

  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jira/similar-bugs
 * Search for similar bugs
 */
router.get('/similar-bugs', async (req, res) => {
  try {
    const { summary } = req.query;
    
    if (!summary) {
      return res.status(400).json({ error: 'Summary is required' });
    }

    const similarBugs = await jiraService.searchSimilarBugs(summary);
    
    res.json({ success: true, similarBugs });

  } catch (error) {
    console.error('Error searching similar bugs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/jira/assignees/:component
 * Get potential assignees for a component
 */
router.get('/assignees/:component', async (req, res) => {
  try {
    const { component } = req.params;
    
    const assignees = await jiraService.getPotentialAssignees(component);
    
    res.json({ success: true, assignees });

  } catch (error) {
    console.error('Error getting assignees:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
