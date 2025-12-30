# 🤖 LLM Provider Setup Guide

BugSense AI supports **multiple LLM providers** with **automatic fallback**. You only need **one** API key to get started, but configuring multiple providers ensures better reliability and cost-effectiveness.

## 🎯 Quick Start (Recommended)

**For immediate use, get a free Anthropic Claude API key:**

1. Visit https://console.anthropic.com/
2. Sign up (get **$5 free credit**)
3. Navigate to "API Keys" → Create new key
4. Add to `backend/.env`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

That's it! The system will automatically use Claude for all AI analysis.

---

## 🆓 Free & Paid Options

### Option 1: Anthropic Claude (⭐ RECOMMENDED)

**Best for:** Free tier with generous credits

- **Free Credits**: $5 credit for new accounts (lasts a long time)
- **Model**: Claude 3.5 Sonnet (very capable, accurate)
- **Pricing**: $3 per million tokens (after free credit)

**Setup:**
1. Go to https://console.anthropic.com/
2. Sign up for a free account
3. Navigate to "API Keys" → Create API Key
4. Copy the key starting with `sk-ant-...`
5. Add to `backend/.env`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

---

### Option 2: Google Gemini (Free Tier Available)

**Best for:** Completely free tier with rate limits

- **Free Tier**: 60 requests per minute (generous for development)
- **Model**: Gemini 1.5 Flash (fast and capable)
- **Pricing**: Free tier, then paid plans available

**Setup:**
1. Go to https://makersuite.google.com/app/apikey
   - Or https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Add to `backend/.env`:
   ```bash
   GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxx
   GEMINI_MODEL=gemini-1.5-flash
   ```

---

### Option 3: OpenAI (Paid Only)

**Best for:** Production use with proven reliability

- **Free Tier**: ❌ No free tier (requires credit card)
- **Model**: GPT-4o-mini (cost-effective), GPT-4 (most capable)
- **Pricing**: Starts at $0.15 per million tokens for GPT-4o-mini

**Setup:**
1. Go to https://platform.openai.com/api-keys
2. Sign up and add payment method
3. Create a new secret key
4. Copy the key starting with `sk-proj-...`
5. Add to `backend/.env`:
   ```bash
   OPENAI_API_KEY=sk-proj-xxxxx
   OPENAI_MODEL=gpt-4o-mini
   ```

---

## 🔄 How Multi-Provider Fallback Works

When you configure multiple providers, BugSense AI automatically:

1. **Tries the first configured provider**
2. **On failure** (quota exceeded, rate limit, network error):
   - Automatically switches to the next provider
   - Logs which provider is being used
   - Continues seamlessly without user intervention
3. **Cycles through all providers** until one succeeds
4. **Returns error** only if ALL providers fail

### Example Configuration (Multiple Providers)

```bash
# Configure all three for maximum reliability
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

GOOGLE_API_KEY=AIzaSy-your-key
GEMINI_MODEL=gemini-1.5-flash

OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-4o-mini
```

**Benefits:**
- ✅ Never runs out of quota (auto-switches)
- ✅ Cost optimization (use free tiers first)
- ✅ Better uptime and reliability
- ✅ No code changes needed

---

## 📋 Configuration in .env

Add **at least ONE** of these to your `backend/.env` file:

```bash
# RECOMMENDED: Anthropic Claude (Free $5 credit)
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# OPTIONAL: Google Gemini (Completely free tier)
GOOGLE_API_KEY=your-google-api-key
GEMINI_MODEL=gemini-1.5-flash

# OPTIONAL: OpenAI (Paid, no free tier)
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

---

## ✅ Verify Setup

After adding your API keys:

1. **Restart the server:**
   ```bash
   cd backend
   npm install  # Install new dependencies
   npm run dev
   ```

2. **Check the console output:**
   ```
   ✅ LLM providers available: anthropic, gemini, openai
   ```

3. **Submit a test bug** and watch the logs:
   ```
   🤖 Attempting LLM call with anthropic...
   ✅ Successfully called anthropic
   ```

---

## 💰 Cost Comparison

| Provider | Free Tier | Cost After Free | Best For |
|----------|-----------|-----------------|----------|
| **Anthropic Claude** | $5 credit | $3/M tokens | Development & Production |
| **Google Gemini** | 60 req/min free | Paid plans | Development (free) |
| **OpenAI** | ❌ None | $0.15/M tokens | Production (paid) |

**Recommendation for Development:**
1. Start with **Anthropic** ($5 free)
2. Add **Gemini** as backup (free tier)
3. Keep OpenAI for production if needed

---

## 🆘 Troubleshooting

### Error: "No LLM providers configured"
**Solution:** Add at least one API key to `backend/.env` and restart the server.

### Error: "quota exceeded" or "429"
**What happens:** System automatically tries the next provider.

**To prevent:**
- Configure multiple providers
- Monitor usage at provider dashboards
- Use free tier providers for development

### Error: "All LLM providers failed"
**Solution:** 
1. Check all API keys are valid
2. Verify you have credits/quota remaining
3. Check provider status pages
4. Review console logs for specific errors

### Provider not being used
**Check:**
1. API key is correctly set in `.env`
2. No typos in environment variable names
3. Server was restarted after adding keys
4. Console shows provider in "available" list

---

## 🎓 Best Practices

### For Development
```bash
# Use free tier providers
ANTHROPIC_API_KEY=sk-ant-...  # $5 free credit
GOOGLE_API_KEY=AIzaSy-...     # Completely free
```

### For Production
```bash
# Use multiple providers for reliability
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIzaSy-...
OPENAI_API_KEY=sk-proj-...
```

### Cost Optimization
- Start with Anthropic (best free tier)
- Add Gemini as free backup
- Use OpenAI only when needed
- Monitor usage dashboards regularly

---

## 📞 Support

**Provider Support:**
- Anthropic: https://support.anthropic.com/
- Google: https://ai.google.dev/docs
- OpenAI: https://help.openai.com/

**BugSense AI Issues:**
- Check console logs for provider errors
- Verify API keys in `.env` file
- Ensure server was restarted after changes

---

**Made with ❤️ for seamless AI integration**
