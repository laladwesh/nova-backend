// controllers/messageController.js

/**
 * Message Controller
 *  - createConversation:             Create a new conversation between a parent and teacher (and optionally student), with an initial message
 *  - listParentConversations:        List all conversations for a given parent
 *  - listMessagesInConversation:     List all messages in a given conversation
 *  - sendMessage:                    Send a reply in an existing conversation
 *
 * Assumptions:
 *  - authMiddleware populates req.user = { userId, role }
 *  - Models:
 *      Conversation: { parentId, teacherId, studentId, createdAt }
 *      Message:      { conversationId, senderId, content, timestamp }
 *  - Only the parent or teacher participants can view/send messages in that conversation
 */

const mongoose = require("mongoose");
const { Conversation } = require("../models/");
const { Message } = require("../models");
const { Student, Teacher } = require("../models");

module.exports = {
  // POST /messages
  // Body: { parentId, teacherId, studentId (optional), initialMessage }
  createConversation: async (req, res) => {
    try {
      const { parentId, teacherId, studentId, initialMessage } = req.body;

      // Validate required fields
      if (!parentId || !teacherId || !initialMessage) {
        return res.status(400).json({
          success: false,
          message: "parentId, teacherId, and initialMessage are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid parentId." });
      }
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid teacherId." });
      }
      if (studentId && !mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }

      // Verify teacher exists
      const teacherExists = await Teacher.exists({ _id: teacherId });
      if (!teacherExists) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      // Verify student if provided
      if (studentId) {
        const studentExists = await Student.exists({ _id: studentId });
        if (!studentExists) {
          return res
            .status(404)
            .json({ success: false, message: "Student not found." });
        }
      }

      // Create conversation
      const newConv = await Conversation.create({
        parentId,
        teacherId,
        studentId: studentId || null,
        createdAt: new Date(),
      });

      // Create initial message
      const msg = await Message.create({
        conversationId: newConv._id,
        senderId: req.user.userId,
        content: initialMessage,
        timestamp: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Conversation created successfully.",
        data: {
          conversation: newConv,
          initialMessage: msg,
        },
      });
    } catch (err) {
      console.error("messageController.createConversation error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /messages/conversations/parent/:parentId
  listParentConversations: async (req, res) => {
    try {
      const { parentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid parentId." });
      }

      // Only the parent themselves or an admin/teacher can view
      if (req.user.role === "parent" && req.user.userId !== parentId) {
        return res.status(403).json({ success: false, message: "Forbidden." });
      }

      const convos = await Conversation.find({ parentId })
        .populate("teacherId", "name teacherId")
        .populate("studentId", "name studentId")
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({ success: true, data: convos });
    } catch (err) {
      console.error("messageController.listParentConversations error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /messages/conversation/:conversationId
  listMessagesInConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid conversationId." });
      }

      // Verify conversation exists
      const conv = await Conversation.findById(conversationId).lean();
      if (!conv) {
        return res
          .status(404)
          .json({ success: false, message: "Conversation not found." });
      }

      // Authorization: only parent or teacher of this conversation can view
      const uid = req.user.userId;
      if (
        ![conv.parentId.toString(), conv.teacherId.toString()].includes(uid) &&
        req.user.role !== "school_admin"
      ) {
        return res.status(403).json({ success: false, message: "Forbidden." });
      }

      const messages = await Message.find({ conversationId })
        .sort({ timestamp: 1 })
        .populate("senderId", "name")
        .lean();

      return res.status(200).json({ success: true, data: messages });
    } catch (err) {
      console.error("messageController.listMessagesInConversation error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /messages/conversation/:conversationId
  sendMessage: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { content } = req.body;
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid conversationId." });
      }
      if (!content || typeof content !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "Content is required." });
      }

      // Verify conversation exists
      const conv = await Conversation.findById(conversationId).lean();
      if (!conv) {
        return res
          .status(404)
          .json({ success: false, message: "Conversation not found." });
      }

      // Authorization: only participants can send
      const uid = req.user.userId;
      if (
        ![conv.parentId.toString(), conv.teacherId.toString()].includes(uid) &&
        req.user.role !== "school_admin"
      ) {
        return res.status(403).json({ success: false, message: "Forbidden." });
      }

      const newMsg = await Message.create({
        conversationId,
        senderId: uid,
        content,
        timestamp: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Message sent successfully.",
        data: newMsg,
      });
    } catch (err) {
      console.error("messageController.sendMessage error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
