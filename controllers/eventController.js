// controllers/eventController.js

/**
 * Event Controller
 *  - listEvents:           Return all events (with optional filtering by date or type)
 *  - createEvent:          Create a new event
 *  - getEventById:         Return a single event by ID
 *  - updateEvent:          Update fields of an event
 *  - deleteEvent:          Delete an event
 *  - sendEventNotifications: Create notifications related to a specific event
 *
 * Assumptions:
 *  - authMiddleware populates req.user with { userId, role }
 *  - Event model has fields: name, description, date, time, venue
 *  - Notification model has fields: type, message, studentId, teacherId, audience, scheduleAt
 *  - Only “school_admin” or similarly privileged roles can create/update/delete events
 *  - When sending event notifications, the controller expects a body with:
 *      { message: String, audience: ['all_students'|'all_teachers'|arrayOfSpecificIds], scheduleAt?: Date }
 */

const {
  Event,
  Notification,
  Student,
  Teacher,
  AcademicCalendar,
} = require("../models");
const mongoose = require("mongoose");

module.exports = {
  // GET /events
  listEvents: async (req, res) => {
    try {
      const { date, type } = req.query;
      const filter = {};

      if (date) {
        // filter by exact date (ISO format)
        const start = new Date(date);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        filter.date = { $gte: start, $lte: end };
      }

      // If future extensibility: type could be 'sports', 'meeting', etc.
      if (type) {
        filter.type = type;
      }

      const events = await Event.find(filter).sort({ date: 1, time: 1 });
      return res.status(200).json({ success: true, data: events });
    } catch (err) {
      console.error("eventController.listEvents error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /events
  createEvent: async (req, res) => {
    try {
      const { name, description, date, time, venue, schoolId } = req.body;

      if (!name || !date || !schoolId) {
        return res.status(400).json({
          success: false,
          message: "Event name, date, and schoolId are required.",
        });
      }

      const newEvent = await Event.create({
        name,
        description,
        date: new Date(date),
        time: time || null,
        venue: venue || "",
        schoolId,
      });
      const eventYear = newEvent.date.getFullYear();
      const cal = await AcademicCalendar.findOneAndUpdate(
        { schoolId, year: eventYear },
        { $setOnInsert: { schoolId, year: eventYear } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      // push this event into fixedEvents, using same _id
      cal.fixedEvents.push({
        _id: newEvent._id,
        name: newEvent.name,
        date: newEvent.date,
      });
      await cal.save();
      return res.status(201).json({
        success: true,
        message: "Event created successfully.",
        data: newEvent,
      });
    } catch (err) {
      console.error("eventController.createEvent error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /events/:eventId
  getEventById: async (req, res) => {
    try {
      const { eventId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid eventId." });
      }

      const event = await Event.findById(eventId);
      if (!event) {
        return res
          .status(404)
          .json({ success: false, message: "Event not found." });
      }

      return res.status(200).json({ success: true, data: event });
    } catch (err) {
      console.error("eventController.getEventById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /events/:eventId
  updateEvent: async (req, res) => {
    try {
      const { eventId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid eventId." });
      }

      const { name, description, date, time, venue } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (description) updates.description = description;
      if (date) updates.date = new Date(date);
      if (time) updates.time = time;
      if (venue) updates.venue = venue;

      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      );

      if (!updatedEvent) {
        return res
          .status(404)
          .json({ success: false, message: "Event not found." });
      }

      // ── Sync update into AcademicCalendar ──
      const eventYear = updatedEvent.date.getFullYear();
      const cal = await AcademicCalendar.findOne({
        schoolId: updatedEvent.schoolId,
        year: eventYear,
      });
      if (cal) {
        const idx = cal.fixedEvents.findIndex((e) =>
          e._id.equals(updatedEvent._id)
        );
        if (idx !== -1) {
          cal.fixedEvents[idx].name = updatedEvent.name;
          cal.fixedEvents[idx].date = updatedEvent.date;
          await cal.save();
        }
      }

      return res.status(200).json({
        success: true,
        message: "Event updated successfully.",
        data: updatedEvent,
      });
    } catch (err) {
      console.error("eventController.updateEvent error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // DELETE /events/:eventId
  deleteEvent: async (req, res) => {
    try {
      const { eventId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid eventId." });
      }

      const deleted = await Event.findByIdAndDelete(eventId);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Event not found." });
      }
      // ── Sync deletion from AcademicCalendar ──
      const eventYear = deleted.date.getFullYear();
      await AcademicCalendar.findOneAndUpdate(
        { schoolId: deleted.schoolId, year: eventYear },
        { $pull: { fixedEvents: { _id: deleted._id } } }
      );

      return res.status(200).json({
        success: true,
        message: "Event deleted successfully.",
      });
    } catch (err) {
      console.error("eventController.deleteEvent error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // POST /events/:eventId/notifications
  sendEventNotifications: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { message, audience, scheduleAt } = req.body;

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid eventId." });
      }

      const event = await Event.findById(eventId);
      if (!event) {
        return res
          .status(404)
          .json({ success: false, message: "Event not found." });
      }

      if (!message || !audience) {
        return res.status(400).json({
          success: false,
          message: "Both message and audience are required.",
        });
      }

      const notificationsToCreate = [];

      // If audience is 'all_students' or 'all_teachers', fetch IDs accordingly
      if (audience === "all_students") {
        const students = await Student.find().select("_id");
        students.forEach((std) => {
          notificationsToCreate.push({
            type: "Student",
            message,
            studentId: std._id,
            scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
            issuedAt: scheduleAt ? undefined : new Date(),
          });
        });
      } else if (audience === "all_teachers") {
        const teachers = await Teacher.find().select("_id");
        teachers.forEach((tch) => {
          notificationsToCreate.push({
            type: "Teacher",
            message,
            teacherId: tch._id,
            scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
            issuedAt: scheduleAt ? undefined : new Date(),
          });
        });
      } else if (Array.isArray(audience)) {
        // audience can be array of specific IDs with type designations
        // e.g., [{ type: 'Student', id: '...' }, { type: 'Teacher', id: '...' }]
        audience.forEach((item) => {
          if (
            item.type === "Student" &&
            mongoose.Types.ObjectId.isValid(item.id)
          ) {
            notificationsToCreate.push({
              type: "Student",
              message,
              studentId: item.id,
              scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
              issuedAt: scheduleAt ? undefined : new Date(),
            });
          } else if (
            item.type === "Teacher" &&
            mongoose.Types.ObjectId.isValid(item.id)
          ) {
            notificationsToCreate.push({
              type: "Teacher",
              message,
              teacherId: item.id,
              scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
              issuedAt: scheduleAt ? undefined : new Date(),
            });
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid audience format.",
        });
      }

      // Bulk create notifications
      const createdNotifications = await Notification.insertMany(
        notificationsToCreate
      );

      return res.status(201).json({
        success: true,
        message: `Notifications queued for event "${event.name}".`,
        data: createdNotifications,
      });
    } catch (err) {
      console.error("eventController.sendEventNotifications error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
