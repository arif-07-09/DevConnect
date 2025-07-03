// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Clear all notifications for a user
router.delete('/clear', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ msg: 'Notifications cleared' });
  } catch (err) {
    console.error('Error clearing notifications:', err);
    res.status(500).json({ msg: 'Server error while clearing notifications' });
  }
});

module.exports = router;
