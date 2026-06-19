const cloudinary = require('cloudinary').v2;

// Check if Cloudinary credentials are fully configured
const isConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('WARNING: Cloudinary credentials are missing from .env. Running in MOCK upload mode.');
}

/**
 * Uploads a file buffer to Cloudinary.
 * If credentials are missing, falls back to a simulated upload URL.
 * @param {Buffer} fileBuffer 
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      // Return a simulated URL when credentials are not provided (useful for tests/dev fallback)
      const mockUrl = `https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg`;
      return resolve(mockUrl);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'bloghive'
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  uploadToCloudinary
};
