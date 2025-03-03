const fs = require('fs').promises;
const mongoose = require('mongoose');
const { uploadPhysicianLetter } = require('../helpers/Cloudinary.helper');
const LeaveApplication = require('../models/LeaveApplication');
const Media = require('../models/Media');
const User = require('../models/User');
const Employee = require('../models/Employee');
const {
  notifyManager,
  notifyAdmin,
  notifyUser,
} = require('../helpers/Mail.helper');

/**
 * Generate a unique letter number in the format: "NNN/YYYY".
 * The number resets every year.
 *
 * @async
 * @function generateLetterNumber
 * @returns {Promise<string>} - The generated letter number (e.g., "001/2023").
 * @throws {Error} - Throws an error if the letter number cannot be generated.
 */
const generateLetterNumber = async () => {
  // Start a session for transaction to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const currentYear = new Date().getFullYear();

    // Find the last leave application for the current year using the transaction session
    const lastLeave = await LeaveApplication.findOne(
      {
        dateOfLetter: {
          $gte: new Date(`${currentYear}-01-01`),
          $lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
      { letterNumber: 1, _id: 0 },
      { session } // Use the session for atomicity
    )
      .sort({ letterNumber: -1 }) // Sort by letterNumber in descending order
      .lean();

    let nextNumber = 1;
    if (lastLeave?.letterNumber) {
      // Extract the numeric part from the letterNumber (e.g., "001/2023" -> 1)
      const lastNumber = parseInt(lastLeave.letterNumber.split('/')[0], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Pad the number with zeros (e.g., 1 -> "001")
    const paddedNumber = String(nextNumber).padStart(3, '0');

    // Commit the transaction and end the session
    await session.commitTransaction();
    session.endSession();

    return `${paddedNumber}/${currentYear}`;
  } catch (error) {
    // Abort transaction and end session in case of error
    await session.abortTransaction();
    session.endSession();
    console.error('Error generating letter number:', error);
    throw new Error('Failed to generate letter number');
  }
};

/**
 * Create a new leave application by an authenticated user.
 * This function validates the request, handles file uploads (if applicable),
 * checks leave-specific rules (e.g., maximum days for sick, maternity, or major leave),
 * and verifies that the annual leave quota is sufficient.
 *
 * @async
 * @function createLeaveApplicationByUser
 * @param {Object} req - Express request object.
 *   req.user must contain:
 *     - userId: The authenticated user's ID.
 *   req.body should include:
 *     - startDate: The starting date of the leave.
 *     - endDate: The ending date of the leave.
 *     - reason: The reason for the leave.
 *     - typesOfLeave: The type of leave (allowed: "sick leave", "annual leave", "maternity leave", "major leave").
 *     - description: Additional description for the leave.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - JSON response indicating the result of the leave application creation.
 */
const createLeaveApplicationByUser = async (req, res) => {
  let tempFilePath = null;
  try {
    // Get user ID from the verified token
    const userId = req.user.userId;

    // Find the user and populate the employee details (including division)
    const user = await User.findById(userId).populate({
      path: 'employee',
      populate: { path: 'division' },
    });

    // Validate that the employee data is complete (must include division)
    if (!user?.employee?.division) {
      return res.status(404).json({
        success: false,
        message: 'Employee data is incomplete',
      });
    }

    // Extract leave application details from the request body
    const { startDate, endDate, reason, typesOfLeave, description } = req.body;

    // Allowed leave types
    const allowedTypes = [
      'sick leave',
      'annual leave',
      'maternity leave',
      'major leave',
    ];
    if (!allowedTypes.includes(typesOfLeave)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave type',
      });
    }

    // Validate that both start and end dates are provided
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // Calculate total number of leave days (inclusive)
    const dayLength = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Leave type-specific validations and file upload handling for sick leave
    let physicianLetter = null;
    if (typesOfLeave === 'sick leave') {
      if (dayLength > 14) {
        return res.status(400).json({
          success: false,
          message: 'Sick leave cannot exceed 14 days',
        });
      }
      // For sick leave, a physician letter is required
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Physician letter is required for sick leave',
        });
      }
      // Temporarily store the file path
      tempFilePath = req.file.path;
      try {
        // Upload the physician letter to Cloudinary
        const uploadResult = await uploadPhysicianLetter(tempFilePath);
        // Save file information to the Media model
        const media = new Media({
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          type: 'physicianLetter',
          uploadedBy: userId,
        });
        await media.save();
        physicianLetter = media._id;
      } finally {
        // Remove the temporary file regardless of upload success/failure
        await fs.unlink(tempFilePath);
      }
    } else if (typesOfLeave === 'maternity leave' && dayLength > 45) {
      return res.status(400).json({
        success: false,
        message: 'Maternity leave cannot exceed 45 days',
      });
    } else if (typesOfLeave === 'major leave' && dayLength > 90) {
      return res.status(400).json({
        success: false,
        message: 'Major leave cannot exceed 90 days',
      });
    }

    // Check annual leave quota without deducting it (only validation)
    if (typesOfLeave === 'annual leave') {
      if (user.employee.annualLeaveQuota < dayLength) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient annual leave quota',
        });
      }
    }

    // Generate a unique letter number for the leave application
    const letterNumber = await generateLetterNumber();

    // Create a new leave application record
    const newLeaveApplication = new LeaveApplication({
      employee: user.employee._id,
      letterNumber,
      dateOfLetter: new Date(),
      startDate,
      endDate,
      dayLength,
      reason,
      typesOfLeave,
      description,
      physicianLetter,
      status: 'pending',
    });

    await newLeaveApplication.save();

    // Notify the manager asynchronously (non-blocking)
    await notifyManager(
      user.employee.division._id,
      'New Leave Application Submitted',
      `<p>A new leave application has been submitted by ${user.employee.name}. Please review it.</p>`
    ).catch(console.error);

    return res.status(200).json({
      success: true,
      message: 'Leave application created successfully',
      data: newLeaveApplication,
    });
  } catch (e) {
    // Cleanup temporary file if an error occurs during file upload or processing
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(console.error);
    }
    console.error('Error creating leave application:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Review a leave application by a manager.
 * Validates the physician letter for sick leave applications, checks annual leave quota,
 * and updates the review status and notes.
 *
 * @async
 * @function reviewLeaveApplication
 * @param {Object} req - Express request object.
 *   req.params should include:
 *     - id: The ID of the leave application to review.
 *   req.body should include:
 *     - status: The new status ("reviewed" or "rejected").
 *     - notes: Optional review notes from the manager.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - JSON response with the updated leave application.
 */
const reviewLeaveApplication = async (req, res) => {
  try {
    // Find the leave application by ID and populate employee and physicianLetter details
    const leaveApplication = await LeaveApplication.findById(req.params.id)
      .populate('employee')
      .populate('physicianLetter');

    // If leave application is not found, return 404 error
    if (!leaveApplication) {
      return res
        .status(404)
        .json({ success: false, message: 'Leave application not found' });
    }

    // If the application is already finalized, do not allow further review
    if (
      leaveApplication.status === 'approved' ||
      leaveApplication.status === 'rejected'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Leave application has already been finalized and cannot be reviewed again',
      });
    }

    // Extract review status and notes from the request body
    const { status, notes } = req.body; // Expected values: 'reviewed' or 'rejected'

    // Validate the new status value
    if (!['reviewed', 'rejected'].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid review status' });
    }

    // For sick leave, ensure that a physician letter exists
    if (
      leaveApplication.typesOfLeave === 'sick leave' &&
      !leaveApplication.physicianLetter
    ) {
      return res.status(400).json({
        success: false,
        message: 'Physician letter is required for sick leave applications',
      });
    }

    // Validate annual leave quota for annual leave applications
    if (leaveApplication.typesOfLeave === 'annual leave') {
      const employee = await Employee.findById(leaveApplication.employee._id);
      if (employee.annualLeaveQuota < leaveApplication.dayLength) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient annual leave quota',
        });
      }
    }

    // Update the review status and add review data
    leaveApplication.status = status;
    leaveApplication.reviewedData = {
      reviewedBy: req.user.userId, // Manager's user ID who reviews the application
      reviewedAt: new Date(),
      notes: notes || '',
    };

    // If rejected, set rejection data and notify the employee
    if (status === 'rejected') {
      leaveApplication.rejectionData = {
        rejectedBy: req.user.userId,
        rejectedAt: new Date(),
        rejectionReason: notes,
      };

      // Notify employee of the rejection
      await notifyUser(
        leaveApplication.employee.email,
        'Leave Application Rejected',
        `<p>Your leave application has been rejected. Reason: ${
          notes || 'No reason provided'
        }</p>`
      );
    } else {
      // If reviewed, notify admin for final approval
      await notifyAdmin(
        'Leave Application Needs Approval',
        `<p>Leave application by ${leaveApplication.employee.name} has been reviewed by the Manager. Please approve for final approval.</p>`
      );
    }

    await leaveApplication.save();

    return res.json({ success: true, data: leaveApplication });
  } catch (e) {
    console.error('Error reviewing leave application:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Approve a leave application by an admin.
 * Validates the physician letter for sick leave, deducts annual leave quota if applicable,
 * and updates the application with approval details.
 *
 * @async
 * @function approvalLeaveApplication
 * @param {Object} req - Express request object.
 *   req.params should include:
 *     - id: The ID of the leave application to approve.
 *   req.body should include:
 *     - approvalNumber: The approval reference number.
 *     - notes: Optional notes regarding the approval.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - JSON response with the updated leave application.
 */
const approvalLeaveApplication = async (req, res) => {
  try {
    // Find the leave application by ID and populate related fields
    const leaveApplication = await LeaveApplication.findById(req.params.id)
      .populate('employee')
      .populate('physicianLetter');

    // If leave application is not found, return 404 error
    if (!leaveApplication) {
      return res
        .status(404)
        .json({ success: false, message: 'Leave application not found' });
    }

    // Only applications with status "reviewed" can be approved
    if (leaveApplication.status !== 'reviewed') {
      return res.status(400).json({
        success: false,
        message: 'Only reviewed applications can be approved',
      });
    }

    // For sick leave, ensure a physician letter is attached
    if (
      leaveApplication.typesOfLeave === 'sick leave' &&
      !leaveApplication.physicianLetter
    ) {
      return res.status(400).json({
        success: false,
        message: 'Physician letter is required for sick leave applications',
      });
    }

    // For annual leave, verify and deduct the annual leave quota
    if (leaveApplication.typesOfLeave === 'annual leave') {
      const employee = await Employee.findById(leaveApplication.employee._id);
      if (employee.annualLeaveQuota < leaveApplication.dayLength) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient annual leave quota',
        });
      }

      // Deduct the leave days from the employee's annual leave quota
      employee.annualLeaveQuota -= leaveApplication.dayLength;
      await employee.save();
    }

    // Extract approval details from request body
    const { approvalNumber, notes } = req.body;

    // Update application status and approval data
    leaveApplication.status = 'approved';
    leaveApplication.approvalData = {
      approvalNumber,
      approvedByAdmin: req.user.userId,
      approvedAt: new Date(),
      notes,
    };

    await leaveApplication.save();

    // Notify the employee that their leave application has been approved
    await notifyUser(
      leaveApplication.employee.email,
      'Leave Application Approved',
      `<p>Your leave application has been approved. Approval Number: ${approvalNumber}.</p>`
    );

    return res.json({ success: true, data: leaveApplication });
  } catch (e) {
    console.error('Error approving leave application:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = {
  createLeaveApplicationByUser,
  reviewLeaveApplication,
  approvalLeaveApplication,
};
