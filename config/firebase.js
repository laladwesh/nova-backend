const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Track initialization status
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
const initializeFirebase = () => {
  // Don't initialize more than once
  if (isInitialized) {
    console.log('Firebase Admin SDK already initialized');
    return true;
  }

  try {
    // Check if app is already initialized another way
    try {
      admin.app();
      console.log('Firebase Admin SDK already initialized via another method');
      isInitialized = true;
      return true;
    } catch (error) {
      // App not initialized, continue to initialize
    }

    // Path to service account credentials file
    const serviceAccountPath = path.join(__dirname, 'school-e04b8-firebase-adminsdk-fbsvc-229f4fa456.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      console.log('Found Firebase service account at:', serviceAccountPath);
      const serviceAccount = require(serviceAccountPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log('Firebase Admin SDK initialized successfully');
      isInitialized = true;
      return true;
    } else {
      console.error('Firebase service account file not found at:', serviceAccountPath);
      console.error('Trying alternate locations...');
      
      // Try alternate locations
      const altPaths = [
        path.join(__dirname, '../firebase-service-account.json'),
        path.join(__dirname, '../config/firebase-service-account.json')
      ];
      
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log('Found Firebase service account at:', altPath);
          const serviceAccount = require(altPath);
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          
          console.log('Firebase Admin SDK initialized successfully');
          isInitialized = true;
          return true;
        }
      }
      
      console.error('Firebase service account file not found at any location!');
      console.error('FCM notifications will not be sent!');
      return false;
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    return false;
  }
};

/**
 * Check if Firebase is initialized
 */
const isFirebaseInitialized = () => {
  if (isInitialized) return true;
  
  try {
    admin.app();
    isInitialized = true;
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  initializeFirebase,
  isFirebaseInitialized,
  admin
};
