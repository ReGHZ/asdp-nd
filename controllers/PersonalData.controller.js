const User = require('../models/User');
const Employee = require('../models/Employee');
const PersonalData = require('../models/PersonalData');
const Media = require('../models/Media');
const { uploadProfilePicture } = require('../helpers/Cloudinary.helper');
const cloudinary = require('../config/cloudinary.conf');

// Store personal data
const addPersonalData = async (req, res) => {
  try {
    // Request body
    const { employeeId, ...personalData } = req.body;

    // Validate if employee exist on database
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Personal data not found',
      });
    }

    // Store personal data file
    const newPersonalData = new PersonalData({
      employee: employeeId,
      ...personalData,
    });

    await newPersonalData.save();

    return res.status(200).json({
      message: 'Personal data created successfully',
      data: newPersonalData,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Update personal data
const updatePersonalDataById = async (req, res) => {
  try {
    // Fund user by id
    const personalDataId = req.params.id;

    // Retrieves all data from req.body
    const updateData = req.body;

    // update data personalData
    const updatedPersonalData = await PersonalData.findByIdAndUpdate(
      personalDataId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPersonalData) {
      return res.status(404).json({
        success: false,
        message: 'Personal data not found',
      });
    }

    return res.status(200).json({
      message: 'Personal data updated successfully',
      data: updatedPersonalData,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Upload profile picture
const updateProfilePicture = async (req, res) => {
  let uploadedFilePublicId = null;

  try {
    const currentUser = req.user; // User information from the token
    let targetUserId;

    // Determine the target user based on the role of admin or regular user
    if (currentUser.role === 'admin' && req.body.userId) {
      targetUserId = req.body.userId; // Admin can determine the target user
    } else {
      targetUserId = currentUser.userId; // Regular users can only change themselves
    }

    // Access permission validation
    if (currentUser.role !== 'admin' && currentUser.userId !== targetUserId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action',
      });
    }

    // Check uploaded files
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'No file uploaded' });
    }

    // Upload files to Cloudinary
    const uploadResult = await uploadProfilePicture(req.file.path);
    uploadedFilePublicId = uploadResult.publicId;

    // Search for target users and employees
    const targetUser = await User.findById(targetUserId).populate('employee');
    if (!targetUser || !targetUser.employee) {
      return res.status(404).json({
        success: false,
        message: 'User or Employee not found',
      });
    }

    // Search for personal user data
    const personalData = await PersonalData.findOne({
      employee: targetUser.employee._id,
    });
    if (!personalData) {
      return res.status(404).json({
        success: false,
        message: 'Personal data not found',
      });
    }

    // Delete old images if any
    if (personalData.profilePicture) {
      const existingMedia = await Media.findById(personalData.profilePicture);
      if (existingMedia) {
        await cloudinary.uploader.destroy(existingMedia.publicId);
        await Media.findByIdAndDelete(existingMedia._id);
      }
    }

    // Create new media
    const newMedia = new Media({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      type: 'profilePicture',
      uploadedBy: currentUser.userId, // Use the userId of the token
    });
    await newMedia.save();

    // Update profile picture in personal data
    personalData.profilePicture = newMedia._id;
    await personalData.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: newMedia,
    });
  } catch (error) {
    console.error(error);

    // Delete uploaded files if an error occurs
    if (uploadedFilePublicId) {
      await cloudinary.uploader.destroy(uploadedFilePublicId);
    }

    // General error handling
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  addPersonalData,
  updatePersonalDataById,
  updateProfilePicture,
};
