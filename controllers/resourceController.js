// controllers/resourceController.js

/**
 * Resource Controller
 *  - listResources:       Return all resources, optionally filtered by classId or subject
 *  - getResourceById:     Return a single resource by ID
 *  - createResource:      Upload a new resource (PDF, video, link) for a class/subject
 *  - deleteResource:      Delete a resource by ID
 *
 * Assumptions:
 *  - authMiddleware populates req.user = { userId, role }
 *  - Only teachers (or admins) can create or delete resources
 *  - Resource model fields:
 *      { uploadedBy, classId, subject, title, description, fileUrl, uploadedAt }
 *  - Class model exists for validating classId
 */

const mongoose = require("mongoose");
const { Resource, Teacher, Class } = require("../models");

module.exports = {
  // GET /resources?classId=&subject=
  listResources: async (req, res) => {
    try {
      const { classId, subject } = req.query;
      const filter = {};

      if (classId) {
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid classId." });
        }
        filter.classId = classId;
      }
      if (subject) {
        filter.subject = subject;
      }

      const resources = await Resource.find(filter)
        .sort({ uploadedAt: -1 })
        .populate("uploadedBy", "name teacherId")
        .populate("classId", "name grade section year")
        .lean();

      return res.status(200).json({ success: true, data: resources });
    } catch (err) {
      console.error("resourceController.listResources error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /resources/:resourceId
  getResourceById: async (req, res) => {
    try {
      const { resourceId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid resourceId." });
      }

      const resource = await Resource.findById(resourceId)
        .populate("uploadedBy", "name teacherId")
        .populate("classId", "name grade section year")
        .lean();

      if (!resource) {
        return res
          .status(404)
          .json({ success: false, message: "Resource not found." });
      }

      return res.status(200).json({ success: true, data: resource });
    } catch (err) {
      console.error("resourceController.getResourceById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /resources
  // Body: { classId, subject, title, description, fileUrl }
  createResource: async (req, res) => {
    try {
      const { classId, subject, title, description, fileUrl } = req.body;
      const uploadedBy = req.user.userId;

      // Only teachers or admins may upload resources
      const uploaderRole = req.user.role;
      if (!["teacher", "school_admin"].includes(uploaderRole)) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Only teachers or admins can upload resources.",
          });
      }

      if (!classId || !subject || !title || !fileUrl) {
        return res.status(400).json({
          success: false,
          message: "classId, subject, title, and fileUrl are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }

      // Verify teacher exists
      const teacherExists = await Teacher.exists({ _id: uploadedBy });
      if (!teacherExists) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }

      // Verify class exists
      const classExists = await Class.exists({ _id: classId });
      if (!classExists) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      const newResource = await Resource.create({
        uploadedBy,
        classId,
        subject,
        title,
        description: description || "",
        fileUrl,
        uploadedAt: new Date(),
      });

      const populated = await Resource.findById(newResource._id)
        .populate("uploadedBy", "name teacherId")
        .populate("classId", "name grade section year")
        .lean();

      return res.status(201).json({
        success: true,
        message: "Resource created successfully.",
        data: populated,
      });
    } catch (err) {
      console.error("resourceController.createResource error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /resources/:resourceId
  deleteResource: async (req, res) => {
    try {
      const { resourceId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid resourceId." });
      }

      // Only the uploader or an admin can delete
      const resource = await Resource.findById(resourceId);
      if (!resource) {
        return res
          .status(404)
          .json({ success: false, message: "Resource not found." });
      }

      const requesterId = req.user.userId;
      const requesterRole = req.user.role;
      if (
        resource.uploadedBy.toString() !== requesterId &&
        !["school_admin"].includes(requesterRole)
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Not authorized to delete this resource.",
          });
      }

      await Resource.findByIdAndDelete(resourceId);
      return res
        .status(200)
        .json({ success: true, message: "Resource deleted successfully." });
    } catch (err) {
      console.error("resourceController.deleteResource error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
