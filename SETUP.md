# 🚀 Quick Setup Guide

## Prerequisites Checklist

Before you start, make sure you have:

- [ ] Node.js 18 or higher installed
- [ ] A Firebase account and project
- [ ] A JIRA account with API access
- [ ] An OpenAI API key
- [ ] A Gmail account (for notifications)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# From the root directory
npm run install-all
```

This will install dependencies for the root, backend, and frontend.

### 2. Get Your API Keys

#### Firebase Setup (5 minutes)

1. Go to https://console.firebase.google.com/
2. Create a new project (or use existing)
3. Click "Add app" → Web app icon
4. Copy the config object values to `frontend/.env`
5. Go to Project Settings → Service Accounts
6. Click "Generate new private key"
7. Copy the values from downloaded JSON to `backend/.env`
8. Enable Firestore Database in Firebase console

#### JIRA API Token (2 minutes)

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the token to `backend/.env` as `JIRA_API_TOKEN`
4. Add your JIRA email and domain (e.g., yourcompany.atlassian.net)

#### OpenAI API Key (2 minutes)

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy to `backend/.env` as `OPENAI_API_KEY`

#### Gmail App Password (3 minutes)

1. Enable 2FA on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password
4. Copy to `backend/.env` as `EMAIL_PASSWORD`

### 3. Configure Environment Files

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your actual values

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your actual values
```

### 4. Start the Application

```bash
# From root directory
npm run dev
```

This starts both the backend (port 5000) and frontend (port 5173).

### 5. Verify Everything Works

1. Open http://localhost:5173
2. Click "Submit Bug"
3. Fill in a test bug report
4. Check if:
   - Bug is submitted successfully
   - Analysis starts
   - JIRA ticket is created
   - Email notification is sent (if configured)

## Common Issues

### Firebase Connection Error

- Make sure you've enabled Firestore in Firebase Console
- Verify your Firebase credentials in `.env` files
- Check that private key is properly formatted with `\n` newlines

### JIRA API Error

- Verify your API token is correct
- Check your JIRA domain format (should be `domain.atlassian.net`)
- Ensure your JIRA account has permission to create bugs

### OpenAI Error

- Verify your API key is valid
- Check you have credits available
- Make sure you're using a supported model (gpt-4-turbo-preview)

### Email Not Sending

- Verify app password is correct (not your regular password)
- Check Gmail hasn't blocked the login attempt
- Verify 2FA is enabled on your Google account

## Next Steps

Once everything is running:

1. Test the full flow by submitting a real bug
2. Check the JIRA ticket that was created
3. Review the AI-generated analysis
4. Customize the prompts in `backend/services/llmService.js` for your needs
5. Add your team members' information for auto-assignment

## Need Help?

- Check the main README.md for detailed documentation
- Review the API endpoints in each route file
- Look at the service files for integration details

---

**Estimated setup time: 15-20 minutes** ⏱️
