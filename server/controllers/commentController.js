const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Create a comment or reply on a post
// @route   POST /api/comments/:postId
// @access  Private
const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text, parentId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = new Comment({
      postId,
      userId: req.user.id,
      text: text.trim(),
      parentId: parentId || null
    });

    const savedComment = await comment.save();
    await savedComment.populate('userId', 'username profilePic');

    // Trigger notification
    try {
      const Notification = require('../models/Notification');
      if (post.author.toString() !== req.user.id && !parentId) {
        await Notification.create({ sender: req.user.id, receiver: post.author, type: 'comment', post: post._id });
      } else if (parentId) {
        const parentComment = await Comment.findById(parentId);
        if (parentComment && parentComment.userId.toString() !== req.user.id) {
          await Notification.create({ sender: req.user.id, receiver: parentComment.userId, type: 'reply', post: post._id });
        }
      }
    } catch (err) {
      console.error('Failed to create comment/reply notification:', err);
    }

    return res.status(201).json({
      success: true,
      comment: savedComment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all comments for a post
// @route   GET /api/comments/:postId
// @access  Public
const getCommentsForPost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comments = await Comment.find({ postId })
      .populate('userId', 'username profilePic')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on a comment
// @route   PUT /api/comments/:commentId/like
// @access  Private
const toggleCommentLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const userId = req.user.id;
    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    // Trigger notification
    if (!isLiked) {
      try {
        const Notification = require('../models/Notification');
        if (comment.userId.toString() !== userId) {
          await Notification.create({ sender: userId, receiver: comment.userId, type: 'like_comment', post: comment.postId });
        }
      } catch (err) {
        console.error('Failed to create comment like notification:', err);
      }
    }

    return res.status(200).json({
      success: true,
      message: isLiked ? 'Comment unliked successfully' : 'Comment liked successfully',
      likes: comment.likes
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getCommentsForPost,
  toggleCommentLike
};
