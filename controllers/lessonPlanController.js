// controllers/lessonPlanController.js

/**
 * Lesson Plan Controller
 *  - listLessonPlans:      Return all lesson plans (optionally filtered by teacherId or classId or weekOf)
 *  - createLessonPlan:     Create a new lesson plan
 *  - getLessonPlanById:    Return a single lesson plan by ID
 *  - updateLessonPlan:     Update fields of an existing lesson plan
 *  - deleteLessonPlan:     Delete a lesson plan
 *
 * Assumptions:
 *  - authMiddleware populates req.user = { userId, role }
 *  - Only teachers (or admins) can create/update/delete lesson plans
 *  - LessonPlan model fields:
 *      { teacherId, classId, weekOf, goals: [ { day, subject, topics, resources } ], sharedWithAdmin }
 */

const mongoose = require("mongoose");
const { LessonPlan, Teacher, Class } = require("../models");

module.exports = {
  // GET /lesson-plans?teacherId=&classId=&weekOf=
  listLessonPlans: async (req, res) => {
    try {
      const { teacherId, classId, weekOf } = req.query;
      const filter = {};

      if (teacherId) {
        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid teacherId." });
        }
        filter.teacherId = teacherId;
      }
      if (classId) {
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid classId." });
        }
        filter.classId = classId;
      }
      if (weekOf) {
        const date = new Date(weekOf);
        if (isNaN(date.getTime())) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid weekOf date." });
        }
        // match exact ISO date (midnight)
        const next = new Date(date);
        next.setDate(date.getDate() + 1);
        filter.weekOf = { $gte: date, $lt: next };
      }

      const plans = await LessonPlan.find(filter)
        .populate("teacherId", "name teacherId")
        .populate("classId", "name grade section year")
        .sort({ weekOf: -1 })
        .lean();

      return res.status(200).json({ success: true, data: plans });
    } catch (err) {
      console.error("lessonPlanController.listLessonPlans error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /lesson-plans
  createLessonPlan: async (req, res) => {
    try {
      const {
        teacherId,
        classId,
        weekOf,
        goals,
        sharedWithAdmin = false,
      } = req.body;

      if (
        !teacherId ||
        !classId ||
        !weekOf ||
        !Array.isArray(goals) ||
        goals.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "teacherId, classId, weekOf, and a non-empty goals array are required.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid teacherId." });
      }
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid classId." });
      }
      const weekDate = new Date(weekOf);
      if (isNaN(weekDate.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid weekOf date." });
      }

      // Validate teacher exists
      const teacherExists = await Teacher.exists({ _id: teacherId });
      if (!teacherExists) {
        return res
          .status(404)
          .json({ success: false, message: "Teacher not found." });
      }
      // Validate class exists
      const classExists = await Class.exists({ _id: classId });
      if (!classExists) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found." });
      }

      // Validate goals array entries
      const allowedDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      for (const g of goals) {
        const { day, subject, topics, resources } = g;
        if (!day || !allowedDays.includes(day)) {
          return res.status(400).json({
            success: false,
            message: `Each goal must include a valid day (one of ${allowedDays.join(
              ", "
            )}).`,
          });
        }
        if (!subject || typeof subject !== "string") {
          return res.status(400).json({
            success: false,
            message: "Each goal must include a non-empty subject string.",
          });
        }
        if (!topics || typeof topics !== "string") {
          return res.status(400).json({
            success: false,
            message: "Each goal must include a non-empty topics string.",
          });
        }
        if (resources && !Array.isArray(resources)) {
          return res.status(400).json({
            success: false,
            message: "Resources must be an array of strings if provided.",
          });
        }
      }

      const newPlan = await LessonPlan.create({
        teacherId,
        classId,
        weekOf: weekDate,
        goals,
        sharedWithAdmin,
      });

      const populated = await LessonPlan.findById(newPlan._id)
        .populate("teacherId", "name teacherId")
        .populate("classId", "name grade section year")
        .lean();

      return res.status(201).json({
        success: true,
        message: "Lesson plan created successfully.",
        data: populated,
      });
    } catch (err) {
      console.error("lessonPlanController.createLessonPlan error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /lesson-plans/:planId
  getLessonPlanById: async (req, res) => {
    try {
      const { planId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid planId." });
      }

      const plan = await LessonPlan.findById(planId)
        .populate("teacherId", "name teacherId")
        .populate("classId", "name grade section year")
        .lean();

      if (!plan) {
        return res
          .status(404)
          .json({ success: false, message: "Lesson plan not found." });
      }

      return res.status(200).json({ success: true, data: plan });
    } catch (err) {
      console.error("lessonPlanController.getLessonPlanById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /lesson-plans/:planId
  updateLessonPlan: async (req, res) => {
    try {
      const { planId } = req.params;
      const { weekOf, goals, sharedWithAdmin } = req.body;

      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid planId." });
      }
      const updates = {};
      if (weekOf) {
        const weekDate = new Date(weekOf);
        if (isNaN(weekDate.getTime())) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid weekOf date." });
        }
        updates.weekOf = weekDate;
      }
      if (sharedWithAdmin !== undefined) {
        updates.sharedWithAdmin = sharedWithAdmin;
      }
      if (goals !== undefined) {
        if (!Array.isArray(goals) || goals.length === 0) {
          return res.status(400).json({
            success: false,
            message: "goals must be a non-empty array if provided.",
          });
        }
        const allowedDays = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        for (const g of goals) {
          const { day, subject, topics, resources } = g;
          if (!day || !allowedDays.includes(day)) {
            return res.status(400).json({
              success: false,
              message: `Each goal must include a valid day (one of ${allowedDays.join(
                ", "
              )}).`,
            });
          }
          if (!subject || typeof subject !== "string") {
            return res.status(400).json({
              success: false,
              message: "Each goal must include a non-empty subject string.",
            });
          }
          if (!topics || typeof topics !== "string") {
            return res.status(400).json({
              success: false,
              message: "Each goal must include a non-empty topics string.",
            });
          }
          if (resources && !Array.isArray(resources)) {
            return res.status(400).json({
              success: false,
              message: "Resources must be an array of strings if provided.",
            });
          }
        }
        updates.goals = goals;
      }

      if (Object.keys(updates).length === 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "At least one field is required to update.",
          });
      }

      const updatedPlan = await LessonPlan.findByIdAndUpdate(
        planId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      )
        .populate("teacherId", "name teacherId")
        .populate("classId", "name grade section year")
        .lean();

      if (!updatedPlan) {
        return res
          .status(404)
          .json({ success: false, message: "Lesson plan not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Lesson plan updated successfully.",
        data: updatedPlan,
      });
    } catch (err) {
      console.error("lessonPlanController.updateLessonPlan error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /lesson-plans/:planId
  deleteLessonPlan: async (req, res) => {
    try {
      const { planId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid planId." });
      }

      const deleted = await LessonPlan.findByIdAndDelete(planId);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Lesson plan not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Lesson plan deleted successfully.",
      });
    } catch (err) {
      console.error("lessonPlanController.deleteLessonPlan error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
