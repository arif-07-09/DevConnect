const express = require('express');
const router = express.Router();
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Send follow request
router.post('/follow/:userId', auth, async (req, res) => {
  const { userId } = req.params;

  if (req.user.id === userId) {
    return res.status(400).json({ msg: 'Cannot follow yourself' });
  }

  const existing = await Follow.findOne({ follower: req.user.id, following: userId });
  if (existing) {
    return res.status(400).json({ msg: 'Follow request already sent or accepted' });
  }

  const request = new Follow({ follower: req.user.id, following: userId });
  await request.save();

  const fromUser = await User.findById(req.user.id);
  const notification = new Notification({
    user: userId,
    fromUser: req.user.id,
    type: 'follow_request',
    message: `${fromUser.name} sent you a follow request`
  });
  await notification.save();

  res.json({ msg: 'Follow request sent', status: request.status });
});

// Accept follow request
router.put('/follow/accept/:followerId', auth, async (req, res) => {
  const { followerId } = req.params;

  const follow = await Follow.findOne({
    follower: followerId,
    following: req.user.id,
    status: 'pending'
  });

  if (!follow) return res.status(404).json({ msg: 'Follow request not found' });

  follow.status = 'accepted';
  await follow.save();

  const toUser = await User.findById(req.user.id);
  const notification = new Notification({
    user: followerId,
    fromUser: req.user.id,
    type: 'follow_accepted',
    message: `${toUser.name} accepted your follow request`
  });
  await notification.save();

  res.json({ msg: 'Follow request accepted' });
});

// Reject follow request
// Reject follow request
router.delete('/follow/reject/:followerId', auth, async (req, res) => {
  try {
    const follow = await Follow.findOne({
      follower: req.params.followerId,
      following: req.user.id,
      status: 'pending'
    });

    if (!follow) {
      return res.status(404).json({ msg: 'Follow request not found' });
    }

    await follow.deleteOne();

    res.json({ msg: 'Follow request rejected' });
  } catch (err) {
    console.error('Reject follow request error:', err);
    res.status(500).json({ msg: 'Server error while rejecting follow request' });
  }
});


// Unfollow
router.delete('/unfollow/:userId', auth, async (req, res) => {
  await Follow.findOneAndDelete({
    follower: req.user.id,
    following: req.params.userId
  });
  res.json({ msg: 'Unfollowed successfully' });
});

// Get follow requests for a user
router.get('/follow/requests', auth, async (req, res) => {
  try {
    const requests = await Follow.find({
      following: req.user.id,
      status: 'pending'
    }).populate('follower', 'name email profilePic');

    res.json(requests);
  } catch (err) {
    console.error('Error fetching follow requests:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/follow-status/:userId', auth, async (req, res) => {
  try {
    const request = await Follow.findOne({
      follower: req.user.id,
      following: req.params.userId
    });

    if (!request) return res.json({ status: 'not_following' });

    res.json({ status: request.status });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
