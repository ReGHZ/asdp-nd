const User = require('../models/User');
const PersonalData = require('../models/PersonalData');
const Media = require('../models/Media');
const { uploadProfilePicture } = require('../helpers/Cloudinary.helper');
const cloudinary = require('../config/cloudinary.conf');

// Store personal data by user
const createPersonalDataByUser = async (req, res) => {
  try {
    // Request userId from token login
    const userId = req.user.userId;

    // Find userId and populate employee
    const user = await User.findById(userId).populate('employee');

    // Validate if user and employee exist on database
    if (!user || !user.employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Store personal data file
    const personalData = new PersonalData({
      ...req.body,
      employee: user.employee._id,
    });

    await personalData.save();

    return res.status(200).json({
      message: 'Personal data created successfully',
      data: {
        employee: user.employee,
        personalData: personalData || null,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Update personal data by user
const updatePersonalDataByUser = async (req, res) => {
  try {
    // Request userId from token login
    const userId = req.user.userId;

    // Find user and populate employee
    const user = await User.findById(userId).populate('employee');

    // Validate if user, employee exist
    if (!user || !user.employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Find employee id on personal data
    const personalData = await PersonalData.findOne({
      employee: user.employee._id,
    });

    // Validate if personal data exist
    if (!personalData) {
      return res.status(404).json({
        success: false,
        message: 'Personal data not found',
      });
    }

    // update data personalData
    const updatedPersonalData = await PersonalData.findByIdAndUpdate(
      personalData._id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

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

// Get personal data by user
const getPersonalDataByUser = async (req, res) => {
  try {
    // Request user id from token
    const userId = req.user.userId;

    // Find user and populate employee
    const user = await User.findById(userId).populate('employee').exec();
    if (!user || !user.employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Find personal data associated with employee
    const personalData = await PersonalData.findOne({
      employee: user.employee._id,
    })
      .populate('profilePicture')
      .exec();

    return res.status(200).json({
      success: true,
      message: 'Employee retrieves successfully',
      data: {
        employee: user.employee,
        personalData: personalData || null, // if no personal data, return null,
      },
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

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: newMedia,
    });
  } catch (e) {
    console.error(e);

    // Delete uploaded files if an error occurs
    if (uploadedFilePublicId) {
      await cloudinary.uploader.destroy(uploadedFilePublicId);
    }

    // General error handling
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = {
  getPersonalDataByUser,
  createPersonalDataByUser,
  updatePersonalDataByUser,
  updateProfilePicture,
};
