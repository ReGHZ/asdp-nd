const mongoose = require('mongoose');
const Division = require('../models/Division');

/**
 * Create a new division.
 *
 * This function creates a new division record in the database.
 *
 * @async
 * @function createDivision
 * @param {Object} req - Express request object.
 *   req.body should contain division-related fields.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response indicating creation success.
 */
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
    console.error('Error creating division:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Retrieve all divisions.
 *
 * This function retrieves all divisions from the database.
 * Note: Returning 404 when no divisions are found might be changed to returning an empty array.
 *
 * @async
 * @function getDivisions
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response with a list of divisions.
 */
const getDivisions = async (req, res) => {
  try {
    const allDivisions = await Division.find();

    // Optionally, return empty array with 200 if no divisions found
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
    console.error('Error retrieving divisions:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Retrieve a single division by its ID.
 *
 * This function retrieves the details of a division based on the provided ID.
 *
 * @async
 * @function getSingleDivisionById
 * @param {Object} req - Express request object.
 *   req.params.id should contain the division ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response with division details.
 */
const getSingleDivisionById = async (req, res) => {
  try {
    const divisionId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(divisionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Division ID',
      });
    }

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
    console.error('Error retrieving division by ID:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Update a division by its ID.
 *
 * This function updates the division data based on the provided ID and update fields.
 *
 * @async
 * @function updateDivisionById
 * @param {Object} req - Express request object.
 *   req.params.id should contain the division ID.
 *   req.body should contain the fields to update.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response with updated division details.
 */
const updateDivisionById = async (req, res) => {
  try {
    const divisionId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(divisionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Division ID',
      });
    }

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
    console.error('Error updating division:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Delete a division by its ID.
 *
 * This function deletes a division from the database based on the provided ID.
 *
 * @async
 * @function deleteDivisionById
 * @param {Object} req - Express request object.
 *   req.params.id should contain the division ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response indicating deletion success.
 */
const deleteDivisionById = async (req, res) => {
  try {
    const divisionId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(divisionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Division ID',
      });
    }

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
    console.error('Error deleting division:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = {
  createDivision,
  getDivisions,
  getSingleDivisionById,
  updateDivisionById,
  deleteDivisionById,
};
