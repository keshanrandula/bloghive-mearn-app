const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  createComment,
  getCommentsForPost,
  toggleCommentLike
} = require('../controllers/commentController');

// Public route to get comments for a post
router.get('/:postId', getCommentsForPost);

// Protected route to add a comment to a post
router.post('/:postId', verifyToken, createComment);

// Protected route to toggle like on a comment
router.put('/:commentId/like', verifyToken, toggleCommentLike);

module.exports = router;
