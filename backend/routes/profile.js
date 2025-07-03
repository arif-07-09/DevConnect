const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Saving to /uploads/");
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    console.log("Storing file as:", uniqueName);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Update profile route
// Route
router.put(
  '/profile/update',
  auth,
  upload.single('photo'),
  async (req, res) => {
    try {
      const { name, email, oldPassword, password } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) return res.status(404).json({ msg: 'User not found' });

      user.name = name || user.name;
      user.email = email || user.email;

      // Password change
      if (oldPassword && password) {
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
          return res.status(400).json({ msg: 'Old password is incorrect' });
        }
        user.password = password;
      }

      // Photo save
      if (req.file) {
        user.photo = req.file.filename;
      }

      await user.save();
      res.json({ msg: 'Profile updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);


module.exports = router;
