// server.js (or app.js)

// ...existing code...
require('dotenv').config();
// Initialize Firebase Admin SDK
const { initializeFirebase } = require('./config/firebase');
initializeFirebase();

// ...existing code...