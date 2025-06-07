// controllers/searchController.js

/**
 * Search Controller
 *  - searchUsers:      Search User collection by name or email (autocomplete)
 *  - searchStudents:   Search Student collection by name or studentId
 *  - searchTeachers:   Search Teacher collection by name or teacherId
 *  - searchResources:  Search Resource collection by title, subject, or description
 *
 * Each endpoint expects a query parameter `q` (the search term) and optional `limit`.
 */

const mongoose = require("mongoose");
const { User, Student, Teacher, Resource } = require("../models");

module.exports = {
  // GET /search/users?q=&limit=
  searchUsers: async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;
      if (!q || typeof q !== "string" || q.trim() === "") {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Query parameter "q" is required.',
          });
      }
      const regex = new RegExp(q.trim(), "i");
      const users = await User.find({
        $or: [{ name: regex }, { email: regex }],
      })
        .limit(parseInt(limit, 10))
        .select("name email role")
        .lean();
      return res.status(200).json({ success: true, data: users });
    } catch (err) {
      console.error("searchController.searchUsers error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /search/students?q=&limit=
  searchStudents: async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;
      if (!q || typeof q !== "string" || q.trim() === "") {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Query parameter "q" is required.',
          });
      }
      const regex = new RegExp(q.trim(), "i");
      const students = await Student.find({
        $or: [{ name: regex }, { studentId: regex }],
      })
        .limit(parseInt(limit, 10))
        .select("name studentId classId")
        .populate("classId", "name grade section")
        .lean();
      return res.status(200).json({ success: true, data: students });
    } catch (err) {
      console.error("searchController.searchStudents error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /search/teachers?q=&limit=
  searchTeachers: async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;
      if (!q || typeof q !== "string" || q.trim() === "") {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Query parameter "q" is required.',
          });
      }
      const regex = new RegExp(q.trim(), "i");
      const teachers = await Teacher.find({
        $or: [{ name: regex }, { teacherId: regex }],
      })
        .limit(parseInt(limit, 10))
        .select("name teacherId email")
        .lean();
      return res.status(200).json({ success: true, data: teachers });
    } catch (err) {
      console.error("searchController.searchTeachers error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /search/resources?q=&limit=
  searchResources: async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;
      if (!q || typeof q !== "string" || q.trim() === "") {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Query parameter "q" is required.',
          });
      }
      const regex = new RegExp(q.trim(), "i");
      const resources = await Resource.find({
        $or: [{ title: regex }, { subject: regex }, { description: regex }],
      })
        .limit(parseInt(limit, 10))
        .select("title subject classId uploadedBy")
        .populate("classId", "name grade section")
        .populate("uploadedBy", "name teacherId")
        .lean();
      return res.status(200).json({ success: true, data: resources });
    } catch (err) {
      console.error("searchController.searchResources error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
