// controllers/notificationController.js

/**
 * Notification Controller
 *  - listNotifications:         Return all notifications (school‐wide announcements)
 *  - createNotification:        Create a new notification (school‐wide or specific)
 *  - deleteNotification:        Delete a notification by ID
 *
 *  - listTeacherNotifications:  Return notifications where teacherId matches or audience includes "all_teachers"
 *  - createTeacherNotification: Create a notification targeted to a specific teacher
 *
 *  - listParentNotifications:   Return notifications where audience includes "all_parents" (or specific to children)
 *  - updateParentPreferences:   Stub for updating parent notification preferences
 *
 * Assumptions:
 *  - authMiddleware populates req.user with { userId, role }
 *  - Only "school_admin" (or similarly privileged roles) can create/delete general notifications
 *  - Only teachers can create notifications under /teacher/:teacherId
 *  - Notification model fields: type, message, studentId, teacherId, audience (['all_students','all_teachers','all_parents']), scheduleAt, issuedAt
 */

const mongoose = require("mongoose");
const { Notification } = require("../models");
const { Student, Teacher } = require("../models");
const fcmService = require("../services/fcmService");
const { admin, isFirebaseInitialized } = require('../config/firebase');

module.exports = {
  // GET /notifications
  listNotifications: async (req, res) => {
    try {
      const { schoolId } = req.query;
      
      // Validate schoolId if provided
      if (schoolId && !mongoose.Types.ObjectId.isValid(schoolId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid schoolId format"
        });
      }
      
      // Build the filter based on schoolId
      const filter = {};
      
      // Add schoolId filter if provided
      if (schoolId) {
        filter.schoolId = schoolId;
      }
      
      // Query notifications with the filter
      const notifications = await Notification.find(filter).sort({ issuedAt: -1 });

      return res.status(200).json({ 
        success: true, 
        data: notifications,
        count: notifications.length
      });
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
      const { 
        type, 
        message, 
        studentId, 
        teacherId, 
        classId, 
        parentId, 
        audience, 
        schoolId
      } = req.body;

      if (!type || !message) {
        return res.status(400).json({
          success: false,
          message: "type and message are required.",
        });
      }
      if (!["Student", "Teacher", "Announcement", "Class", "Parent"].includes(type)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid type. Must be one of: Student, Teacher, Announcement, Class, Parent.",
        });
      }
      
      if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
        return res.status(400).json({
          success: false,
          message: "Valid schoolId is required."
        });
      }

      const notificationData = { 
        type, 
        message, 
        schoolId,
        createdBy: req.user._id      
      };

      if (type === "Student") {
        // Add student-specific fields
        if (studentId) {
          notificationData.studentId = studentId;
        }
      } else if (type === "Teacher") {
        // Add teacher-specific fields
        if (teacherId) {
          notificationData.teacherId = teacherId;
        }
      } else if (type === "Class") {
        // Add class-specific fields
        if (classId) {
          notificationData.classId = classId;
        }
      } else if (type === "Parent") {
        // Add parent-specific fields
        if (parentId) {
          notificationData.parentId = parentId;
        }
      }

      // Add audience if provided
      if (audience && Array.isArray(audience)) {
        notificationData.audience = audience;
      }

      // Create notification
      const newNotification = await Notification.create(notificationData);

      // Always send FCM notification (no scheduling)
      await module.exports.sendFCMNotification(newNotification);

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
      const { message, scheduleAt, schoolId, sendImmediately = false } = req.body;

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
      if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
        return res.status(400).json({
          success: false,
          message: "Valid schoolId is required."
        });
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
        schoolId,
        createdBy: req.user._id // Add createdBy from bearer token
      };

      if (scheduleAt) {
        notificationData.scheduleAt = new Date(scheduleAt);
        console.log(`Notification scheduled for: ${notificationData.scheduleAt}`);
      } else {
        notificationData.issuedAt = new Date();
      }

      const newNotification = await Notification.create(notificationData);
      console.log(`Created notification: ${newNotification._id}`);

      // Send FCM notification if not scheduled OR sendImmediately is true
      if (!scheduleAt || sendImmediately) {
        console.log(`Attempting to send FCM notification for ID: ${newNotification._id}`);
        const fcmResult = await module.exports.sendFCMNotification(newNotification);
        console.log(`FCM notification result: ${JSON.stringify(fcmResult)}`);
      } else {
        console.log(`FCM notification will be sent at scheduled time: ${notificationData.scheduleAt}`);
      }

      // Ensure consistent response format
      const response = {
        success: true,
        message: scheduleAt && !sendImmediately 
          ? "Teacher notification scheduled successfully for later delivery." 
          : "Teacher notification created and sent successfully.",
        data: newNotification
      };
      
      return res.status(201).json(response);
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

  // POST /notifications/class/:classId
  createClassNotification: async (req, res) => {
    try {
      const { classId } = req.params;
      const { message, scheduleAt, schoolId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }
      if (!message) {
        return res
          .status(400)
          .json({ success: false, message: "message is required." });
      }
      if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
        return res.status(400).json({
          success: false,
          message: "Valid schoolId is required."
        });
      }

      const notificationData = {
        type: "Class",
        message,
        classId,
        schoolId,
        createdBy: req.user._id // Add createdBy from bearer token
      };

      if (scheduleAt) {
        notificationData.scheduleAt = new Date(scheduleAt);
      } else {
        notificationData.issuedAt = new Date();
      }

      const newNotification = await Notification.create(notificationData);

     

      // Send FCM notification if not scheduled
      if (!scheduleAt) {
        await module.exports.sendFCMNotification({
    ...newNotification.toObject(),
    classId // ensure classId is present and correct
  });
      }

      return res.status(201).json({
        success: true,
        message: "Class notification created successfully.",
        data: newNotification,
      });
    } catch (err) {
      console.error(
        "notificationController.createClassNotification error:",
        err
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /notifications/student/:studentId
  createStudentNotification: async (req, res) => {
    try {
      const { studentId } = req.params;
      const { message, scheduleAt, schoolId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid studentId." });
      }
      if (!message) {
        return res
          .status(400)
          .json({ success: false, message: "message is required." });
      }
      if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
        return res.status(400).json({
          success: false,
          message: "Valid schoolId is required."
        });
      }

      // Ensure student exists
      const studentExists = await Student.exists({ _id: studentId });
      if (!studentExists) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      const notificationData = {
        type: "Student",
        message,
        studentId,
        schoolId,
        createdBy: req.user._id // Add createdBy from bearer token
      };

      if (scheduleAt) {
        notificationData.scheduleAt = new Date(scheduleAt);
      } else {
        notificationData.issuedAt = new Date();
      }

      const newNotification = await Notification.create(notificationData);

      // Send FCM notification if not scheduled
      if (!scheduleAt) {
        await module.exports.sendFCMNotification(newNotification);
      }

      return res.status(201).json({
        success: true,
        message: "Student notification created successfully.",
        data: newNotification,
      });
    } catch (err) {
      console.error(
        "notificationController.createStudentNotification error:",
        err
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /notifications/parent/:parentId
  createParentNotification: async (req, res) => {
    try {
      const { parentId } = req.params;
      const { message, scheduleAt, schoolId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid parentId." });
      }
      if (!message) {
        return res
          .status(400)
          .json({ success: false, message: "message is required." });
      }
      if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
        return res.status(400).json({
          success: false,
          message: "Valid schoolId is required."
        });
      }

      const notificationData = {
        type: "Parent",
        message,
        parentId,
        schoolId,
        createdBy: req.user._id // Add createdBy from bearer token
      };

      if (scheduleAt) {
        notificationData.scheduleAt = new Date(scheduleAt);
      } else {
        notificationData.issuedAt = new Date();
      }

      const newNotification = await Notification.create(notificationData);

      // Send FCM notification if not scheduled
      if (!scheduleAt) {
        await module.exports.sendFCMNotification(newNotification);
      }

      return res.status(201).json({
        success: true,
        message: "Parent notification created successfully.",
        data: newNotification,
      });
    } catch (err) {
      console.error(
        "notificationController.createParentNotification error:",
        err
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // Helper method to send FCM notifications
  sendFCMNotification: async (notification) => {
    try {
      // Check if Firebase is initialized early to avoid multiple error messages
      if (!isFirebaseInitialized()) {
        console.warn(`Firebase not initialized. Cannot send notification of type ${notification.type}`);
        return { success: false, error: 'Firebase not initialized' };
      }
      
      console.log(`========== FCM Notification ==========`);
      console.log(`Type: ${notification.type}`);
      console.log(`ID: ${notification._id}`);
      
      
      // Extract title and body from notification message
      const body = notification.message;
      let title = 'School Notification';
      
      // Set appropriate title based on notification type
      switch(notification.type) {
        case 'Announcement':
          title = 'School Announcement';
          break;
        case 'Teacher':
          title = 'Teacher Notification';
          break;
        case 'Student':
          title = 'Student Notification';
          break;
        case 'Class':
          title = 'Class Notification';
          break;
        case 'Parent':
          title = 'Parent Notification';
          break;
        default:
          title = 'School Notification';
      }
      
      const FCMToken = require('../models/FCMToken');
      let result;
      
      if (notification.type === "Announcement") {
        console.log(`Looking for tokens with schoolId: ${notification.schoolId}`);
        
        // Get all FCM tokens for this school
        const schoolTokens = await FCMToken.find({ 
          schoolId: notification.schoolId,
          isActive: true 
        }).select('token');
        
        console.log(`Found ${schoolTokens.length} FCM tokens with direct schoolId match`);
        
        // Also look for topic subscribers
        const topicTokens = await FCMToken.find({
          topic: `school_${notification.schoolId.toString()}`,
          isActive: true
        }).select('token');
        
        console.log(`Found ${topicTokens.length} FCM tokens with school topic subscription`);
        
        // Combine both token arrays, ensuring uniqueness
        const allTokens = [...new Set([...schoolTokens, ...topicTokens])];
        
        if (allTokens.length > 0) {
          // Send notification to all collected tokens
          try {
            let successCount = 0;
            let failureCount = 0;
            
            for (const token of allTokens) {
              try {
                const message = {
                  notification: {
                    title,
                    body
                  },
                  data: {
                    notificationId: notification._id.toString(),
                    type: 'announcement',
                    schoolId: notification.schoolId.toString()
                  },
                  token // Send to individual token
                };
                
                await admin.messaging().send(message);
                successCount++;
                console.log(`Successfully sent to token: ${token.substring(0, 10)}...`);
              } catch (err) {
                console.warn(`Failed to send to token: ${token.substring(0, 10)}...`, err.message);
                failureCount++;
              }
            }
            
            console.log(`Announcement notification results - Success: ${successCount}, Failures: ${failureCount}`);
            result = { 
              success: successCount > 0,
              response: {
                successCount,
                failureCount
              }
            };
          } catch (batchError) {
            console.error('Error in batch token processing:', batchError);
            
            // Fallback to topic-based approach if token-based sending fails
            result = await fcmService.sendToTopic(notification.schoolId.toString(), title, body, {
              notificationId: notification._id.toString(),
              type: 'announcement'
            });
          }
        } else {
          console.warn(`No active FCM tokens found for school ${notification.schoolId}`);
          
          // Try sending to topic directly as a last resort
          result = await fcmService.sendToTopic(`school_${notification.schoolId}`, title, body, {
            notificationId: notification._id.toString(),
            type: 'announcement'
          });
        }
      } else if (notification.type === "Teacher" && notification.teacherId) {
        console.log(`Looking for tokens with userId: ${notification.teacherId} (Teacher)`);
        
        // Get FCM tokens for this teacher through FCM service or directly
        const teacherTokens = await FCMToken.find({ 
          userId: notification.teacherId, 
          isActive: true 
        }).select('token');
        
        console.log(`Found ${teacherTokens.length} FCM tokens for teacher ${notification.teacherId}`);
        
            // Send to specific student
        result = await fcmService.sendToUser(notification.teacherId, title, body, {
          notificationId: notification._id.toString(),
          type: 'teacher'
        });
        
        // Rest of teacher notification logic...
      } else if (notification.type === "Student" && notification.studentId) {
        console.log(`Looking for tokens with userId: ${notification.studentId} (Student)`);
        
        // Get FCM tokens for this student
        const studentTokens = await FCMToken.find({ 
          userId: notification.studentId, 
          isActive: true 
        }).select('token');
        
        console.log(`Found ${studentTokens.length} FCM tokens for student ${notification.studentId}`);
        
        
        // Send to specific student
        result = await fcmService.sendToUser(notification.studentId, title, body, {
          notificationId: notification._id.toString(),
          type: 'student'
        });
      } else if (notification.type === "Class" && notification.classId) {
        
        console.log(`Looking for tokens with classId: ${notification.classId}`);
        
        // Get FCM tokens for users in this class
        const classTokens = await FCMToken.find({ 
          classId: notification.classId, 
          isActive: true 
        }).select('token');
        
        console.log(`Found ${classTokens.length} FCM tokens with direct class membership`);
        

        
        // Send to all users in a specific class
        result = await fcmService.sendToClass(notification.classId, notification.schoolId, title, body, {
          notificationId: notification._id.toString(),
          type: 'class',
          classId: notification.classId.toString()
        });
      } else if (notification.type === "Parent" && notification.parentId) {
        console.log(`Looking for tokens with userId: ${notification.parentId} (Parent)`);
        
        // Get FCM tokens for this parent
        const parentTokens = await FCMToken.find({ 
          userId: notification.parentId, 
          isActive: true 
        }).select('token');
        
        console.log(`Found ${parentTokens.length} FCM tokens for parent ${notification.parentId}`);

        
        // Send to specific parent
        result = await fcmService.sendToUser(notification.parentId, title, body, {
          notificationId: notification._id.toString(),
          type: 'parent'
        });
      }
      
      if (result && !result.success) {
        console.warn(`Failed to send FCM notification: ${result.error || 'Unknown error'}`);
      } else {
        console.log(`Successfully sent FCM notification for ${notification.type}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending FCM notification:', error);
      return { success: false, error: error.message };
    }
  },
};

