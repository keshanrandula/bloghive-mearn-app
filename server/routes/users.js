const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const {
  toggleFollow,
  getUserProfile,
  getAllUsers,
  deleteUser,
  toggleUserRole,
  updateUserProfile,
  createCollection,
  addPostToCollection,
  removePostFromCollection
} = require('../controllers/userController');

// Public route to view user profile details
router.get('/:id', getUserProfile);

// Protected route to update profile details
router.put('/profile', verifyToken, updateUserProfile);

// Protected routes to manage bookmark collections
router.post('/collections', verifyToken, createCollection);
router.post('/collections/:name/add', verifyToken, addPostToCollection);
router.post('/collections/:name/remove', verifyToken, removePostFromCollection);

// Protected route to toggle follow/unfollow status
router.put('/:id/follow', verifyToken, toggleFollow);

// Admin-only management routes
router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.delete('/:id', verifyToken, verifyAdmin, deleteUser);
router.put('/:id/role', verifyToken, verifyAdmin, toggleUserRole);

module.exports = router;
