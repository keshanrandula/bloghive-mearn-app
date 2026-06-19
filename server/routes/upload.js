const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const uploadImage = require('../middleware/uploadImage');

/**
 * @route   POST /api/upload
 * @desc    Upload an image to Cloudinary
 * @access  Private
 */
router.post('/', verifyToken, uploadImage, (req, res) => {
  return res.status(200).json({
    success: true,
    url: req.imageUrl
  });
});

module.exports = router;
