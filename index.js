// app.js

require("dotenv").config();
const express = require("express");
const connectDb = require("./utils/connectDb");

const app = express();
app.use(express.json()); // body parser, etc.

// Import all routers
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const classRoutes = require("./routes/classRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const eventRoutes = require("./routes/eventRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const feeRoutes = require("./routes/feeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const reportRoutes = require("./routes/reportRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const gradeRoutes = require("./routes/gradeRoutes");
const lessonPlanRoutes = require("./routes/lessonPlanRoutes");
const formRoutes = require("./routes/formRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const messageRoutes = require("./routes/messageRoutes");
const ptmRoutes = require("./routes/ptmRoutes");
const searchRoutes = require("./routes/searchRoutes");
const metadataRoutes = require("./routes/metadataRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
//test route for checking server status
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Mount them under appropriate base paths
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/schools", schoolRoutes);
app.use("/classes", classRoutes);
app.use("/teachers", teacherRoutes);
app.use("/students", studentRoutes);
app.use("/events", eventRoutes);
app.use("/calendar", calendarRoutes);
app.use("/fees", feeRoutes);
app.use("/notifications", notificationRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/reports", reportRoutes);
app.use("/assignments", assignmentRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/grades", gradeRoutes);
app.use("/lesson-plans", lessonPlanRoutes);
app.use("/forms", formRoutes);
app.use("/resources", resourceRoutes);
app.use("/messages", messageRoutes);
app.use("/ptm", ptmRoutes);
app.use("/search", searchRoutes);
app.use("/metadata", metadataRoutes);
app.use("/upload", uploadRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  await connectDb();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
