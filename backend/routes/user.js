// backend/routes/user.js
const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");

const Follow = require('../models/Follow');
const router = express.Router();
const User = require("../models/User");
const Post = require('../models/Post');           // 👈 Add this line
const Like = require('../models/Like');           // Ensure this is also imported
const Notification = require('../models/Notification'); // Ensure this too

const fs = require('fs');
const path = require('path');


// Setup Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Will save files in the `uploads` folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

router.get("/users", auth, async (req, res) => {
  try {
    const allUsers = await User.find({}, "-password"); // exclude password

    const result = await Promise.all(
      allUsers.map(async (user) => {
        const followers = await Follow.find({ following: user._id, status: "accepted" }).select("follower");
        const following = await Follow.find({ follower: user._id, status: "accepted" }).select("following");
        const pendingRequests = await Follow.find({ following: user._id, status: "pending" }).select("follower");

        return {
          ...user.toObject(),
          followers: followers.map(f => f.follower.toString()),
          following: following.map(f => f.following.toString()),
          pendingRequests: pendingRequests.map(f => f.follower.toString()),
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Failed to fetch users", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});



// DELETE /api/delete-account
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // 🧹 Delete profile image file if exists
    if (user.profilePic) {
      const imagePath = path.join(__dirname, '..', 'uploads', user.profilePic);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // 🧹 Delete posts and their images
    const posts = await Post.find({ author: userId });
    for (let post of posts) {
      if (post.image) {
        const imgPath = path.join(__dirname, '..', 'uploads', post.image);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
    }

    await Post.deleteMany({ author: userId });

    // 🧹 Remove likes by or on user's posts
    await Like.deleteMany({ user: userId });
    await Like.deleteMany({ post: { $in: posts.map(p => p._id) } });

    // 🧹 Remove follow relationships if any
    if (User.schema.path('followers')) {
      await User.updateMany({}, { $pull: { followers: userId, following: userId, pendingRequests: userId } });
    }

    // 🗑️ Finally, delete user
    await User.findByIdAndDelete(userId);

    res.json({ msg: 'Account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to delete account' });
  }
});




router.get("/user/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get posts for user
router.get("/user/:id/posts", auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.id }).sort({ createdAt: -1 });
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
});



router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const postsCount = await Post.countDocuments({ author: userId });
    const followReqCount = await Follow.countDocuments({ following: userId, status: 'pending' });
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('fromUser', 'name');  // ✅ FIX HERE
    res.json({
      stats: {
        posts: postsCount,
        followRequests: followReqCount,
        notifications: notifications.length,
      },
      notifications: notifications.map(n => ({
        _id: n._id,
        type: n.type,
        fromUser: n.fromUser,  // include user ID + name
        postId: n.postId,      // if applicable
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});




// Route: Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Route: Update user profile
router.put("/profile/update", auth, upload.single("photo"), async (req, res) => {
  try {
    const { name, email, oldPassword, password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ msg: "User not found" });

    // Update basic fields
    user.name = name || user.name;
    user.email = email || user.email;

    // Check and update password if needed
    if (oldPassword && password) {
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        return res.status(400).json({ msg: "Old password is incorrect" });
      }
      user.password = password;
    }

    // Save uploaded photo
    if (req.file) {
      user.profilePic = req.file.filename;
    }

    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(req.user.id).select("-password");

    res.json({ msg: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
