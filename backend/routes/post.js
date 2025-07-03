const express = require('express');
const multer = require("multer");
const path = require("path");
const router = express.Router();
const auth = require('../middleware/auth');
const User = require("../models/User");
const Post = require('../models/Post');
const Like = require('../models/Like');
const Notification = require('../models/Notification');

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create post route
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    console.log("📸 Uploaded File:", req.file);
    console.log("📝 Post Content:", req.body);

    const newPost = new Post({
      author: req.user.id,
      content: req.body.content,
      image: req.file ? req.file.filename : null
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json({ msg: 'Server error while creating post' });
  }
});

// Get all posts with like status and count
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name profilePic');

    const postsWithLikeInfo = await Promise.all(
      posts.map(async (post) => {
        const likeCount = await Like.countDocuments({ post: post._id });
        const likedByUser = await Like.exists({ post: post._id, user: req.user.id });

        return {
          ...post.toObject(),
          likeCount,
          likedByUser: !!likedByUser
        };
      })
    );

    res.json(postsWithLikeInfo);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch posts' });
  }
});

// Delete a post and its likes
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ msg: 'Post not found' });
    if (post.author.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorized to delete this post' });

    // Delete likes associated with the post
    await Like.deleteMany({ post: req.params.postId });

    // Optionally delete notifications related to this post
    // await Notification.deleteMany({ postId: req.params.postId });

    await post.deleteOne();

    res.json({ msg: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ msg: 'Server error while deleting post' });
  }
});

// Get single post by ID
router.get('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'name profilePic');

    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const likeCount = await Like.countDocuments({ post: post._id });
    const likedByUser = await Like.exists({ post: post._id, user: req.user.id });

    res.json({
      ...post.toObject(),
      likeCount,
      likedByUser: !!likedByUser,
    });
  } catch (err) {
    console.error('Error fetching single post:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// Unlike a post
router.delete('/:postId/unlike', auth, async (req, res) => {
  try {
    const result = await Like.findOneAndDelete({
      user: req.user.id,
      post: req.params.postId
    });

    if (!result) {
      return res.status(400).json({ msg: 'You have not liked this post yet' });
    }

    res.json({ msg: 'Post unliked' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to unlike post' });
  }
});

// Like a post and notify author
router.post('/:id/like', auth, async (req, res) => {
  try {
    const existing = await Like.findOne({ user: req.user.id, post: req.params.id });

    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({ msg: 'Like removed' });
    }

    const like = new Like({ user: req.user.id, post: req.params.id });
    await like.save();

    const post = await Post.findById(req.params.id).populate('author');
    const currentUser = await User.findById(req.user.id);

    if (post && post.author._id.toString() !== req.user.id) {
      const notification = new Notification({
        user: post.author._id,
        fromUser: req.user.id,
        type: 'like',
        postId: post._id,
        message: `${currentUser.name} liked your post`,
      });
      await notification.save();
    }

    res.status(200).json({ msg: 'Post liked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to toggle like' });
  }
});

module.exports = router;
