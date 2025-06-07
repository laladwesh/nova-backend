// routes/searchRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const searchController = require("../controllers/searchController");

/**
 * 1. GET '/users' – search across all users (students, teachers, parents, etc.)
 *    – Any authenticated user may perform a user lookup.
 */
router.get("/users", authenticate, searchController.searchUsers);

/**
 * 2. GET '/students' – search students (by name, studentId, etc.)
 *    – Any authenticated user may search students.
 */
router.get("/students", authenticate, searchController.searchStudents);

/**
 * 3. GET '/teachers' – search teachers (by name, teacherId, subject, etc.)
 *    – Any authenticated user may search teachers.
 */
router.get("/teachers", authenticate, searchController.searchTeachers);

/**
 * 4. GET '/resources' – search resource library (by title, subject, uploader, etc.)
 *    – Any authenticated user may search resources.
 */
router.get("/resources", authenticate, searchController.searchResources);

module.exports = router;
