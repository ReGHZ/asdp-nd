const Employee = require('../models/Employee');
const PersonalData = require('../models/PersonalData');

// Update Employee data by id
const updateEmployeeDataById = async (req, res) => {
  try {
    // Find user by id
    const employeeId = req.params.id;

    // Retrieves all data from req.body, but separates leaveQuota
    const { leaveQuota, personalData, ...employeeData } = req.body;

    // Update data employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      employeeData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // If include personal data
    if (personalData) {
      // If data exist
      let personalDataRecord = await PersonalData.findOne({
        employee: employeeId,
      });
      if (personalDataRecord) {
        await PersonalData.findByIdAndUpdate(
          personalDataRecord._id,
          personalData,
          {
            new: true,
            runValidators: true,
          }
        );
      } else {
        // If data not exist then create
        personalDataRecord = new PersonalData({
          ...personalData,
          employee: employeeId,
        });
        await personalDataRecord.save();
      }
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

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const employees = await PersonalData.find()
      .populate('employee')
      .populate('profilePicture')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();
    return res.status(200).json({
      success: true,
      message: 'Employee retrieves successfully',
      data: employees,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = { getAllEmployees, updateEmployeeDataById };
