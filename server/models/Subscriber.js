const mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Subscriber', SubscriberSchema);
