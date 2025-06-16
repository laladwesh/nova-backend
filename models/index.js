// models/index.js

/**
 * This file defines all domain‐specific schemas (Class, Teacher, Student, etc.)
 * and also re‐exports the three authentication models from their own files.
 *
 * In any controller you can now write:
 *   const {
 *     User,
 *     RefreshToken,
 *     PasswordResetToken,
 *     Class,
 *     Teacher,
 *     Student,
 *     Event,
 *     Notification,
 *     AcademicCalendar,
 *     FeeStructure,
 *     Payment,
 *     Assignment,
 *     Submission,
 *     AttendanceRecord,
 *     Grade,
 *     LessonPlan,
 *     Form,
 *     Resource,
 *     Conversation,
 *     Message,
 *     PTMSlot,
 *     PTMBooking
 *   } = require('../models');
 */

const mongoose = require("mongoose");
const { Schema, model } = mongoose;

// ────────────────────────────────────────────────────────────────────────────────
// 0. Re‐export Auth Models
// ────────────────────────────────────────────────────────────────────────────────
const User = require("./User");
const RefreshToken = require("./RefreshToken");
const PasswordResetToken = require("./PasswordResetToken");
const School = require("./School");
const Schedule = require("./Schedule");
const Story = require("./Story");
// ────────────────────────────────────────────────────────────────────────────────
// 1. CLASS
// ────────────────────────────────────────────────────────────────────────────────
const ClassSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g. “10–A”
    grade: { type: String, required: true }, // e.g. “10”
    section: { type: String, required: true }, // e.g. “A”
    year: { type: Number, required: true }, // e.g. 2025

    teachers: [{ type: Schema.Types.ObjectId, ref: "Teacher" }], // array of teacher IDs
    subjects: [{ type: String, required: true }], // e.g. ["Math","Physics"]
    students: [{ type: Schema.Types.ObjectId, ref: "Student" }], // array of student IDs
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    analytics: {
      attendancePct: { type: Number, min: 0, max: 100, default: 0 },
      avgGrade: { type: Number, default: 0 },
      passPct: { type: Number, min: 0, max: 100, default: 0 },
    },
  },
  { timestamps: true }
);
const Class = model("Class", ClassSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 2. TEACHER
// ────────────────────────────────────────────────────────────────────────────────
const TeacherSchema = new Schema(
  {
    teacherId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    dateJoined: { type: Date, default: Date.now },
    salaryPaid: { type: Boolean, default: false },
    //adding schoolId
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },

    roles: [{ type: String, trim: true }], // e.g. ["ClassTeacher","LabInstructor"]
    teachingSubs: [{ type: String, required: true }], // e.g. ["Math","Physics"]

    classes: [{ type: Schema.Types.ObjectId, ref: "Class" }],
  },
  { timestamps: true }
);
const Teacher = model("Teacher", TeacherSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 3. PARENT (Embedded Subdocument)
// ────────────────────────────────────────────────────────────────────────────────
const ParentSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    students: [{ type: Schema.Types.ObjectId, ref: "Student" }], // array of student IDs
  },
  { timestamps: true }
);
const Parent = model("Parent", ParentSchema);
// ────────────────────────────────────────────────────────────────────────────────
// 4. STUDENT
// ────────────────────────────────────────────────────────────────────────────────
const SubjectGradeSchema = new Schema(
  {
    subject: { type: String, required: true }, // e.g. “Math”
    grade: { type: String, required: true }, // e.g. “A+” or “85”
  },
  { _id: false }
);

const AcademicReportSchema = new Schema(
  {
    attendancePct: { type: Number, min: 0, max: 100, default: 0 },
    grades: { type: [SubjectGradeSchema], default: [] },
  },
  { _id: false }
);

const StudentSchema = new Schema(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },

    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    dob: { type: Date },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
    address: { type: String },
    phone: { type: String },
    email: { type: String, unique: true },
    feePaid: { type: Boolean, default: false },

    parents:       [{ type: Schema.Types.ObjectId, ref: "Parent" }],
    academicReport: { type: AcademicReportSchema, default: () => ({}) },
  },
  { timestamps: true }
);
const Student = model("Student", StudentSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 5. EVENT
// ────────────────────────────────────────────────────────────────────────────────
const EventSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    //adding SchoolId
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    time: { type: String }, // e.g. “14:30”
    venue: { type: String },
  },
  { timestamps: true }
);
const Event = model("Event", EventSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 6. NOTIFICATION
// ────────────────────────────────────────────────────────────────────────────────
const NotificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Student", "Teacher", "Announcement", "Class", "Parent"],
      required: true,
    },
    message: { type: String, required: true },
    //adding SchoolId
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student" }, // if type=Student
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" }, // if type=Teacher
    classId: { type: Schema.Types.ObjectId, ref: "Class" }, // if type=Class
    parentId: { type: Schema.Types.ObjectId, ref: "Parent" }, // if type=Parent
    audience: {
      type: [String],
      enum: ["all_students", "all_teachers", "all_parents"],
      default: null,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }, // User who created the notification
    scheduleAt: { type: Date },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const Notification = model("Notification", NotificationSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 7. ACADEMIC CALENDAR
// ────────────────────────────────────────────────────────────────────────────────
const HolidaySchema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const ExamSchema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String },
    subjects: [{ type: String, required: true }],
  },
  { _id: false }
);

const FixedEventSchema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const AcademicCalendarSchema = new Schema(
  {
    year: { type: Number, required: true, unique: true },
    holidays: { type: [HolidaySchema], default: [] },
    examSchedule: { type: [ExamSchema], default: [] },
    fixedEvents: { type: [FixedEventSchema], default: [] },
    //adding SchoolId
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);
const AcademicCalendar = model("AcademicCalendar", AcademicCalendarSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 8. FEE STRUCTURE & PAYMENT
// ────────────────────────────────────────────────────────────────────────────────
const FeeStructureSchema = new Schema(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    description: { type: String },
  },
  { timestamps: true }
);
const FeeStructure = model("FeeStructure", FeeStructureSchema);

const PaymentSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    feeStructureId: {
      type: Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: true,
    },
    amountPaid: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: [
        "cash",
        "credit_card",
        "debit_card",
        "net_banking",
        "upi",
        "other",
      ],
      default: "other",
    },
    transactionId: { type: String },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);
const Payment = model("Payment", PaymentSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 9. ASSIGNMENT & SUBMISSION
// ────────────────────────────────────────────────────────────────────────────────
const AssignmentSchema = new Schema(
  {
    //adding SchoolId
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    assignedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);
const Assignment = model("Assignment", AssignmentSchema);

const SubmissionSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    submissionText: { type: String },
    attachmentUrl: { type: String },
    submittedAt: { type: Date, default: Date.now },
    grade: { type: String },
    feedback: { type: String },
    feedbackAt: { type: Date },
  },
  { timestamps: true }
);
const Submission = model("Submission", SubmissionSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 10. ATTENDANCE RECORD
// ────────────────────────────────────────────────────────────────────────────────
const AttendanceEntrySchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
  },
  { _id: false }
);

const AttendanceRecordSchema = new Schema(
  {
    //adding SchoolId
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    date: { type: Date, required: true },
    entries: { type: [AttendanceEntrySchema], default: [] },
  },
  { timestamps: true }
);
const AttendanceRecord = model("AttendanceRecord", AttendanceRecordSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 11. GRADE
// ────────────────────────────────────────────────────────────────────────────────
// models/Grade.j
const EntrySchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const GradeSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subjectId: {
      type: String,
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    // Only one "final" exam type per doc:
    entries: {
      type: [EntrySchema],
      default: [],
      validate: (arr) => arr.length > 0,
    },
  },
  { timestamps: true }
);

const Grade = mongoose.model("Grade", GradeSchema);


// ────────────────────────────────────────────────────────────────────────────────
// 12. LESSON PLAN
// ────────────────────────────────────────────────────────────────────────────────
const LessonGoalSchema = new Schema(
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    subject: { type: String, required: true },
    topics: { type: String, required: true },
    resources: { type: [String], default: [] },
  },
  { _id: false }
);

const LessonPlanSchema = new Schema(
  {
    //adding SchoolId
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    weekOf: { type: Date, required: true },
    goals: { type: [LessonGoalSchema], default: [] },
    sharedWithAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const LessonPlan = model("LessonPlan", LessonPlanSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 13. FORM / REQUEST
// ────────────────────────────────────────────────────────────────────────────────
const FormSchema = new Schema(
  {
    //adding SchoolId
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    type: {
      type: String,
      enum: ["leave_request", "event_participation", "feedback", "other"],
      required: true,
    },
    data: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Teacher" },
    reviewComment: { type: String },
  },
  { timestamps: true }
);
const Form = model("Form", FormSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 14. RESOURCE LIBRARY
// ────────────────────────────────────────────────────────────────────────────────
const ResourceSchema = new Schema(
  {
    //adding SchoolId
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const Resource = model("Resource", ResourceSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 15. CONVERSATION & MESSAGE
// ────────────────────────────────────────────────────────────────────────────────
const ConversationSchema = new Schema(
  {
    participantIds: [{ type: Schema.Types.ObjectId, required: true }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const Conversation = model("Conversation", ConversationSchema);

const MessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    fromUserId: { type: Schema.Types.ObjectId, required: true },
    toUserId: { type: Schema.Types.ObjectId, required: true },
    body: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const Message = model("Message", MessageSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 16. PTM SLOTS & BOOKINGS
// ────────────────────────────────────────────────────────────────────────────────
const PTMSlotSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const PTMSlot = model("PTMSlot", PTMSlotSchema);

const PTMBookingSchema = new Schema(
  {
    //adding SchoolId
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    slotId: { type: Schema.Types.ObjectId, ref: "PTMSlot", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    bookedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);
const PTMBooking = model("PTMBooking", PTMBookingSchema);

// ────────────────────────────────────────────────────────────────────────────────
// 17. EXPORT EVERYTHING
// ────────────────────────────────────────────────────────────────────────────────
module.exports = {
  // Auth models:
  User,
  RefreshToken,
  PasswordResetToken,
  School,
  // Domain models:
  Class,
  Parent,
  Teacher,
  Student,
  Event,
  Notification,
  AcademicCalendar,
  FeeStructure,
  Payment,
  Assignment,
  Submission,
  AttendanceRecord,
  Grade,
  LessonPlan,
  Form,
  Story,
  Resource,
  Conversation,
  Message,
  PTMSlot,
  PTMBooking,
  Schedule
};
