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
      const { type, message, studentId, teacherId, classId, parentId, audience, scheduleAt, schoolId } =
        req.body;

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
        createdBy: req.user._id // Store the ID of the user creating the notification
      };

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
      } else if (type === "Class") {
        if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Valid classId is required." });
        }
        notificationData.classId = classId;
      } else if (type === "Parent") {
        if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
          return res
            .status(400)
            .json({ success: false, message: "Valid parentId is required." });
        }
        notificationData.parentId = parentId;
      }

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
        await module.exports.sendFCMNotification(newNotification);
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
      console.log('=== SENDING FCM NOTIFICATION ===');
      console.log(`Notification ID: ${notification._id}`);
      console.log(`Notification Type: ${notification.type}`);
      
      const title = `${notification.type} Notification`;
      const body = notification.message;
      let result;
      
      // Log what we're about to send
      console.log(`Sending ${notification.type} notification: ${body}`);
      
      // Check if Firebase is initialized early to avoid multiple error messages
      if (!isFirebaseInitialized()) {
        console.warn(`Firebase not initialized. Cannot send notification of type ${notification.type}`);
        return { success: false, error: 'Firebase not initialized' };
      }
      
      if (notification.type === "Announcement") {
        try {
          // Get all FCM tokens for this school
          const FCMToken = require('../models/FCMToken');
          const schoolTokens = await FCMToken.find({ 
            schoolId: notification.schoolId,
            isActive: true 
          }).select('token');
          
          console.log(`Found ${schoolTokens.length} FCM tokens for school ${notification.schoolId}`);
          
          if (schoolTokens.length > 0) {
            const tokens = schoolTokens.map(doc => doc.token);
            
            // Handle batch sending based on what Firebase Admin SDK supports
            try {
              // Try sending tokens individually since sendMulticast isn't available
              let successCount = 0;
              let failureCount = 0;
              
              for (const token of tokens) {
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
            console.warn(`No FCM tokens found for school ${notification.schoolId}`);
            
            // Try to find tokens with topics matching the school
            const topicTokens = await FCMToken.find({
              $or: [
                { topic: notification.schoolId.toString() },
                { topic: `school_${notification.schoolId.toString()}` }
              ],
              isActive: true
            }).select('token');
            
            console.log(`Found ${topicTokens.length} FCM tokens with school topic for ${notification.schoolId}`);
            
            if (topicTokens.length > 0) {
              const tokens = topicTokens.map(doc => doc.token);
              
              // Process tokens in batches like before
              const batchSize = 500;
              let successCount = 0;
              let failureCount = 0;
              
              for (let i = 0; i < tokens.length; i += batchSize) {
                const batch = tokens.slice(i, i + batchSize);
                
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
                    tokens: batch
                  };
                  
                  const batchResponse = await admin.messaging().sendMulticast(message);
                  successCount += batchResponse.successCount;
                  failureCount += batchResponse.failureCount;
                  
                  console.log(`Topic tokens batch ${i/batchSize + 1} sent. Success: ${batchResponse.successCount}/${batch.length}`);
                } catch (err) {
                  console.warn(`Failed to send topic tokens batch ${i/batchSize + 1}:`, err.message);
                  failureCount += batch.length;
                }
              }
              
              console.log(`Topic-based notification results - Success: ${successCount}, Failures: ${failureCount}`);
              result = { 
                success: successCount > 0,
                response: {
                  successCount,
                  failureCount
                }
              };
            } else {
              // Final fallback - try sending to topic directly
              console.log(`Attempting to send to topics: 'school_${notification.schoolId}' and '${notification.schoolId}'`);
              
              // Try both formats of the topic name
              const topicResult1 = await fcmService.sendToTopic(`school_${notification.schoolId}`, title, body, {
                notificationId: notification._id.toString(),
                type: 'announcement'
              });
              
              const topicResult2 = await fcmService.sendToTopic(notification.schoolId.toString(), title, body, {
                notificationId: notification._id.toString(),
                type: 'announcement'
              });
              
              // Return success if either topic send was successful
              result = {
                success: topicResult1.success || topicResult2.success,
                response: {
                  topic1: topicResult1,
                  topic2: topicResult2
                }
              };
            }
          }
        } catch (error) {
          console.error('Error when sending to school tokens:', error);
          
          // Fallback to previous implementation
          result = await fcmService.sendToTopic(notification.schoolId, title, body, {
            notificationId: notification._id.toString(),
            type: 'announcement'
          });
        }
      } else if (notification.type === "Teacher" && notification.teacherId) {
        // Get FCM tokens for this teacher through FCM service or directly
        const FCMToken = require('../models/FCMToken');
        const teacherTokens = await FCMToken.find({ 
          userId: notification.teacherId, 
          isActive: true 
        }).select('token');
        
        console.log(`Found ${teacherTokens.length} FCM tokens for teacher ${notification.teacherId}`);
        
        if (teacherTokens.length > 0) {
          const tokens = teacherTokens.map(doc => doc.token);
          
          // Send using compatible method (one by one instead of sendMulticast)
          try {
            let successCount = 0;
            let failureCount = 0;
            
            for (const token of tokens) {
              try {
                const message = {
                  notification: {
                    title,
                    body
                  },
                  data: {
                    notificationId: notification._id.toString(),
                    type: 'teacher',
                    teacherId: notification.teacherId.toString()
                  },
                  token // Send to individual token
                };
                
                await admin.messaging().send(message);
                successCount++;
              } catch (err) {
                console.warn(`Failed to send to token: ${token}`, err.message);
                failureCount++;
              }
            }
            
            console.log(`Sent directly to teacher. Success: ${successCount}/${tokens.length}`);
            result = { 
              success: successCount > 0,
              response: {
                successCount,
                failureCount
              }
            };
          } catch (firebaseError) {
            console.error('Firebase error sending to teacher:', firebaseError);
            
            // Fallback to fcmService
            result = await fcmService.sendToUser(notification.teacherId, title, body, {
              notificationId: notification._id.toString(),
              type: 'teacher'
            });
          }
        } else {
          console.warn(`No FCM tokens found for teacher ${notification.teacherId}`);
          
          // Try the standard method as fallback
          result = await fcmService.sendToUser(notification.teacherId, title, body, {
            notificationId: notification._id.toString(),
            type: 'teacher'
          });
        }
      } else if (notification.type === "Student" && notification.studentId) {
        // Send to specific student
        result = await fcmService.sendToUser(notification.studentId, title, body, {
          notificationId: notification._id.toString(),
          type: 'student'
        });
      } else if (notification.type === "Class" && notification.classId) {
        // Send to all users in a specific class
        result = await fcmService.sendToClass(notification.classId, notification.schoolId, title, body, {
          notificationId: notification._id.toString(),
          type: 'class'
        });
      } else if (notification.type === "Parent" && notification.parentId) {
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
  
  // New method to send push notifications directly
  sendPushNotification: async (req, res) => {
    try {
      const { title, message, schoolId, type, targetId, role, audience, classId } = req.body;

      if (!title || !message || !schoolId) {
        return res.status(400).json({
          success: false,
          message: "title, message, and schoolId are required."
        });
      }

      let result;

      switch (type) {
        case 'announcement':
          // Send to all users of school via topic
          result = await fcmService.sendToTopic(schoolId, title, message, { type: 'announcement' });
          break;
          
        case 'role':
          if (!role) {
            return res.status(400).json({
              success: false,
              message: "role is required for role-based notifications."
            });
          }
          result = await fcmService.sendToRole(schoolId, role, title, message, { type: 'role', role });
          break;
          
        case 'user':
          if (!targetId) {
            return res.status(400).json({
              success: false,
              message: "targetId is required for user-specific notifications."
            });
          }
          result = await fcmService.sendToUser(targetId, title, message, { type: 'user' });
          break;
          
        case 'class':
          if (!classId) {
            return res.status(400).json({
              success: false,
              message: "classId is required for class notifications."
            });
          }
          result = await fcmService.sendToClass(classId, schoolId, title, message, { type: 'class' });
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid type. Must be 'announcement', 'role', 'user', or 'class'."
          });
      }

      // Create a record of this push notification in the database
      const notificationData = {
        type: type === 'announcement' ? 'Announcement' : 
              type === 'role' ? 'Teacher' :
              type === 'user' ? 'Student' : 'Class',
        message,
        schoolId,
        createdBy: req.user._id,
        issuedAt: new Date()
      };

      // Add specific fields based on notification type
      if (type === 'role' && role === 'teacher') {
        notificationData.audience = ['all_teachers'];
      } else if (type === 'user' && targetId) {
        notificationData.studentId = targetId;
      } else if (type === 'class' && classId) {
        notificationData.classId = classId;
      }

      // Save the notification record
      const newNotification = await Notification.create(notificationData);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Push notification sent successfully.",
          data: {
            notification: newNotification,
            pushResult: result.response
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Failed to send push notification.",
          error: result.error
        });
      }
    } catch (err) {
      console.error("notificationController.sendPushNotification error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};

