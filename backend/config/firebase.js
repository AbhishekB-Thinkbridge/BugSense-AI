const admin = require('firebase-admin');

// Initialize Firebase Admin
let db = null;
let auth = null;
let storage = null;

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
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
  }

  db = admin.firestore();
  auth = admin.auth();
  storage = admin.storage();
  
  console.log('✅ Firebase initialized successfully');
  
  // Test storage bucket connection
  if (storage) {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    console.log(`📦 Firebase Storage bucket: ${bucketName}`);
    
    // Try to verify bucket access - but don't fail if check fails
    storage.bucket().getMetadata()
      .then(([metadata]) => {
        console.log('✅ Firebase Storage bucket connected successfully');
        console.log(`   Bucket name: ${metadata.name}`);
      })
      .catch(error => {
        // Log warning but don't fail - bucket might still work for uploads
        console.warn('⚠️  Could not verify storage bucket metadata (but uploads may still work)');
        console.warn(`   Bucket: ${bucketName}`);
        console.warn(`   Note: If storage is enabled in Firebase Console, uploads should work.`);
        if (error.code === 403) {
          console.warn('   Tip: Make sure your service account has "Storage Object Admin" role');
        }
      });
  }
} else {
  console.warn('⚠️  Firebase credentials not configured. Please set up .env file.');
  console.warn('   Copy backend/.env.example to backend/.env and add your Firebase credentials.');
}

module.exports = { admin, db, auth, storage };
