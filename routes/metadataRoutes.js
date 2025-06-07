// routes/metadataRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/authMiddleware");
const metadataController = require("../controllers/metadataController");

/**
 * 1. GET '/grades' – list grade options
 *    – Any authenticated user may fetch.
 */
router.get("/grades", authenticate, metadataController.listGrades);

/**
 * 2. GET '/subjects' – list subject options
 *    – Any authenticated user may fetch.
 */
router.get("/subjects", authenticate, metadataController.listSubjects);

/**
 * 3. GET '/event-types' – list event type options
 *    – Any authenticated user may fetch.
 */
router.get("/event-types", authenticate, metadataController.listEventTypes);

/**
 * 4. GET '/fee-types' – list fee type options
 *    – Any authenticated user may fetch.
 */
router.get("/fee-types", authenticate, metadataController.listFeeTypes);

/**
 * 5. GET '/form-types' – list form type options
 *    – Any authenticated user may fetch.
 */
router.get("/form-types", authenticate, metadataController.listFormTypes);

module.exports = router;
