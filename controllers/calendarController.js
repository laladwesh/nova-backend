// controllers/calendarController.js

/**
 * Calendar Controller
 *  - listCalendarItems:    Return all calendar documents (or filter by year)
 *  - createCalendarItem:   Create a new sub‐document (holiday, exam, or fixedEvent) in the calendar
 *  - updateCalendarItem:   Update a specific sub‐document by its ID
 *  - deleteCalendarItem:   Delete a specific sub‐document by its ID
 *
 * Assumptions:
 *  - authMiddleware ensures req.user contains { userId, role }
 *  - Only “school_admin” or similarly privileged roles can modify the calendar
 *  - Calendar model = AcademicCalendar with fields:
 *      - year: Number
 *      - holidays: [ { _id, name, date } ]
 *      - examSchedule: [ { _id, name, date, time, subjects } ]
 *      - fixedEvents: [ { _id, name, date } ]
 *  - Incoming request bodies must include a `type` field indicating which array to operate on:
 *      type ∈ ['holiday','exam','fixedEvent']
 */

const { AcademicCalendar } = require("../models");
const mongoose = require("mongoose");

module.exports = {
  // GET /calendar
  // GET /calendar?schoolId=<id>&year=<year>
  listCalendarItems: async (req, res) => {
    try {
      const { schoolId, year } = req.query;
      const filter = {};

      // filter by schoolId if provided
      if (schoolId) {
        if (!mongoose.Types.ObjectId.isValid(schoolId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid schoolId." });
        }
        filter.schoolId = schoolId;
      }
      // filter by year if provided
      if (year) {
        const y = parseInt(year, 10);
        if (isNaN(y)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid year." });
        }
        filter.year = y;
      }
      const calendars = await AcademicCalendar.find(filter).sort({ year: -1 });
      return res.status(200).json({
        success: true,
        data: calendars,
      });
    } catch (err) {
      console.error("calendarController.listCalendarItems error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /calendar
  createCalendarItem: async (req, res) => {
    try {
      const { year, type, name, date, time, schoolId } = req.body;

      if (!year || !type || !name || !date || !schoolId) {
        return res.status(400).json({
          success: false,
          message: "year, type, name, date, and schoolId are required.",
        });
      }

      // Validate schoolId format
      if (!mongoose.Types.ObjectId.isValid(schoolId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid schoolId format.",
        });
      }

      const parsedYear = parseInt(year, 10);
      const calendar = await AcademicCalendar.findOneAndUpdate(
        { year: parsedYear, schoolId },
        { $setOnInsert: { year: parsedYear, schoolId } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      const itemData = { name, date: new Date(date) };
      if (type === "exam") {
        if (!time) {
          return res.status(400).json({
            success: false,
            message: "Exam entries require a time.",
          });
        }
        itemData.time = time;
        calendar.examSchedule.push(itemData);
      } else if (type === "holiday") {
        calendar.holidays.push(itemData);
      } else if (type === "fixedEvent") {
        calendar.fixedEvents.push(itemData);
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid type. Must be one of: holiday, exam, fixedEvent.",
        });
      }

      await calendar.save();
      return res.status(201).json({
        success: true,
        message: `${type} added successfully.`,
        data: calendar,
      });
    } catch (err) {
      console.error("calendarController.createCalendarItem error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /calendar/:calendarId
  updateCalendarItem: async (req, res) => {
    try {
      const { calendarId } = req.params;
      const { type, itemId, name, date, time } = req.body;

      if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid calendarId." });
      }
      if (!type || !itemId) {
        return res.status(400).json({
          success: false,
          message: "type and itemId are required to update.",
        });
      }

      const calendar = await AcademicCalendar.findById(calendarId);
      if (!calendar) {
        return res
          .status(404)
          .json({ success: false, message: "Calendar not found." });
      }

      let subArray;
      if (type === "holiday") {
        subArray = calendar.holidays;
      } else if (type === "exam") {
        subArray = calendar.examSchedule;
      } else if (type === "fixedEvent") {
        subArray = calendar.fixedEvents;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid type. Must be one of: holiday, exam, fixedEvent.",
        });
      }

      const itemIndex = subArray.findIndex(
        (item) => item._id.toString() === itemId
      );
      if (itemIndex === -1) {
        return res
          .status(404)
          .json({ success: false, message: `${type} item not found.` });
      }

      // Update fields
      if (name) subArray[itemIndex].name = name;
      if (date) subArray[itemIndex].date = new Date(date);
      if (type === "exam") {
        if (time !== undefined) subArray[itemIndex].time = time;
      }

      await calendar.save();
      return res.status(200).json({
        success: true,
        message: `${type} updated successfully.`,
        data: calendar,
      });
    } catch (err) {
      console.error("calendarController.updateCalendarItem error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /calendar/:calendarId
  deleteCalendarItem: async (req, res) => {
    try {
      const { calendarId } = req.params;
      const { type, itemId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(calendarId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid calendarId." });
      }
      if (!type || !itemId) {
        return res.status(400).json({
          success: false,
          message: "type and itemId are required to delete.",
        });
      }

      const calendar = await AcademicCalendar.findById(calendarId);
      if (!calendar) {
        return res
          .status(404)
          .json({ success: false, message: "Calendar not found." });
      }

      let subArrayField;
      if (type === "holiday") {
        subArrayField = "holidays";
      } else if (type === "exam") {
        subArrayField = "examSchedule";
      } else if (type === "fixedEvent") {
        subArrayField = "fixedEvents";
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid type. Must be one of: holiday, exam, fixedEvent.",
        });
      }

      const beforeCount = calendar[subArrayField].length;
      calendar[subArrayField] = calendar[subArrayField].filter(
        (item) => item._id.toString() !== itemId
      );
      if (calendar[subArrayField].length === beforeCount) {
        return res
          .status(404)
          .json({ success: false, message: `${type} item not found.` });
      }

      await calendar.save();
      return res.status(200).json({
        success: true,
        message: `${type} deleted successfully.`,
        data: calendar,
      });
    } catch (err) {
      console.error("calendarController.deleteCalendarItem error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
