const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// Multer setup for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// ✅ GET /api/profile (fetch current user data)
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("Fetch profile error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ PUT /api/profile/update
router.put(
  "/profile/update",
  auth,
  upload.single("photo"),
  async (req, res) => {
    try {

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: "User not found" });


      const { name, email, about, oldPassword, password } = req.body;

      if (name) user.name = name;
      if (email) user.email = email;
      if (about && ["job_seeker", "hiring"].includes(about)) {
        user.about = about;
      }

      // ✅ Handle profile picture update
      if (req.file) {
        user.profilePic = req.file.filename;
      }

      // ✅ Handle password update securely
      if (password) {
        if (!oldPassword) {
          return res
            .status(400)
            .json({ msg: "Old password is required to set a new password" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ msg: "Incorrect old password" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }

      await user.save();

      res.json({
        msg: "Profile updated successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          about: user.about,
          profilePic: user.profilePic,
        },
      });
    } catch (err) {
      console.error("Update profile error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

module.exports = router;
