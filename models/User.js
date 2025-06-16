// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "school_admin", "parent"],
      default: "student",
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    imageUrl: {
      type: String,
      default: "https://www.gravatar.com/avatar",
      trim: true,   // Ensure the URL is trimmed    
    },

    // ─── ADD THESE TWO FIELDS ─────────────────────────────────────────────────
    studentId: {
      type: String,
      required: function () {
        return this.role === "student";
      },
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: function () {
        return this.role === "student";
      },
    },
    // ─────────────────────────────────────────────────────────────────────────
  },
  { timestamps: true }
);

// Hash the password before saving
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// // Compare a plaintext password to the hashed one
// UserSchema.methods.comparePassword = function(plainPassword) {
//   return bcrypt.compare(plainPassword, this.password);
// };

module.exports = model("User", UserSchema);
