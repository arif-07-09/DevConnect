// models/Notification.js

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // the recipient
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },              // optional: who triggered it
  type: {
    type: String,
    enum: ['like', 'follow_request', 'follow_accepted'],
    required: true,
  },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // if related to a post
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
