const express = require('express');
const router = express.Router();
const FCMToken = require('../models/FCMToken'); // You'll need to create this model

// Store FCM token
router.post('/token', async (req, res) => {
  try {
    const { token,  schoolId, topic, deviceType, userId, role } = req.body;

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
      topic,
      deviceType,
      userId,
      role,
      isActive: true
    });

    await fcmToken.save();

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

// get FCM token by role  along with schoolId
router.get('/role/:role', async (req, res) => {
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

module.exports = router;