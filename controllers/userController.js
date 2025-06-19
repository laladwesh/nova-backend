// controllers/userController.js

/**
 * User Controller
 *  - getProfile:       Return the current user’s profile
 *  - updateProfile:    Update name, email, phone, address, etc.
 *  - changePassword:   Verify old password and set a new password
 *  - listRoles:        Return all possible roles
 *  - getUserRole:      Return the role of a specific user by ID
 *  - setUserRole:      Update the role of a specific user (admin only)
 *
 * Assumptions:
 *  - authMiddleware populates req.user = { userId, role, ... }
 *  - User model has fields: name, email, password, phone, address, role
 *  - Environment: bcryptjs for hashing, Mongoose for DB operations
 */

const bcrypt = require("bcryptjs");
const { User } = require("../models"); // adjust path if needed
const { get } = require("mongoose");

// Static list of allowed roles
const ALLOWED_ROLES = ["school_admin", "teacher", "student", "parent"];

module.exports = {
  // GET /users/me
  getProfile: async (req, res) => {
    try {
      const userId = req.user._id;
      console.log("Fetching profile for userId:", userId);
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized." });
      }

      const user = await User.findById(userId).select("-password -__v");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      console.error("UserController.getProfile error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /users/me
  updateProfile: async (req, res) => {
    try {
      const userId = req.user._id;
      const { name, email, phone, address } = req.body;
      console.log(
        "Updating profile for userId:",
        userId,
        "with data:",
        req.body
      );
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized." });
      }

      const updates = {};
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (address) updates.address = address;

      // If email is being updated, check uniqueness
      if (email) {
        const existing = await User.findOne({
          email: email.toLowerCase(),
          _id: { $ne: userId },
        });
        if (existing) {
          return res
            .status(409)
            .json({
              success: false,
              message: "Email already in use by another account.",
            });
        }
        updates.email = email.toLowerCase();
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true, context: "query" }
      ).select("-password -__v");

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        data: user,
      });
    } catch (err) {
      console.error("UserController.updateProfile error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /users/me/password
  changePassword: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { oldPassword, newPassword } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized." });
      }
      if (!oldPassword || !newPassword) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Old password and new password are required.",
          });
      }

      const user = await User.findById(userId).select("+password");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      // Verify old password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Old password is incorrect." });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password changed successfully.",
      });
    } catch (err) {
      console.error("UserController.changePassword error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /users/roles
  listRoles: async (req, res) => {
    try {
      // Optionally, enforce that only admins can retrieve the full list
      // if (req.user.role !== 'school_admin') {
      //   return res.status(403).json({ success: false, message: 'Forbidden.' });
      // }
      return res.status(200).json({
        success: true,
        data: ALLOWED_ROLES,
      });
    } catch (err) {
      console.error("UserController.listRoles error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // GET /users/:userId/role
  getUserRole: async (req, res) => {
    try {
      const { userId } = req.params;

      // Only certain roles (e.g. school_admin) can view other users’ roles
      if (req.user.role !== "school_admin") {
        return res.status(403).json({ success: false, message: "Forbidden." });
      }

      const user = await User.findById(userId).select("role");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      return res.status(200).json({
        success: true,
        data: { userId: user._id, role: user.role },
      });
    } catch (err) {
      console.error("UserController.getUserRole error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  // PUT /users/:userId/role
  setUserRole: async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Only school_admin can change roles
      if (req.user.role !== "school_admin") {
        return res.status(403).json({ success: false, message: "Forbidden." });
      }
      if (!role) {
        return res
          .status(400)
          .json({ success: false, message: "Role is required." });
      }
      if (!ALLOWED_ROLES.includes(role)) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Role must be one of: ${ALLOWED_ROLES.join(", ")}`,
          });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true, context: "query" }
      ).select("-password -__v");

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      return res.status(200).json({
        success: true,
        message: "User role updated successfully.",
        data: { userId: user._id, role: user.role },
      });
    } catch (err) {
      console.error("UserController.setUserRole error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
  uploadImage: async (req, res) => {
    try {
      const userId = req.user._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized." });
      }

      const urlPath = req.body.urlPath;
      if (!urlPath) {
        return res
          .status(400)
          .json({ success: false, message: "Image URL is required." });
      }

      // Update user profile with new image URL
      const user = await User.findByIdAndUpdate(
        userId,
        { imageUrl: urlPath },
        { new: true, runValidators: true, context: "query" }
      ).select("-password -__v");

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Profile image updated successfully.",
        data: user,
      });
    } catch (err) {
      console.error("UserController.uploadImage error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
  getImage: async (req, res) => {
    try {
      const userId = req.params.userId;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID is required." });
      }

      const user = await User.findById(userId).select("imageUrl");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      return res.status(200).json({
        success: true,
        data: { imageUrl: user.imageUrl },
      });
    } catch (err) {
      console.error("UserController.getImage error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
  getUserById: async (req, res) => {
    try {
      const userId = req.params.id;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID is required." });
      }

      const user = await User.findById(userId).select("-password -__v").populate("schoolId", "name");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      console.error("UserController.getUserById error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
};
