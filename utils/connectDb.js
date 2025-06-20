// utils/connectDb.js
const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const uri =
      process.env.MONGODB_URI ||
      "mongodb+srv://ashshandilya4:8002189162a@school.gro4b4a.mongodb.net/School";
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
