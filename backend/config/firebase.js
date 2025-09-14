const admin = require('firebase-admin');

let db;

const initializeFirebase = () => {
  try {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });
    }

    db = admin.firestore();
    console.log('✅ Firebase initialized successfully');
    
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

const getFirestore = () => {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
};

const getAuth = () => {
  return admin.auth();
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  admin
};
