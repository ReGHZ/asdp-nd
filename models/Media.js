const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    // Media type can be used to distinguish between profile pictures, doctor's letters, etc.
    type: {
      type: String,
      enum: ['profilePicture', 'physicianLetter', 'other'], // You can add types as needed
      default: 'other',
    },
    // Storing the public_id of Cloudinary
    publicId: {
      type: String,
    },
    // Save reference to user that uploaded
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    // Upload date (optional)
    timestamps: true,
  }
);

module.exports = mongoose.model('Media', mediaSchema);
