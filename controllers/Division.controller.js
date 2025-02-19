const Division = require('../models/Division');

// Store division
const createDivision = async (req, res) => {
  try {
    const newDivisionFormData = req.body;
    const newlyCreatedDivision = await Division.create(newDivisionFormData);

    return res.status(201).json({
      success: true,
      message: 'Division added successfully',
      data: newlyCreatedDivision,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Get all divisions
const getDivisions = async (req, res) => {
  try {
    const allDivisions = await Division.find();

    if (allDivisions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No divisions found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All divisions retrieved successfully',
      data: allDivisions,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Get single division by id
const getSingleDivisionById = async (req, res) => {
  try {
    const divisionId = req.params.id;
    const divisionDetails = await Division.findById(divisionId);

    if (!divisionDetails) {
      return res.status(404).json({
        success: false,
        message: 'Division not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Division found successfully',
      data: divisionDetails,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Update division by id
const updateDivisionById = async (req, res) => {
  try {
    const divisionId = req.params.id;
    const updateData = req.body;
    const updatedDivision = await Division.findByIdAndUpdate(
      divisionId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedDivision) {
      return res.status(404).json({
        success: false,
        message: 'Division not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Division updated successfully',
      data: updatedDivision,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Delete division by id
const deleteDivisionById = async (req, res) => {
  try {
    const divisionId = req.params.id;
    const deletedDivision = await Division.findByIdAndDelete(divisionId);

    if (!deletedDivision) {
      return res.status(404).json({
        success: false,
        message: 'Division not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Division deleted successfully',
      data: deletedDivision,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Export all the functions
module.exports = {
  createDivision,
  getDivisions,
  getSingleDivisionById,
  updateDivisionById,
  deleteDivisionById,
};
