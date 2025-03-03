const User = require('../models/User');
const PersonalData = require('../models/PersonalData');
const Media = require('../models/Media');
const { uploadProfilePicture } = require('../helpers/Cloudinary.helper');
const cloudinary = require('../config/cloudinary.conf');

/**
 * Create personal data for the authenticated user.
 *
 * This function creates a new personal data record for the authenticated user.
 * It expects that the user has an associated employee record.
 *
 * @async
 * @function createPersonalDataByUser
 * @param {Object} req - Express request object.
 *   req.user must contain:
 *     - userId: The authenticated user's ID.
 *   req.body contains personal data fields.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response indicating success or failure.
 */
const createPersonalDataByUser = async (req, res) => {
  try {
    // Get userId from token
    const userId = req.user.userId;

    // Find user and populate employee data
    const user = await User.findById(userId).populate('employee');
    if (!user || !user.employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // OPTIONAL: Check if personal data already exists (if business logic requires one record per employee)
    const existingPersonalData = await PersonalData.findOne({
      employee: user.employee._id,
    });
    if (existingPersonalData) {
      return res.status(400).json({
        success: false,
        message: 'Personal data already exists',
      });
    }

    // Create a new PersonalData record with the data from the request body
    const personalData = new PersonalData({
      ...req.body,
      employee: user.employee._id,
    });

    await personalData.save();

    return res.status(201).json({
      success: true,
      message: 'Personal data created successfully',
      data: {
        employee: user.employee,
        personalData: personalData || null,
      },
    });
  } catch (e) {
    console.error('Error creating personal data:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Update personal data for the authenticated user.
 *
 * This function updates the personal data associated with the authenticated user's employee.
 *
 * @async
 * @function updatePersonalDataByUser
 * @param {Object} req - Express request object.
 *   req.user must contain:
 *     - userId: The authenticated user's ID.
 *   req.body contains fields to update.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response with updated personal data.
 */
const updatePersonalDataByUser = async (req, res) => {
  try {
    // Get userId from token
    const userId = req.user.userId;

    // Find user and populate employee data
    const user = await User.findById(userId).populate('employee');
    if (!user || !user.employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Find the personal data record for this employee
    const personalData = await PersonalData.findOne({
      employee: user.employee._id,
    });
    if (!personalData) {
      return res.status(404).json({
        success: false,
        message: 'Personal data not found',
      });
    }

    // Update personal data with the new values from req.body
    const updatedPersonalData = await PersonalData.findByIdAndUpdate(
      personalData._id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Personal data updated successfully',
      data: updatedPersonalData,
    });
  } catch (e) {
    console.error('Error updating personal data:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Retrieve the personal data for the authenticated user.
 *
 * This function retrieves the personal data record associated with the authenticated user's employee.
 *
 * @async
 * @function getPersonalDataByUser
 * @param {Object} req - Express request object.
 *   req.user must contain:
 *     - userId: The authenticated user's ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response with employee and personal data.
 */
const getPersonalDataByUser = async (req, res) => {
  try {
    // Get userId from token
    const userId = req.user.userId;

    // Find user and populate employee data
    const user = await User.findById(userId).populate('employee').exec();
    if (!user || !user.employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Retrieve personal data and populate the profilePicture field
    const personalData = await PersonalData.findOne({
      employee: user.employee._id,
    })
      .populate('profilePicture')
      .exec();

    return res.status(200).json({
      success: true,
      message: 'Personal data retrieved successfully',
      data: {
        employee: user.employee,
        personalData: personalData || null,
      },
    });
  } catch (e) {
    console.error('Error retrieving personal data:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Update the profile picture for the authenticated user or a target user (if admin).
 *
 * This function uploads the new profile picture to Cloudinary, deletes any existing profile picture,
 * updates the Media collection, and updates the user's personal data record with the new media reference.
 *
 * @async
 * @function updateProfilePicture
 * @param {Object} req - Express request object.
 *   For admin users, req.body may include:
 *     - userId: The target user's ID whose profile picture is to be updated.
 *   req.file is expected to contain the uploaded file.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response with the new media information.
 */
const updateProfilePicture = async (req, res) => {
  let uploadedFilePublicId = null;

  try {
    const currentUser = req.user; // User information from the token
    let targetUserId;

    // Determine target user: Admins can update any user's picture, regular users only update their own.
    if (currentUser.role === 'admin' && req.body.userId) {
      targetUserId = req.body.userId;
    } else {
      targetUserId = currentUser.userId;
    }

    // Access permission validation: Regular users cannot update other users' pictures.
    if (currentUser.role !== 'admin' && currentUser.userId !== targetUserId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action',
      });
    }

    // Validate that a file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Upload the file to Cloudinary
    const uploadResult = await uploadProfilePicture(req.file.path);
    uploadedFilePublicId = uploadResult.publicId;

    // Find the target user and populate employee data
    const targetUser = await User.findById(targetUserId).populate('employee');
    if (!targetUser || !targetUser.employee) {
      return res.status(404).json({
        success: false,
        message: 'User or Employee not found',
      });
    }

    // Find personal data record for the target user's employee
    const personalData = await PersonalData.findOne({
      employee: targetUser.employee._id,
    });
    if (!personalData) {
      return res.status(404).json({
        success: false,
        message: 'Personal data not found',
      });
    }

    // Delete the existing profile picture, if any
    if (personalData.profilePicture) {
      const existingMedia = await Media.findById(personalData.profilePicture);
      if (existingMedia) {
        await cloudinary.uploader.destroy(existingMedia.publicId);
        await Media.findByIdAndDelete(existingMedia._id);
      }
    }

    // Create a new media record for the uploaded profile picture
    const newMedia = new Media({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      type: 'profilePicture',
      uploadedBy: currentUser.userId,
    });
    await newMedia.save();

    // Update the personal data record with the new profile picture reference
    personalData.profilePicture = newMedia._id;
    await personalData.save();

    return res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: newMedia,
    });
  } catch (e) {
    console.error('Error updating profile picture:', e);
    // Delete uploaded file from Cloudinary if an error occurs
    if (uploadedFilePublicId) {
      await cloudinary.uploader.destroy(uploadedFilePublicId);
    }
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
