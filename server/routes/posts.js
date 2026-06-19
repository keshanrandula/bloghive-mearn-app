const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
  purchasePost,
  getSearchSuggestions
} = require('../controllers/postController');

// Public routes
router.get('/', getAllPosts);
router.get('/suggestions', getSearchSuggestions);
router.get('/:id', getPostById);

// Protected routes (require valid JWT token)
router.post('/', verifyToken, createPost);
router.put('/:id', verifyToken, updatePost);
router.delete('/:id', verifyToken, deletePost);
router.put('/:id/like', verifyToken, toggleLike);
router.put('/:id/bookmark', verifyToken, toggleBookmark);
router.post('/:id/purchase', verifyToken, purchasePost);

module.exports = router;
