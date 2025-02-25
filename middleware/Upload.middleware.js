const multer = require('multer');
const path = require('path');

// File temporary storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save temporary files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    // Create unique file names with timestamps
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter (only accept image files)
const checkFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true); // Terima file
  } else {
    cb(new Error('Not an image! Please upload only images.'), false); // Tolak file
  }
};

// Middleware upload configuration
const uploadMiddleware = multer({
  storage: storage,
  fileFilter: checkFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // File size limit: 5MB
  },
}).single('image'); // Only accept one file with field name 'image'

// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Error from the multer (for example, the file is too large)
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    // Other errors (for example, invalid file type)
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next(); // Move on to the next middleware/controller if there are no errors
};

module.exports = { uploadMiddleware, handleUploadError };
