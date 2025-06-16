const express = require('express');
const router = express.Router();
const FCMToken = require('../models/FCMToken');
const fcmService = require('../services/fcmService');

// Store FCM token
router.post('/token', async (req, res) => {
  try {
    const { token, schoolId, topic, deviceType, userId, role, classId } = req.body;

    // Validate required fields
    if (!token || !userId || !schoolId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Token, userId, schoolId, and role are required'
      });
    }

    // Check if token already exists for this user and school
    const existingToken = await FCMToken.findOne({ 
      userId,
      schoolId,
      token 
    });

    if (existingToken) {
      // Update existing token
      existingToken.topic = topic || existingToken.topic;
      existingToken.deviceType = deviceType || existingToken.deviceType;
      existingToken.updatedAt = new Date();
      
      await existingToken.save();
      
      return res.status(200).json({
        success: true,
        message: 'FCM token updated successfully',
        data: existingToken
      });
    }

    // Create new FCM token record
    const fcmToken = new FCMToken({
      token,
      schoolId,
      topic: topic || `school_${schoolId}`,
      deviceType,
      userId,
      role,
      classId: classId || null,
      isActive: true
    });

    await fcmToken.save();

    // Subscribe to school topic for announcements
    await fcmService.subscribeToTopic([token], schoolId);

    res.status(201).json({
      success: true,
      message: 'FCM token stored successfully',
      data: fcmToken
    });

  } catch (error) {
    console.error('Error storing FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Subscribe to topic
router.post('/subscribe', async (req, res) => {
  try {
    const { tokens, schoolId } = req.body;

    if (!tokens || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Tokens and schoolId are required'
      });
    }

    const result = await fcmService.subscribeToTopic(tokens, schoolId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Successfully subscribed to topic',
        data: result.response
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to subscribe to topic',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error subscribing to topic:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Unsubscribe from topic
router.post('/unsubscribe', async (req, res) => {
  try {
    const { tokens, schoolId } = req.body;

    if (!tokens || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Tokens and schoolId are required'
      });
    }

    const result = await fcmService.unsubscribeFromTopic(tokens, schoolId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Successfully unsubscribed from topic',
        data: result.response
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to unsubscribe from topic',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get FCM tokens by school ID
router.get('/school/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { topic, isActive = true } = req.query;

    const filter = { schoolId, isActive };
    if (topic) filter.topic = topic;

    const tokens = await FCMToken.find(filter);

    res.status(200).json({
      success: true,
      message: 'FCM tokens retrieved successfully',
      data: tokens
    });

  } catch (error) {
    console.error('Error retrieving FCM tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// get FCM token by role along with schoolId
router.get('/role/:role/school/:schoolId', async (req, res) => {
  try {
    const { role, schoolId } = req.params;
    const { isActive = true } = req.query;

    const tokens = await FCMToken.find({ role, schoolId, isActive });

    res.status(200).json({
      success: true,
      message: 'FCM tokens retrieved successfully',
      data: tokens
    });

  } catch (error) {
    console.error('Error retrieving FCM tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get FCM tokens by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive = true } = req.query;

    const tokens = await FCMToken.find({ userId, isActive });

    res.status(200).json({
      success: true,
      message: 'FCM tokens retrieved successfully',
      data: tokens
    });

  } catch (error) {
    console.error('Error retrieving FCM tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update FCM token status (activate/deactivate)
router.patch('/token/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const token = await FCMToken.findByIdAndUpdate(
      id,
      { isActive, updatedAt: new Date() },
      { new: true }
    );

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'FCM token not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'FCM token status updated successfully',
      data: token
    });

  } catch (error) {
    console.error('Error updating FCM token status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete FCM token
router.delete('/token/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const token = await FCMToken.findByIdAndDelete(id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'FCM token not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'FCM token deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add debugging route to check topic subscriptions
router.get('/debug/topic/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    const result = await fcmService.getTopicSubscriptions(schoolId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Topic subscriptions for school: ${schoolId}`,
        data: {
          topic: `school_${schoolId}`,
          subscriptions: result.tokens
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to get topic subscriptions',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error getting topic subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add route to manually subscribe existing tokens
router.post('/resubscribe/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Get all active tokens for this school
    const fcmTokens = await FCMToken.find({ 
      schoolId, 
      isActive: true 
    }).select('token');
    
    if (fcmTokens.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active tokens found for this school'
      });
    }
    
    const tokens = fcmTokens.map(tokenDoc => tokenDoc.token);
    const result = await fcmService.subscribeToTopic(tokens, schoolId);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Successfully resubscribed ${tokens.length} tokens to school topic`,
        data: result.response
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to resubscribe tokens',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error resubscribing tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;