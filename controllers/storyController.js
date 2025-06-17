// controllers/storyController.js
const { Story } = require("../models");

exports.createStory = async (req, res) => {
  try {
    const { mediaUrl, mediaType, schoolId: requestSchoolId } = req.body;
    
    console.log("User data:", req.user);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Authentication error. User data missing." });
    }

    const userId = req.user._id;
    const role = req.user.role;
    // Use schoolId from request if user object doesn't have it
    const schoolId = req.user.schoolId || requestSchoolId;

    if (!["teacher", "school_admin"].includes(role)) {
      return res.status(403).json({ success: false, message: "Teacher or Admin only." });
    }
    
    if (!mediaUrl || !["image","video"].includes(mediaType)) {
      return res.status(400).json({ success: false, message: "mediaUrl and valid mediaType required." });
    }

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required. Please include it in the request." });
    }

    const story = await Story.create({ 
      schoolId, 
      userId, 
      mediaUrl, 
      mediaType 
    });
    
    return res.status(201).json({ success: true, data: story });
  } catch (err) {
    console.error("storyController.createStory error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.getStories = async (req, res) => {
  try {
    // Get schoolId from query parameters if not in user object
    const schoolId = req.user.schoolId || req.query.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: "School ID is required. Please include it in the request query." 
      });
    }

    console.log("Fetching stories for schoolId:", schoolId);
    
    // fetch all non-expired stories for this school
    const stories = await Story.find({ schoolId })
      .sort({ createdAt: -1 })
      .populate("userId", "name role");
    
    console.log(`Found ${stories.length} stories`);
    
    return res.status(200).json({ success: true, data: stories });
  } catch (err) {
    console.error("storyController.getStories error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
