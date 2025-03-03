const Employee = require('../models/Employee');
const PersonalData = require('../models/PersonalData');
const mongoose = require('mongoose');

/**
 * Update employee data by ID.
 *
 * This function updates an employee's details based on the provided ID.
 * It supports updating the employee's own data (excluding annualLeaveQuota,
 * which is intentionally not updated to preserve the default annual quota of 12)
 * and associated personal data. Both updates are performed within a transaction
 * to ensure atomicity. If personalData is provided, the function checks if a record
 * already exists. If it does, it updates the record; otherwise, it creates a new one.
 *
 * @param {Object} req - Express request object containing:
 *   - params.id: Employee ID to update.
 *   - body: The employee data fields to update.
 *     The body may include:
 *       - personalData: (Optional) Object containing personal data fields.
 *       - ...other employee fields (annualLeaveQuota will be ignored).
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response with updated employee and personal data.
 */
const updateEmployeeDataById = async (req, res) => {
  // Start a new session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Extract employee ID from URL parameters
    const employeeId = req.params.id;
    // Destructure request body to separate annualLeaveQuota and personalData from other employee fields
    // annualLeaveQuota is intentionally ignored and not updated.
    const { annualLeaveQuota, personalData, ...employeeData } = req.body;

    // Update employee data with validation enabled (annualLeaveQuota is not updated)
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      employeeData,
      { new: true, runValidators: true, session }
    );

    // If employee is not found, abort the transaction and return 404 error
    if (!updatedEmployee) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: 'Employee not found' });
    }

    let updatedPersonalData = null;
    // Check if personalData is provided in the request body
    if (personalData) {
      // Find existing personal data record for the employee
      let personalDataRecord = await PersonalData.findOne({
        employee: employeeId,
      }).session(session);
      if (personalDataRecord) {
        // Update existing personal data record
        updatedPersonalData = await PersonalData.findByIdAndUpdate(
          personalDataRecord._id,
          personalData,
          { new: true, runValidators: true, session }
        );
      } else {
        // Create new personal data record if it doesn't exist
        updatedPersonalData = new PersonalData({
          ...personalData,
          employee: employeeId,
        });
        await updatedPersonalData.save({ session });
      }
    }

    // Commit the transaction if all operations succeed
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: { updatedEmployee, updatedPersonalData },
    });
  } catch (e) {
    // Abort transaction on error and log error
    await session.abortTransaction();
    console.error('Error updating employee:', e);
    return res
      .status(500)
      .json({ success: false, message: 'Something went wrong!' });
  } finally {
    // End the session whether the transaction succeeded or failed
    session.endSession();
  }
};

/**
 * Get all employees with filtering, sorting, and pagination using aggregation.
 *
 * This function retrieves a list of employees based on the provided filters,
 * then uses an aggregation pipeline to join associated personal data, ensuring
 * that the sorting applied on employees is preserved in the final result.
 *
 * @param {Object} req - Express request object containing query parameters:
 *   - page: (Optional) Page number (default: 1).
 *   - limit: (Optional) Number of records per page (default: 10).
 *   - name: (Optional) Filter by employee name.
 *   - division: (Optional) Filter by division.
 *   - position: (Optional) Filter by position.
 *   - sortBy: (Optional) Field to sort by (default: 'name').
 *   - order: (Optional) Sort order ('asc' or 'desc', default: 'asc').
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response containing:
 *   - Data: Array of employee records with embedded personal data.
 *   - Pagination info: totalDocuments, currentPage, totalPages.
 */
const getAllEmployees = async (req, res) => {
  try {
    // Extract and parse query parameters with default values
    let {
      page = 1,
      limit = 10,
      name,
      division,
      position,
      sortBy = 'name',
      order = 'asc',
    } = req.query;
    page = Math.max(parseInt(page, 10), 1);
    limit = Math.max(parseInt(limit, 10), 1);

    // Determine sort order (-1 for desc, 1 for asc)
    const sortOrder = order === 'desc' ? -1 : 1;

    // Build filter object based on query parameters
    const employeeFilter = {};
    if (name) employeeFilter.name = { $regex: name, $options: 'i' };
    if (division) employeeFilter.division = division;
    if (position) employeeFilter.position = position;

    // Use aggregation pipeline to match, sort, paginate, and join personal data
    const employees = await Employee.aggregate([
      { $match: employeeFilter },
      { $sort: { [sortBy]: sortOrder } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'personaldatas', // Collection name for PersonalData (default plural lower-case)
          localField: '_id',
          foreignField: 'employee',
          as: 'personalData',
        },
      },
      {
        $unwind: {
          path: '$personalData',
          preserveNullAndEmptyArrays: true, // In case an employee has no personal data
        },
      },
    ]);

    // Count total documents that match the employee filter
    const totalDocuments = await Employee.countDocuments(employeeFilter);

    return res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      data: employees,
      totalDocuments,
      currentPage: page,
      totalPages: Math.ceil(totalDocuments / limit),
    });
  } catch (e) {
    console.error('Error retrieving employees:', e);
    return res
      .status(500)
      .json({ success: false, message: 'Something went wrong!' });
  }
};

module.exports = { getAllEmployees };

/**
 * Get detailed information of an employee by ID.
 *
 * This function retrieves an employee's details by ID along with the associated
 * personal data (if available). It validates the provided ID and returns a 400
 * error if the ID is invalid.
 *
 * @param {Object} req - Express request object containing:
 *   - params.id: Employee ID to retrieve.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response with the employee and their personal data.
 */
const getDetailEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate employee ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid employee ID' });
    }

    // Retrieve employee record by ID
    const employee = await Employee.findById(id).exec();
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: 'Employee not found' });
    }

    // Retrieve associated personal data and populate profilePicture if available
    const personalData = await PersonalData.findOne({ employee: id })
      .populate('profilePicture')
      .exec();

    return res.status(200).json({
      success: true,
      message: 'Employee retrieved successfully',
      data: { employee, personalData: personalData || null },
    });
  } catch (e) {
    console.error('Error retrieving employee details:', e);
    return res
      .status(500)
      .json({ success: false, message: 'Something went wrong!' });
  }
};

module.exports = {
  getAllEmployees,
  getDetailEmployeeById,
  updateEmployeeDataById,
};
