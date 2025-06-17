// app.js (or server.js)

// ...existing code...

require('dotenv').config();

// Initialize Firebase for FCM notifications
const admin = require('firebase-admin');
try {
  // Check if app is already initialized
  try {
    admin.app();
    console.log('Firebase Admin SDK already initialized');
  } catch (error) {
    // App not initialized, try to initialize
    console.log('Initializing Firebase Admin SDK...');
    
    // Try to find service account file
    const path = require('path');
    const fs = require('fs');
    const serviceAccountPath = path.join(__dirname, './firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      console.warn('Firebase service account file not found. FCM notifications will not work.');
      console.warn('Please create a service account file at:', serviceAccountPath);
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// ...existing code...