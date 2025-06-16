// firebase.js
const admin = require('firebase-admin');

// Track initialization status
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK using credentials from environment variables
 */
const initializeFirebase = () => {
  if (isInitialized) {
    console.log('Firebase Admin SDK already initialized');
    return true;
  }

  try {
    // If someone else already initialized the default app, honor it
    try {
      admin.app();
      console.log('Firebase Admin SDK already initialized via another method');
      isInitialized = true;
      return true;
    } catch {
      // Not yet initialized, continue below
    }

    // Build the serviceAccount object from env vars
    const serviceAccount = {
      type: process.env.TYPE,
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      // replace literal '\n' with real newlines:
      private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      auth_uri: process.env.AUTH_URI,
      token_uri: process.env.TOKEN_URI,
      auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
      universe_domain: process.env.UNIVERSE_DOMAIN,
    };

    // Validate required fields
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      console.error('Missing Firebase service account environment variables');
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully from env');
    isInitialized = true;
    return true;

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
  } catch {
    return false;
  }
};

module.exports = {
  initializeFirebase,
  isFirebaseInitialized,
  admin,
};
