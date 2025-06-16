const { admin, isFirebaseInitialized } = require('../config/firebase');
const FCMToken = require('../models/FCMToken');

const fcmService = {
  /**
   * Send a notification to a topic (school-wide)
   * @param {String} schoolId - School ID for the topic
   * @param {String} title - Notification title
   * @param {String} body - Notification body
   * @param {Object} data - Additional data payload
   */
  sendToTopic: async (schoolId, title, body, data = {}) => {
    try {
      if (!isFirebaseInitialized()) {
        console.warn('Firebase not initialized when sending to topic for school', schoolId);
        return { success: false, error: 'Firebase not initialized' };
      }
      
      if (!schoolId) {
        return { success: false, error: 'School ID is required' };
      }
      
      const topicName = `school_${schoolId}`;
      
      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          schoolId: schoolId.toString()
        },
        topic: topicName
      };
      
      const response = await admin.messaging().send(message);
      return { success: true, response };
    } catch (error) {
      console.error('Error sending to topic:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Send a notification to a specific user
   * @param {String} userId - User ID to target
   * @param {String} title - Notification title
   * @param {String} body - Notification body
   * @param {Object} data - Additional data payload
   */
  sendToUser: async (userId, title, body, data = {}) => {
    try {
      if (!isFirebaseInitialized()) {
        console.warn(`Firebase not initialized when sending to user ${userId}`);
        return { success: false, error: 'Firebase not initialized' };
      }
      
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }
      
      console.log(`Finding FCM tokens for user ${userId}`);
      
      // Find all active tokens for this user
      const userTokens = await FCMToken.find({ 
        userId, 
        isActive: true 
      }).select('token');
      
      console.log(`Found ${userTokens.length} tokens for user ${userId}`);
      
      if (userTokens.length === 0) {
        return { success: false, error: 'No active FCM tokens found for this user' };
      }
      
      // Send to each token individually instead of using sendMulticast
      const tokens = userTokens.map(doc => doc.token);
      console.log(`Sending FCM to tokens: ${tokens.join(', ').substring(0, 50)}...`);
      
      let successCount = 0;
      let failureCount = 0;
      
      // Send to each token one by one (compatible with older Firebase Admin versions)
      for (const token of tokens) {
        try {
          const message = {
            notification: {
              title,
              body
            },
            data: {
              ...data,
              userId: userId.toString()
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
      
      console.log(`FCM send result: ${successCount} successful, ${failureCount} failed`);
      
      return { 
        success: successCount > 0, 
        response: {
          successCount,
          failureCount
        }
      };
    } catch (error) {
      console.error('Error sending to user:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Send a notification to users with a specific role in a school
   * @param {String} schoolId - School ID to target
   * @param {String} role - Role to target ('student', 'teacher', 'parent', 'school_admin')
   * @param {String} title - Notification title
   * @param {String} body - Notification body
   * @param {Object} data - Additional data payload
   */
  sendToRole: async (schoolId, role, title, body, data = {}) => {
    try {
      if (!isFirebaseInitialized()) {
        return { success: false, error: 'Firebase not initialized' };
      }
      
      if (!schoolId || !role) {
        return { success: false, error: 'School ID and role are required' };
      }
      
      // Find all active tokens for this role in this school
      const roleTokens = await FCMToken.find({ 
        schoolId, 
        role,
        isActive: true 
      }).select('token');
      
      if (roleTokens.length === 0) {
        return { success: false, error: `No active FCM tokens found for role ${role} in this school` };
      }
      
      const tokens = roleTokens.map(doc => doc.token);
      
      // Send to each token individually
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
              ...data,
              schoolId: schoolId.toString(),
              role
            },
            token
          };
          
          await admin.messaging().send(message);
          successCount++;
        } catch (err) {
          failureCount++;
        }
      }
      
      return { 
        success: successCount > 0,
        response: {
          successCount,
          failureCount
        }
      };
    } catch (error) {
      console.error('Error sending to role:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Send a notification to all users in a specific class
   * @param {String} classId - Class ID to target
   * @param {String} schoolId - School ID (for data purposes)
   * @param {String} title - Notification title
   * @param {String} body - Notification body
   * @param {Object} data - Additional data payload
   */
  sendToClass: async (classId, schoolId, title, body, data = {}) => {
    try {
      if (!isFirebaseInitialized()) {
        return { success: false, error: 'Firebase not initialized' };
      }
      
      if (!classId) {
        return { success: false, error: 'Class ID is required' };
      }
      
      // Find all active tokens for this class
      const classTokens = await FCMToken.find({ 
        classId, 
        isActive: true 
      }).select('token');
      
      if (classTokens.length === 0) {
        return { success: false, error: 'No active FCM tokens found for this class' };
      }
      
      const tokens = classTokens.map(doc => doc.token);
      
      // Send to each token individually
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
              ...data,
              classId: classId.toString(),
              schoolId: schoolId ? schoolId.toString() : null
            },
            token
          };
          
          await admin.messaging().send(message);
          successCount++;
        } catch (err) {
          failureCount++;
        }
      }
      
      return { 
        success: successCount > 0,
        response: {
          successCount,
          failureCount
        }
      };
    } catch (error) {
      console.error('Error sending to class:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Subscribe tokens to a topic
   * @param {Array} tokens - Array of FCM tokens
   * @param {String} schoolId - School ID for the topic
   */
  subscribeToTopic: async (tokens, schoolId) => {
    try {
      if (!tokens || !tokens.length || !schoolId) {
        return { success: false, error: 'Tokens and schoolId are required' };
      }
      
      const topicName = `school_${schoolId}`;
      const response = await admin.messaging().subscribeToTopic(tokens, topicName);
      return { success: true, response };
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Unsubscribe tokens from a topic
   * @param {Array} tokens - Array of FCM tokens
   * @param {String} schoolId - School ID for the topic
   */
  unsubscribeFromTopic: async (tokens, schoolId) => {
    try {
      if (!tokens || !tokens.length || !schoolId) {
        return { success: false, error: 'Tokens and schoolId are required' };
      }
      
      const topicName = `school_${schoolId}`;
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topicName);
      return { success: true, response };
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get topic subscriptions (limited functionality in Firebase Admin SDK)
   * This is a placeholder as Firebase doesn't directly support this
   */
  getTopicSubscriptions: async (schoolId) => {
    try {
      if (!schoolId) {
        return { success: false, error: 'School ID is required' };
      }
      
      // Note: Firebase doesn't offer a direct way to list subscribers
      // This is a workaround to return tokens that might be subscribed
      const tokens = await FCMToken.find({
        schoolId,
        isActive: true
      }).select('token');
      
      return { 
        success: true, 
        tokens: tokens.map(t => t.token)
      };
    } catch (error) {
      console.error('Error getting topic subscriptions:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = fcmService;
