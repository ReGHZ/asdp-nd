const cloudinary = require('../config/cloudinary.conf');

const uploadProfilePicture = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'employees/profilePicture',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (e) {
    console.error('Error while uploading to cloudinary', e);
    throw new Error('Error while uploading to cloudinary');
  }
};

const uploadPhysicianLetter = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'employees/physicianLetter',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (e) {
    console.error('Error while uploading to cloudinary', e);
    throw new Error('Error while uploading to cloudinary');
  }
};

module.exports = { uploadProfilePicture, uploadPhysicianLetter };
