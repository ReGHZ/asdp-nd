const Position = require('../models/Position');

// Store position
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
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Get all positions
const getPositions = async (req, res) => {
  try {
    const allPositions = await Position.find();

    if (allPositions.length === 0) {
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
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Get single position by id
const getSinglePositionById = async (req, res) => {
  try {
    const positionId = req.params.id;
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
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Update position by id
const updatePositionById = async (req, res) => {
  try {
    const positionId = req.params.id;
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
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Delete position by id
const deletePositionById = async (req, res) => {
  try {
    const positionId = req.params.id;
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
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Export all the functions
module.exports = {
  createPosition,
  getPositions,
  getSinglePositionById,
  updatePositionById,
  deletePositionById,
};
