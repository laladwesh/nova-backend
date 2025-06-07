// controllers/metadataController.js

/**
 * Metadata Controller
 *  - listGrades:       Return all grade levels
 *  - listSubjects:     Return all available subjects
 *  - listEventTypes:   Return all event types
 *  - listFeeTypes:     Return all fee types
 *  - listFormTypes:    Return all form types
 *
 * These endpoints serve static dropdown data.
 */

module.exports = {
  // GET /metadata/grades
  listGrades: async (req, res) => {
    try {
      const grades = [
        "Nursery",
        "LKG",
        "UKG",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
      ];
      return res.status(200).json({ success: true, data: grades });
    } catch (err) {
      console.error("metadataController.listGrades error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /metadata/subjects
  listSubjects: async (req, res) => {
    try {
      const subjects = [
        "Mathematics",
        "English",
        "Science",
        "Social Studies",
        "Hindi",
        "Sanskrit",
        "Computer Science",
        "Physics",
        "Chemistry",
        "Biology",
        "History",
        "Geography",
        "Economics",
        "Civics",
        "Arts",
        "Physical Education",
      ];
      return res.status(200).json({ success: true, data: subjects });
    } catch (err) {
      console.error("metadataController.listSubjects error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /metadata/event-types
  listEventTypes: async (req, res) => {
    try {
      const eventTypes = [
        "Sports",
        "Cultural",
        "Academic",
        "Holiday",
        "Meeting",
        "Workshop",
        "Examination",
        "Celebration",
      ];
      return res.status(200).json({ success: true, data: eventTypes });
    } catch (err) {
      console.error("metadataController.listEventTypes error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /metadata/fee-types
  listFeeTypes: async (req, res) => {
    try {
      const feeTypes = [
        "Tuition",
        "Library",
        "Laboratory",
        "Transport",
        "Examination",
        "Sports",
        "Development",
        "Miscellaneous",
      ];
      return res.status(200).json({ success: true, data: feeTypes });
    } catch (err) {
      console.error("metadataController.listFeeTypes error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /metadata/form-types
  listFormTypes: async (req, res) => {
    try {
      const formTypes = [
        "leave_request",
        "event_participation",
        "feedback",
        "other",
      ];
      return res.status(200).json({ success: true, data: formTypes });
    } catch (err) {
      console.error("metadataController.listFormTypes error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
