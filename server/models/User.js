const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    profilePic: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    purchasedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
      }
    ],
    collections: [
      {
        name: { type: String, required: true },
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', UserSchema);
