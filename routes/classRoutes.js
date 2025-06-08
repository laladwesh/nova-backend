// routes/classRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate, isAdmin } = require("../middleware/authMiddleware");
const classController = require("../controllers/classController");

/**
 * 1. GET '/' – list all classes
 *    – Any authenticated user can view the list of classes.
 */
router.get("/", authenticate, classController.listClasses);

/**
 * 2. POST '/' – create a new class
 *    – Only Admin can create classes.
 */
router.post("/", authenticate, isAdmin, classController.createClass);

/**
 * 3. GET '/:classId' – get a class by ID
 *    – Any authenticated user can view a class’s details.
 */
router.get("/:classId", authenticate, classController.getClassById);

/**
 * 4. PUT '/:classId' – update an existing class
 *    – Only Admin can update classes.
 */
router.put("/:classId", authenticate, isAdmin, classController.updateClass);

/**
 * 5. DELETE '/:classId' – delete a class
 *    – Only Admin can delete classes.
 */
router.delete("/:classId", authenticate, isAdmin, classController.deleteClass);

/**
 * 6. GET '/:classId/teachers' – list teachers assigned to a class
 *    – Any authenticated user can view which teachers are assigned.
 */
router.get(
  "/:classId/teachers",
  authenticate,
  classController.getClassTeachers
);

/**
 * 7. PUT '/:classId/teachers' – assign teachers to a class (sync both sides)
 *    – Only Admin can modify a class’s teacher assignments.
*/
router.put(
  "/:classId/teachers",
  authenticate,
  isAdmin,
  classController.assignTeachersToClass
);

/**
 * 8. GET '/:classId/subjects' – list subjects assigned to a class
 *    – Any authenticated user can view which subjects are assigned.
 */
router.get(
  "/:classId/subjects",
  authenticate,
  classController.getClassSubjects
);

/**
 * 9. PUT '/:classId/subjects' – assign subjects to a class
 *    – Only Admin can modify a class’s subject assignments.
 */
router.put(
  "/:classId/subjects",
  authenticate,
  isAdmin,
  classController.setClassSubjects
);

/**
 * 10. GET '/:classId/students' – list students assigned to a class
 *     – Any authenticated user can view which students are assigned.
 */
router.get(
  "/:classId/students",
  authenticate,
  classController.getClassStudents
);

/**
 * 11. PUT '/:classId/students' – assign students to a class (sync both sides)
 *     – Only Admin can modify a class's student assignments.
 */
router.put(
  "/:classId/students",
  authenticate,
  isAdmin,
  classController.assignStudentsToClass
);

module.exports = router;
