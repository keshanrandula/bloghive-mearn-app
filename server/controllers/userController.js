const User = require('../models/User');

// @desc    Toggle follow/unfollow a user
// @route   PUT /api/users/:id/follow
// @access  Private
const toggleFollow = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow: remove IDs from both lists
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
    } else {
      // Follow: add IDs to both lists
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      
      // Trigger notification
      const Notification = require('../models/Notification');
      await Notification.create({
        sender: currentUserId,
        receiver: targetUserId,
        type: 'follow'
      });
    }

    await currentUser.save();
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      followersCount: targetUser.followers.length,
      followingCount: targetUser.following.length,
      isFollowing: !isFollowing
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile details
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin Only)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user and their posts
// @route   DELETE /api/users/:id
// @access  Private (Admin Only)
const deleteUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete user
    await user.deleteOne();

    // Delete user's posts and comments
    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    await Post.deleteMany({ author: targetUserId });
    await Comment.deleteMany({ author: targetUserId });

    return res.status(200).json({ success: true, message: 'User and all associated data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle role of a user
// @route   PUT /api/users/:id/role
// @access  Private (Admin Only)
const toggleUserRole = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role updated to ${user.role} successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const { username, bio, profilePic, coverBanner } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if new username is taken
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (profilePic !== undefined) user.profilePic = profilePic;
    if (coverBanner !== undefined) user.coverBanner = coverBanner;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        coverBanner: user.coverBanner,
        role: user.role,
        followers: user.followers,
        following: user.following
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new bookmark collection
// @route   POST /api/users/collections
// @access  Private
const createCollection = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Collection name is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if collection already exists
    const collectionExists = user.collections.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
    if (collectionExists) {
      return res.status(400).json({ success: false, message: 'Collection name already exists' });
    }

    user.collections.push({ name: name.trim(), posts: [] });
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collections: user.collections
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a post to a collection
// @route   POST /api/users/collections/:name/add
// @access  Private
const addPostToCollection = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const collection = user.collections.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    if (collection.posts.includes(postId)) {
      return res.status(400).json({ success: false, message: 'Post already in collection' });
    }

    collection.posts.push(postId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Post added to collection successfully',
      collections: user.collections
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a post from a collection
// @route   POST /api/users/collections/:name/remove
// @access  Private
const removePostFromCollection = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ success: false, message: 'Post ID is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const collection = user.collections.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    collection.posts = collection.posts.filter(id => id.toString() !== postId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Post removed from collection successfully',
      collections: user.collections
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleFollow,
  getUserProfile,
  getAllUsers,
  deleteUser,
  toggleUserRole,
  updateUserProfile,
  createCollection,
  addPostToCollection,
  removePostFromCollection
};
