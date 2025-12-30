const express = require('express');
const router = express.Router();
const llmService = require('../services/llmService');

/**
 * POST /api/analysis/analyze
 * Analyze bug description with LLM
 */
router.post('/analyze', async (req, res) => {
  try {
    const { description, logs, userStoryContext } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const analysis = await llmService.analyzeBug({
      description,
      logs,
      userStoryContext
    });

    res.json({ success: true, analysis });

  } catch (error) {
    console.error('Error analyzing bug:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/analysis/generate-tests
 * Generate test cases for a bug fix
 */
router.post('/generate-tests', async (req, res) => {
  try {
    const { bugAnalysis } = req.body;

    if (!bugAnalysis) {
      return res.status(400).json({ error: 'Bug analysis is required' });
    }

    const testCases = await llmService.generateTestCases(bugAnalysis);

    res.json({ success: true, testCases });

  } catch (error) {
    console.error('Error generating tests:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/analysis/identify-module
 * Identify affected module from description
 */
router.post('/identify-module', async (req, res) => {
  try {
    const { description, availableComponents } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const module = await llmService.identifyAffectedModule(
      description,
      availableComponents
    );

    res.json({ success: true, module });

  } catch (error) {
    console.error('Error identifying module:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
