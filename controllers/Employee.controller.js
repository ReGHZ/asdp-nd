const Employee = require('../models/Employee');
const PersonalData = require('../models/PersonalData');

// Update Employee data by id
const updateEmployeeDataById = async (req, res) => {
  try {
    // Find user by id
    const employeeId = req.params.id;

    // Retrieves all data from req.body, but separates leaveQuota
    const { annualLeaveQuota, personalData, ...employeeData } = req.body;

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
    const { page = 1, limit = 10, name, division, position } = req.query;

    // Build filter for Employee
    const employeeFilter = {};
    if (name) {
      employeeFilter.name = { $regex: name, $options: 'i' };
    }
    if (division) {
      employeeFilter.division = division;
    }
    if (position) {
      employeeFilter.position = position;
    }

    // Find Employees that match the filter
    const employees = await Employee.find(employeeFilter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    // Get PersonalData linked to these employees
    const employeeIds = employees.map((emp) => emp._id);
    const personalDataWithEmployees = await PersonalData.find({
      employee: { $in: employeeIds },
    })
      .populate('employee')
      .populate('profilePicture')
      .exec();

    const totalDocuments = await PersonalData.countDocuments();
    return res.status(200).json({
      success: true,
      message: 'Employee retrieves successfully',
      data: personalDataWithEmployees,
      totalDocuments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalDocuments / limit),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Get employee detail by id
const getDetailEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find employee data
    const employee = await Employee.findById(id).exec();
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: 'Employee not found' });
    }

    // Find personal data associated with employee
    const personalData = await PersonalData.findOne({ employee: id })
      .populate('profilePicture')
      .exec();

    return res.status(200).json({
      success: true,
      message: 'Employee retrieves successfully',
      data: {
        employee,
        personalData: personalData || null, // if no personal data, return null
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

module.exports = {
  getAllEmployees,
  getDetailEmployeeById,
  updateEmployeeDataById,
};
