// controllers/notificationController.js

/**
 * Notification Controller
 *  - listNotifications:         Return all notifications (school‐wide announcements)
 *  - createNotification:        Create a new notification (school‐wide or specific)
 *  - deleteNotification:        Delete a notification by ID
 *
 *  - listTeacherNotifications:  Return notifications where teacherId matches or audience includes “all_teachers”
 *  - createTeacherNotification: Create a notification targeted to a specific teacher
 *
 *  - listParentNotifications:   Return notifications where audience includes “all_parents” (or specific to children)
 *  - updateParentPreferences:   Stub for updating parent notification preferences
 *
 * Assumptions:
 *  - authMiddleware populates req.user with { userId, role }
 *  - Only “school_admin” (or similarly privileged roles) can create/delete general notifications
 *  - Only teachers can create notifications under /teacher/:teacherId
 *  - Notification model fields: type, message, studentId, teacherId, audience (['all_students','all_teachers','all_parents']), scheduleAt, issuedAt
 */

const mongoose = require("mongoose");
const { Notification } = require("../models");
const { Student, Teacher } = require("../models");

module.exports = {
  // GET /notifications
  listNotifications: async (req, res) => {
    try {
      // Return all school‐wide announcements and any notifications not specifically tied to a student/teacher
      const notifications = await Notification.find({
        $or: [
          { type: "Announcement" },
          {
            audience: { $in: ["all_students", "all_teachers", "all_parents"] },
          },
        ],
      }).sort({ issuedAt: -1 });
      return res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      console.error("notificationController.listNotifications error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /notifications
  createNotification: async (req, res) => {
    try {
      const { type, message, studentId, teacherId, audience, scheduleAt } =
        req.body;

      if (!type || !message) {
        return res.status(400).json({
          success: false,
          message: "type and message are required.",
        });
      }
      if (!["Student", "Teacher", "Announcement"].includes(type)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid type. Must be one of: Student, Teacher, Announcement.",
        });
      }

      const notificationData = { type, message };

      if (type === "Student") {
        if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
          return res
            .status(400)
            .json({ success: false, message: "Valid studentId is required." });
        }
        notificationData.studentId = studentId;
      } else if (type === "Teacher") {
        if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
          return res
            .status(400)
            .json({ success: false, message: "Valid teacherId is required." });
        }
        notificationData.teacherId = teacherId;
      } else if (type === "Announcement") {
        if (!Array.isArray(audience) || audience.length === 0) {
          return res.status(400).json({
            success: false,
            message:
              'audience array is required for announcements (e.g. ["all_students"]).',
          });
        }
        notificationData.audience = audience;
      }

      if (scheduleAt) {
        notificationData.scheduleAt = new Date(scheduleAt);
      } else {
        notificationData.issuedAt = new Date();
      }

      const newNotification = await Notification.create(notificationData);
      return res.status(201).json({
        success: true,
        message: "Notification created successfully.",
        data: newNotification,
      });
    } catch (err) {
      console.error("notificationController.createNotification error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /notifications/:notificationId
  deleteNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid notificationId." });
      }

      const deleted = await Notification.findByIdAndDelete(notificationId);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found." });
      }

      return res
        .status(200)
        .json({ success: true, message: "Notification deleted successfully." });
    } catch (err) {
      console.error("notificationController.deleteNotification error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /notifications/teacher/:teacherId
  listTeacherNotifications: async (req, res) => {
    try {
      const { teacherId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid teacherId." });
      }

      // Return notifications directly for this teacher OR audience contains 'all_teachers'
      const notifications = await Notification.find({
        $or: [{ teacherId }, { audience: "all_teachers" }],
      }).sort({ issuedAt: -1 });

      return res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      console.error(
        "notificationController.listTeacherNotifications error:",
        err
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /notifications/teacher/:teacherId
  createTeacherNotification: async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { message, scheduleAt } = req.body;

      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid teacherId." });
      }
      if (!message) {
        return res
          .status(400)
          .json({ success: false, message: "message is required." });
      }

      // Ensure teacher exists
      const teacherExists = await Teacher.exists({ _id: teacherId });
      if (!teacherExists) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      const notificationData = {
        type: "Teacher",
        message,
        teacherId,
      };

      if (scheduleAt) {
        notificationData.scheduleAt = new Date(scheduleAt);
      } else {
        notificationData.issuedAt = new Date();
      }

      const newNotification = await Notification.create(notificationData);
      return res.status(201).json({
        success: true,
        message: "Teacher notification created successfully.",
        data: newNotification,
      });
    } catch (err) {
      console.error(
        "notificationController.createTeacherNotification error:",
        err
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /notifications/parent/:parentId
  listParentNotifications: async (req, res) => {
    try {
      const { parentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid parentId." });
      }

      // Return notifications where audience includes 'all_parents'
      // In a more complete system, you'd find which students belong to this parent, then return notifications for those studentIds as well.
      const notifications = await Notification.find({
        $or: [
          { audience: "all_parents" },
          // If a specific parent-child notification system is implemented, filter by studentId belonging to parent
        ],
      }).sort({ issuedAt: -1 });

      return res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      console.error(
        "notificationController.listParentNotifications error:",
        err
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /notifications/parent/:parentId/preferences
  updateParentPreferences: async (req, res) => {
    try {
      const { parentId } = req.params;
      const { viaEmail, viaPush } = req.body;

      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid parentId." });
      }
      if (viaEmail === undefined && viaPush === undefined) {
        return res.status(400).json({
          success: false,
          message: "At least one of viaEmail or viaPush must be provided.",
        });
      }

      // Stub: In a real app, you'd update the parent’s preference document.
      // e.g., ParentPreference.updateOne({ parentId }, { viaEmail, viaPush }, { upsert: true })

      return res.status(200).json({
        success: true,
        message: "Parent notification preferences updated successfully.",
      });
    } catch (err) {
      console.error(
        "notificationController.updateParentPreferences error:",
        err
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
