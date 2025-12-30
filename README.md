# 🐛 BugSense AI

> From Bug Report to Fix-Ready Insight — Automatically

An AI-powered bug assistant that pulls user stories from JIRA, understands QA-reported issues, and auto-creates clean bug tickets with summaries, repro steps, root cause guesses, and test cases—ready for developers.

## 🌟 Features

### Must-Have Features ✅
- **JIRA Story Fetcher**: Pull context (user story, acceptance criteria, related tasks) to understand the feature under test
- **AI Bug Analyzer**: Convert logs, screenshots & QA description into a clean developer-ready bug ticket
- **Auto Ticket Creation**: Draft a new JIRA bug with:
  - Summary
  - Reproduction steps
  - Root cause hypothesis
  - Suggested fix & Jest/RTL test cases
  - Affected Module Identification
  
### Nice-to-Have Features 🎁
- **Auto Test Case Generation**: AI-generated Jest and React Testing Library tests
- **Auto Assignment to Right Developer**: Based on module expertise and history
- **Email Notifications**: When ticket is generated or assigned

## 🏗️ Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **AI/LLM**: OpenAI GPT-4
- **Integration**: JIRA REST API
- **Email**: Nodemailer

## 📁 Project Structure

```
bugsense-ai/
├── backend/
│   ├── config/
│   │   └── firebase.js          # Firebase Admin SDK config
│   ├── routes/
│   │   ├── bugRoutes.js         # Bug submission & retrieval
│   │   ├── jiraRoutes.js        # JIRA integration endpoints
│   │   └── analysisRoutes.js    # AI analysis endpoints
│   ├── services/
│   │   ├── jiraService.js       # JIRA API integration
│   │   ├── llmService.js        # OpenAI integration
│   │   └── emailService.js      # Email notifications
│   ├── .env.example
│   ├── package.json
│   └── server.js                # Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout/
│   │   │       └── Header.jsx
│   │   ├── config/
│   │   │   └── firebase.js      # Firebase client config
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Landing page
│   │   │   ├── SubmitBug.jsx    # Bug submission form
│   │   │   ├── BugDetails.jsx   # Bug analysis view
│   │   │   └── Dashboard.jsx    # All bugs list
│   │   ├── services/
│   │   │   └── api.js           # API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project
- JIRA account with API access
- OpenAI API key
- Gmail account (for email notifications)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "My BugSense AI"
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install-all
```

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JIRA Configuration
JIRA_HOST=your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=PROJ

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 4. Configure Frontend Environment

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 5. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Generate a service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file
   - Copy the credentials to your backend `.env`
5. Get your web app configuration:
   - Go to Project Settings → General
   - Under "Your apps", add a web app
   - Copy the config to your frontend `.env`

### 6. Set Up JIRA API Access

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create a new API token
3. Copy it to `JIRA_API_TOKEN` in your backend `.env`
4. Set your JIRA email and domain

### 7. Get OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy it to `OPENAI_API_KEY` in your backend `.env`

### 8. Configure Email (Optional)

For Gmail:
1. Enable 2-factor authentication
2. Generate an app password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use the app password in `EMAIL_PASSWORD`

### 9. Run the Application

From the root directory:

```bash
# Run both backend and frontend concurrently
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📖 Usage

### Submitting a Bug

1. Navigate to "Submit Bug" page
2. Enter bug description
3. (Optional) Add logs/error messages
4. (Optional) Link to related JIRA story
5. Add your contact information
6. Click "Submit Bug Report"

### Viewing Analysis

1. After submission, you'll be redirected to the bug details page
2. Watch as AI analyzes your bug in real-time
3. View the generated:
   - Summary and priority
   - Step-by-step reproduction steps
   - Root cause analysis
   - Suggested fix
   - Test cases
   - Affected module
   - JIRA ticket link

### Dashboard

- View all submitted bugs
- Filter by status (Analyzing, Completed, Failed)
- Click on any bug to view details

## 🔧 API Endpoints

### Bug Routes

- `POST /api/bugs/submit` - Submit a new bug report
- `GET /api/bugs/:id` - Get bug details
- `GET /api/bugs` - Get all bugs (with pagination and filtering)

### JIRA Routes

- `GET /api/jira/story/:key` - Fetch a user story from JIRA
- `GET /api/jira/similar-bugs?summary=...` - Search for similar bugs
- `GET /api/jira/assignees/:component` - Get potential assignees

### Analysis Routes

- `POST /api/analysis/analyze` - Analyze bug with AI
- `POST /api/analysis/generate-tests` - Generate test cases
- `POST /api/analysis/identify-module` - Identify affected module

## 🎯 Demo Flow

1. **QA submits a bug** with description and optional screenshot/log
2. **AI converts** it into a clear, structured bug summary
3. **Step-by-step reproduction steps** are generated automatically
4. **System identifies** the most likely affected module or feature
5. **Auto-assignment** to developer (if enabled)
6. **Email notifications** sent to QA and assigned developer

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev  # Runs with nodemon for auto-reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Runs Vite dev server with HMR
```

### Build for Production

```bash
# Frontend
cd frontend
npm run build

# Backend (no build needed, just run)
cd backend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Atlassian for JIRA API
- Firebase for backend services
- All the amazing open-source libraries used in this project

## 📞 Support

For support, email your-email@company.com or create an issue in the repository.

---

**Made with ❤️ for QA Engineers and Developers**
