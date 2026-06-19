const multer = require('multer');
const { uploadToCloudinary } = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

// Set up memory storage
const storage = multer.memoryStorage();

// Filter for image files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer upload configurations (accept single file with fieldname 'image')
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB size limit
  fileFilter
}).single('image');

// Check if Cloudinary credentials are fully configured
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

/**
 * Middleware that parses file upload and uploads it to Cloudinary,
 * assigning the result URL to req.imageUrl.
 * If Cloudinary is not configured, it saves the file locally.
 */
const uploadImage = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file using the "image" field' });
    }

    try {
      if (isCloudinaryConfigured) {
        const secureUrl = await uploadToCloudinary(req.file.buffer);
        req.imageUrl = secureUrl;
      } else {
        // Fallback to local storage
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = uniqueSuffix + ext;
        const filePath = path.join(uploadsDir, filename);
        
        // Write the buffer to the uploads directory
        fs.writeFileSync(filePath, req.file.buffer);
        
        // Construct local URL
        req.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      }
      next();
    } catch (error) {
      console.error('Upload middleware error:', error);
      return res.status(500).json({ success: false, message: 'Error uploading image' });
    }
  });
};

module.exports = uploadImage;
