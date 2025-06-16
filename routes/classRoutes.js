/**
 * routes/classRoutes.js
 *
 * Defines all HTTP endpoints related to Class operations.
 * Applies authentication and admin-only authorization where required.
 */
const express = require("express");
const router = express.Router();

// Middleware to verify authentication and admin role
const { authenticate, isAdmin } = require("../middleware/authMiddleware");
// Controller functions handling Class business logic
const classController = require("../controllers/classController");

///////////////////////////
// Class CRUD Endpoints
///////////////////////////

/**
 * GET '/'
 *  - List all classes in the system
 *  - Accessible by any authenticated user
 */
router.get(
  "/",
  authenticate,           // Ensure user is authenticated
  classController.listClasses // Handler returns array of classes
);

/**
 * POST '/'
 *  - Create a new class
 *  - Only Admin users may perform this action
 *  - Expects class details (e.g., name, grade, section) in request body
 */
router.post(
  "/",
  authenticate,           // Ensure user is authenticated
  isAdmin,                // Only Admin can create classes
  classController.createClass // Handler creates a new class document
);

/**
 * GET '/:classId'
 *  - Retrieve details for a specific class by ID
 *  - Accessible by any authenticated user
 */
router.get(
  "/:classId",
  authenticate,           // Ensure user is authenticated
  classController.getClassById // Handler returns class document
);

/**
 * PUT '/:classId'
 *  - Update an existing class
 *  - Only Admin users may perform this action
 *  - Accepts updates to class fields in request body
 */
router.put(
  "/:classId",
  authenticate,           // Ensure user is authenticated
  isAdmin,                // Only Admin can update classes
  classController.updateClass // Handler updates class document
);

/**
 * DELETE '/:classId'
 *  - Delete an existing class by ID
 *  - Only Admin users may perform this action
 */
router.delete(
  "/:classId",
  authenticate,           // Ensure user is authenticated
  isAdmin,                // Only Admin can delete classes
  classController.deleteClass // Handler removes class document
);

///////////////////////////
// Class Relations Endpoints
///////////////////////////

/**
 * GET '/:classId/teachers'
 *  - List all teachers assigned to a specific class
 *  - Accessible by any authenticated user
 */
router.get(
  "/:classId/teachers",
  authenticate,               // Ensure user is authenticated
  classController.getClassTeachers // Handler returns array of teacher docs
);

/**
 * PUT '/:classId/teachers'
 *  - Assign or sync teachers to a class
 *  - Only Admin users may perform this action
 *  - Expects array of teacher IDs in request body
 */
router.put(
  "/:classId/teachers",
  authenticate,               // Ensure user is authenticated
  isAdmin,                    // Only Admin can modify assignments
  classController.assignTeachersToClass // Handler updates both sides of relation
);

/**
 * GET '/:classId/subjects'
 *  - List all subjects assigned to a specific class
 *  - Accessible by any authenticated user
 */
router.get(
  "/:classId/subjects",
  authenticate,               // Ensure user is authenticated
  classController.getClassSubjects // Handler returns array of subject docs
);

/**
 * PUT '/:classId/subjects'
 *  - Assign or update subjects for a class
 *  - Only Admin users may perform this action
 *  - Expects array of subject IDs in request body
 */
router.put(
  "/:classId/subjects",
  authenticate,               // Ensure user is authenticated
  isAdmin,                    // Only Admin can modify assignments
  classController.setClassSubjects // Handler updates subjects array in class doc
);

/**
 * GET '/:classId/students'
 *  - List all students assigned to a specific class
 *  - Accessible by any authenticated user
 */
router.get(
  "/:classId/students",
  authenticate,               // Ensure user is authenticated
  classController.getClassStudents // Handler returns array of student docs
);

/**
 * PUT '/:classId/students'
 *  - Assign or sync students to a class
 *  - Only Admin users may perform this action
 *  - Expects array of student IDs in request body
 */
router.put(
  "/:classId/students",
  authenticate,               // Ensure user is authenticated
  isAdmin,                    // Only Admin can modify assignments
  classController.assignStudentsToClass // Handler updates both sides of relation
);

// Export configured router for mounting in main application
module.exports = router;
