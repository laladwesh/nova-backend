// utils/connectDb.js

const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/school_app";
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDb;
