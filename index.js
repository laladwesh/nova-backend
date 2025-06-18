// index.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const connectDb = require('./utils/connectDb');
const { initializeFirebase } = require('./config/firebase');

const app = express();

// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── FIREBASE INIT ──────────────────────────────────────────────────────────
console.log('Initializing Firebase…');
const firebaseInitialized = initializeFirebase();
console.log('Firebase initialized:', firebaseInitialized);

// ─── MOUNT ALL /api ROUTES ──────────────────────────────────────────────────
const api = express.Router();

api.get('/', (req, res) => {
  res.json({ message: 'API is up  running' });
});

api.use('/auth', require('./routes/authRoutes'));
api.use('/users', require('./routes/userRoutes'));
api.use('/schools', require('./routes/schoolRoutes'));
api.use('/classes', require('./routes/classRoutes'));
api.use('/teachers', require('./routes/teacherRoutes'));
api.use('/students', require('./routes/studentRoutes'));
api.use('/events', require('./routes/eventRoutes'));
api.use('/calendar', require('./routes/calendarRoutes'));
api.use('/fees', require('./routes/feeRoutes'));
api.use('/notifications', require('./routes/notificationRoutes'));
api.use('/schedules', require('./routes/scheduleRoutes'));
api.use('/analytics', require('./routes/analyticsRoutes'));
api.use('/reports', require('./routes/reportRoutes'));
api.use('/assignments', require('./routes/assignmentRoutes'));
api.use('/attendance', require('./routes/attendanceRoutes'));
api.use('/grades', require('./routes/gradeRoutes'));
api.use('/lesson-plans', require('./routes/lessonPlanRoutes'));
api.use('/forms', require('./routes/formRoutes'));
api.use('/resources', require('./routes/resourceRoutes'));
api.use('/messages', require('./routes/messageRoutes'));
api.use('/ptm', require('./routes/ptmRoutes'));
api.use('/search', require('./routes/searchRoutes'));
api.use('/metadata', require('./routes/metadataRoutes'));
api.use('/upload', require('./routes/uploadRoutes'));
api.use('/fcm', require('./routes/fcmRoutes'));
api.use('/story', require('./routes/storyRoutes'));

// Fallback for any undefined /api route
api.use((req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.use('/api', api);


if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, 'client/build');
  app.use(express.static(clientBuildPath));

  // any request that falls through (and isn’t /api) will serve index.html
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}



// ─── SERVE REACT IN PRODUCTION ──────────────────────────────────────────────
// if (process.env.NODE_ENV === 'production') {
//   const clientBuildPath = path.join(__dirname, 'client/build');
//   app.use(express.static(clientBuildPath));

//   // Return index.html for all non-API GET requests
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(clientBuildPath, 'index.html'));
//   });
// }

// ─── START SERVER ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  await connectDb();

  // Retry Firebase init if needed
  if (!firebaseInitialized) {
    console.log('Re-initializing Firebase after DB connect…');
    initializeFirebase();
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
