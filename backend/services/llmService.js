const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class LLMService {
  constructor() {
    // Initialize available LLM clients
    this.providers = [];
    
    // Helper to check if key is valid (not placeholder)
    const isValidKey = (key, prefix) => {
      if (!key) return false;
      if (key.includes('your-key') || key.includes('your-api-key')) return false;
      if (key.includes('xxxxx')) return false;
      if (prefix && !key.startsWith(prefix)) return false;
      return key.length > 20; // All real API keys are longer than 20 chars
    };
    
    // Groq (FREE - Uses OpenAI SDK with different base URL)
    if (isValidKey(process.env.GROQ_API_KEY, 'gsk_')) {
      try {
        this.groq = new OpenAI({
          apiKey: process.env.GROQ_API_KEY,
          baseURL: 'https://api.groq.com/openai/v1',
        });
        this.providers.push('groq');
        console.log('✅ Groq configured (FREE)');
      } catch (error) {
        console.warn('⚠️  Groq initialization failed:', error.message);
      }
    }
    
    // OpenAI
    if (isValidKey(process.env.OPENAI_API_KEY, 'sk-')) {
      try {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.providers.push('openai');
        console.log('✅ OpenAI configured');
      } catch (error) {
        console.warn('⚠️  OpenAI initialization failed:', error.message);
      }
    }
    
    // Anthropic Claude
    if (isValidKey(process.env.ANTHROPIC_API_KEY, 'sk-ant-')) {
      try {
        this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        this.providers.push('anthropic');
        console.log('✅ Anthropic Claude configured');
      } catch (error) {
        console.warn('⚠️  Anthropic initialization failed:', error.message);
      }
    }
    
    // Google Gemini
    if (isValidKey(process.env.GOOGLE_API_KEY)) {
      try {
        this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        this.providers.push('gemini');
        console.log('✅ Google Gemini configured');
      } catch (error) {
        console.warn('⚠️  Gemini initialization failed:', error.message);
      }
    }

    this.currentProviderIndex = 0;
    
    if (this.providers.length === 0) {
      console.warn('\n⚠️  ========================================');
      console.warn('⚠️  NO VALID LLM PROVIDERS CONFIGURED!');
      console.warn('⚠️  ========================================');
      console.warn('⚠️  Please add at least one valid API key to backend/.env');
      console.warn('⚠️  ');
      console.warn('⚠️  RECOMMENDED (FREE): Get Anthropic Claude API key');
      console.warn('⚠️  1. Visit: https://console.anthropic.com/');
      console.warn('⚠️  2. Sign up (get $5 free credit)');
      console.warn('⚠️  3. Create API key');
      console.warn('⚠️  4. Add to .env: ANTHROPIC_API_KEY=sk-ant-your-key');
      console.warn('⚠️  ');
      console.warn('⚠️  See LLM_SETUP.md for detailed instructions');
      console.warn('⚠️  ========================================\n');
    } else {
      console.log(`\n✅ LLM providers ready: ${this.providers.join(', ')}\n`);
    }
  }

  async callWithFallback(systemPrompt, userPrompt, options = {}) {
    if (this.providers.length === 0) {
      throw new Error('No LLM providers configured. Please add API keys in .env file.');
    }

    let lastError = null;
    const attemptedProviders = [];

    // Try each provider in order
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[this.currentProviderIndex];
      attemptedProviders.push(provider);

      try {
        console.log(`🤖 Attempting LLM call with ${provider}...`);
        const result = await this.callProvider(provider, systemPrompt, userPrompt, options);
        console.log(`✅ Successfully called ${provider}`);
        return result;
      } catch (error) {
        console.error(`❌ ${provider} failed:`, error.message);
        lastError = error;
        
        // Move to next provider
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
        
        // If it's a quota/billing error, try next provider immediately
        if (error.message.includes('quota') || error.message.includes('429') || 
            error.message.includes('billing') || error.message.includes('rate limit')) {
          console.log(`⏭️  Switching to next provider due to quota/rate limit...`);
          continue;
        }
        
        console.log(`⏭️  Trying next provider...`);
      }
    }

    // All providers failed
    throw new Error(
      `All LLM providers failed. Attempted: ${attemptedProviders.join(', ')}. ` +
      `Last error: ${lastError.message}`
    );
  }

  async callProvider(provider, systemPrompt, userPrompt, options = {}) {
    switch (provider) {
      case 'groq':
        return await this.callGroq(systemPrompt, userPrompt, options);
      case 'openai':
        return await this.callOpenAI(systemPrompt, userPrompt, options);
      case 'anthropic':
        return await this.callAnthropic(systemPrompt, userPrompt, options);
      case 'gemini':
        return await this.callGemini(systemPrompt, userPrompt, options);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  async callGroq(systemPrompt, userPrompt, options = {}) {
    const response = await this.groq.chat.completions.create({
      model: options.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2000,
    });

    return response.choices[0].message.content;
  }

  async callOpenAI(systemPrompt, userPrompt, options = {}) {
    const response = await this.openai.chat.completions.create({
      model: options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2000,
    });

    return response.choices[0].message.content;
  }

  async callAnthropic(systemPrompt, userPrompt, options = {}) {
    const response = await this.anthropic.messages.create({
      model: options.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature || 0.3,
    });

    return response.content[0].text;
  }

  async callGemini(systemPrompt, userPrompt, options = {}) {
    const model = this.gemini.getGenerativeModel({ 
      model: options.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });

    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const result = await model.generateContent(combinedPrompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Analyze bug and generate comprehensive bug report
   * @param {Object} bugInput - Raw bug input from QA
   */
  async analyzeBug(bugInput) {
    try {
      const { description, logs, userStoryContext } = bugInput;

      const systemPrompt = `You are an expert QA analyst and software engineer. Analyze bug reports and generate comprehensive, developer-ready bug tickets. Always respond with valid JSON.`;

      const userPrompt = `
Analyze the following bug report and generate a comprehensive, developer-ready bug ticket.

${userStoryContext ? `
**Related User Story Context:**
Summary: ${userStoryContext.summary}
Description: ${userStoryContext.description}
Acceptance Criteria: ${userStoryContext.acceptanceCriteria}
Components: ${userStoryContext.components?.join(', ')}
` : ''}

**Bug Description from QA:**
${description}

${logs ? `
**Logs/Error Messages:**
${logs}
` : ''}

Please provide a structured analysis in the following JSON format:
{
  "summary": "Clear, concise bug title (max 100 chars)",
  "reproductionSteps": "Numbered step-by-step instructions to reproduce the bug",
  "rootCause": "Analysis of what might be causing this bug",
  "affectedModule": "The specific component, module, or feature affected",
  "suggestedFix": "Technical suggestion for how to fix this issue",
  "testCases": "Jest/React Testing Library test cases to verify the fix",
  "priority": "Critical|High|Medium|Low",
  "severity": "Blocker|Critical|Major|Minor|Trivial"
}

Be specific, technical, and actionable. Focus on clarity for developers. Respond ONLY with valid JSON.
`;

      const response = await this.callWithFallback(systemPrompt, userPrompt);
      
      // Try to parse JSON, handle markdown code blocks
      try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : response;
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse LLM response as JSON:', parseError);
        // Return structured fallback
        return {
          summary: description.substring(0, 100),
          reproductionSteps: 'Reproduction steps could not be auto-generated',
          rootCause: 'Analysis pending manual review',
          affectedModule: 'Unknown',
          suggestedFix: 'Manual analysis required',
          testCases: 'Test cases require manual creation',
          priority: 'Medium',
          severity: 'Major'
        };
      }
    } catch (error) {
      console.error('Error analyzing bug with LLM:', error);
      throw new Error(`LLM analysis failed: ${error.message}`);
    }
  }

  /**
   * Identify the affected module/component from bug description
   * @param {string} description - Bug description
   * @param {Array} availableComponents - List of available components
   */
  async identifyAffectedModule(description, availableComponents = []) {
    try {
      const systemPrompt = `You are an expert at identifying software components and modules from bug descriptions. Respond with only the module name.`;

      const userPrompt = `
Given the following bug description, identify the most likely affected module or component:

Bug Description: ${description}

${availableComponents.length > 0 ? `
Available Components: ${availableComponents.join(', ')}
` : ''}

Return ONLY the name of the most likely affected module/component. Be specific and concise.
`;

      const response = await this.callWithFallback(systemPrompt, userPrompt, {
        temperature: 0.2,
        maxTokens: 50
      });

      return response.trim();
    } catch (error) {
      console.error('Error identifying module:', error);
      return 'Unknown';
    }
  }

  /**
   * Generate test cases for the bug fix
   * @param {Object} bugAnalysis - Analysis of the bug
   */
  async generateTestCases(bugAnalysis) {
    try {
      const systemPrompt = `You are an expert in writing Jest and React Testing Library tests. Generate comprehensive test cases.`;

      const userPrompt = `
Generate comprehensive Jest and React Testing Library test cases for the following bug fix:

Summary: ${bugAnalysis.summary}
Reproduction Steps: ${bugAnalysis.reproductionSteps}
Suggested Fix: ${bugAnalysis.suggestedFix}

Generate test cases that:
1. Test the bug scenario (should fail before fix)
2. Test the expected behavior (should pass after fix)
3. Test edge cases
4. Include proper setup, assertions, and cleanup

Return the test code in a well-formatted, ready-to-use format.
`;

      const response = await this.callWithFallback(systemPrompt, userPrompt);
      return response;
    } catch (error) {
      console.error('Error generating test cases:', error);
      return 'Test case generation failed. Please write tests manually.';
    }
  }

  /**
   * Suggest the best developer to assign based on module and history
   * @param {string} module - Affected module
   * @param {Array} recentAssignees - Recent assignees for similar issues
   */
  async suggestAssignee(module, recentAssignees = []) {
    try {
      if (recentAssignees.length === 0) {
        return null;
      }

      // Return the most frequent assignee
      return recentAssignees[0].name;
    } catch (error) {
      console.error('Error suggesting assignee:', error);
      return null;
    }
  }
}

module.exports = new LLMService();
