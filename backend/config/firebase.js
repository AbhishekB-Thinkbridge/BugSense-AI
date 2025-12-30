const admin = require('firebase-admin');

// Initialize Firebase Admin
let db = null;
let auth = null;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  db = admin.firestore();
  auth = admin.auth();
  console.log('✅ Firebase initialized successfully');
} else {
  console.warn('⚠️  Firebase credentials not configured. Please set up .env file.');
  console.warn('   Copy backend/.env.example to backend/.env and add your Firebase credentials.');
}

module.exports = { admin, db, auth };
