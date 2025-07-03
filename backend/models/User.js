// backend/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  profilePic: {
    type: String, // URL or filename
    default: '',  // can be a default image URL
  },
  about: { type: String, enum: ['job_seeker', 'hiring'], default: 'job_seeker' }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
