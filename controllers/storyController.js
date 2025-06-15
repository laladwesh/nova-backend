// controllers/storyController.js
const { Story } = require("../models");

exports.createStory = async (req, res) => {
  try {
    const { mediaUrl, mediaType } = req.body;
    const { userId, schoolId, role } = req.user;

    // only teachers/admins can post stories
    if (!["teacher", "school_admin"].includes(role)) {
      return res.status(403).json({ success: false, message: "Teacher or Admin only." });
    }
    if (!mediaUrl || !["image","video"].includes(mediaType)) {
      return res.status(400).json({ success: false, message: "mediaUrl and valid mediaType required." });
    }

    const story = await Story.create({ schoolId, userId, mediaUrl, mediaType });
    return res.status(201).json({ success: true, data: story });
  } catch (err) {
    console.error("storyController.createStory error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.getStories = async (req, res) => {
  try {
    const { schoolId } = req.user;
    // fetch all non-expired stories for this school
    const stories = await Story.find({ schoolId })
      .sort({ createdAt: -1 })
      .populate("userId", "name role");
    return res.status(200).json({ success: true, data: stories });
  } catch (err) {
    console.error("storyController.getStories error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
