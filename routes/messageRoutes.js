// routes/messageRoutes.js
const express = require("express");
const router = express.Router();

const {
  authenticate,
  isAdmin,
  isTeacher,
  isParent,
} = require("../middleware/authMiddleware");
const messageController = require("../controllers/messageController");

/**
 * 1. POST '/' – Create a new conversation (initial message)
 *    – Any authenticated user (student, parent, teacher, admin) may initiate a conversation.
 */
router.post("/", authenticate, messageController.createConversation);

/**
 * 2. GET '/conversations/parent/:parentId' – List conversations for a parent
 *    – Only the parent themself or an Admin can view this list.
 */
router.get(
  "/conversations/parent/:parentId",
  authenticate,
  (req, res, next) => {
    const { parentId } = req.params;
    const { _id, role } = req.user;
    if (
      role === "school_admin" ||
      (_id.toString() === parentId && role === "parent")
    ) {
      return next();
    }
    return res
      .status(403)
      .json({
        success: false,
        message: "Only that parent or Admin may view these conversations.",
      });
  },
  messageController.listParentConversations
);

/**
 * 3. GET '/conversation/:conversationId' – List messages in a conversation
 *    – Any authenticated participant (parent, teacher) or Admin can view.
 *    – We assume the controller itself verifies that the requesting user is a participant.
 *    – At route level, we require authentication only.
 */
router.get(
  "/conversation/:conversationId",
  authenticate,
  messageController.listMessagesInConversation
);

/**
 * 4. POST '/conversation/:conversationId' – Send a message in a conversation
 *    – Any authenticated participant (parent or teacher) or Admin can send.
 *    – Controller should verify that req.user is a participant.
 */
router.post(
  "/conversation/:conversationId",
  authenticate,
  messageController.sendMessage
);

module.exports = router;
