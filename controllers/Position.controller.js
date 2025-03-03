const mongoose = require('mongoose');
const Position = require('../models/Position');

/**
 * Create a new position.
 *
 * This function creates a new position record in the database using data from the request body.
 *
 * @async
 * @function createPosition
 * @param {Object} req - Express request object.
 *   req.body should contain the necessary fields for creating a position.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response indicating creation success.
 */
const createPosition = async (req, res) => {
  try {
    const newPositionFormData = req.body;
    const newlyCreatedPosition = await Position.create(newPositionFormData);

    return res.status(201).json({
      success: true,
      message: 'Position added successfully',
      data: newlyCreatedPosition,
    });
  } catch (e) {
    console.error('Error creating position:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Retrieve all positions.
 *
 * This function retrieves all positions from the database.
 * Note: Consider returning an empty array with a 200 status if no positions are found.
 *
 * @async
 * @function getPositions
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response with the list of positions.
 */
const getPositions = async (req, res) => {
  try {
    const allPositions = await Position.find();

    if (allPositions.length === 0) {
      // Optionally, you might want to return a 200 response with an empty array
      return res.status(404).json({
        success: false,
        message: 'No positions found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All positions retrieved successfully',
      data: allPositions,
    });
  } catch (e) {
    console.error('Error retrieving positions:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Retrieve a single position by its ID.
 *
 * This function retrieves the details of a position using the provided ID.
 *
 * @async
 * @function getSinglePositionById
 * @param {Object} req - Express request object.
 *   req.params.id should contain the position ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response with the position details.
 */
const getSinglePositionById = async (req, res) => {
  try {
    const positionId = req.params.id;

    // Validate ObjectId format to prevent cast errors
    if (!mongoose.Types.ObjectId.isValid(positionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Position ID',
      });
    }

    const positionDetails = await Position.findById(positionId);
    if (!positionDetails) {
      return res.status(404).json({
        success: false,
        message: 'Position not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Position found successfully',
      data: positionDetails,
    });
  } catch (e) {
    console.error('Error retrieving position by ID:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Update a position by its ID.
 *
 * This function updates an existing position with the provided update data.
 *
 * @async
 * @function updatePositionById
 * @param {Object} req - Express request object.
 *   req.params.id should contain the position ID.
 *   req.body should contain the fields to update.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response with the updated position details.
 */
const updatePositionById = async (req, res) => {
  try {
    const positionId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(positionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Position ID',
      });
    }

    const updateData = req.body;
    const updatedPosition = await Position.findByIdAndUpdate(
      positionId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedPosition) {
      return res.status(404).json({
        success: false,
        message: 'Position not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Position updated successfully',
      data: updatedPosition,
    });
  } catch (e) {
    console.error('Error updating position:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Delete a position by its ID.
 *
 * This function deletes a position record from the database using the provided ID.
 *
 * @async
 * @function deletePositionById
 * @param {Object} req - Express request object.
 *   req.params.id should contain the position ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} JSON response indicating deletion success.
 */
const deletePositionById = async (req, res) => {
  try {
    const positionId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(positionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Position ID',
      });
    }

    const deletedPosition = await Position.findByIdAndDelete(positionId);
    if (!deletedPosition) {
      return res.status(404).json({
        success: false,
        message: 'Position not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Position deleted successfully',
      data: deletedPosition,
    });
  } catch (e) {
    console.error('Error deleting position:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = {
  createPosition,
  getPositions,
  getSinglePositionById,
  updatePositionById,
  deletePositionById,
};
