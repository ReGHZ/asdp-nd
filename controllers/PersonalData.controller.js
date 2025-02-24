const PersonalData = require('../models/PersonalData');
const Employee = require('../models/Employee');
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
        message: 'Employee not found',
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

module.exports = { addPersonalData };
