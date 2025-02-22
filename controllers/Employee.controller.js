const Employee = require('../models/Employee');

// Update Employee data by id
const updateEmployeeDataById = async (req, res) => {
  try {
    // Find user by id
    const employeeId = req.params.id;

    // Retrieves all data from req.body, but separates leaveQuota
    const { leaveQuota, ...updateData } = req.body;

    // Update data employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee data not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = { updateEmployeeDataById };
