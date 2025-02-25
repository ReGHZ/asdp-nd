const PersonalData = require('../models/PersonalData');
const Employee = require('../models/Employee');
const Media = require('../models/Media');
const { uploadProfilePicture } = require('../helpers/Cloudinary.helper');

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
  try {
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = {
  addPersonalData,
  updatePersonalDataById,
  updateProfilePicture,
};
