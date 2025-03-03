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
 * Generate a unique letter number in the format: (number)/(month)
 * The number resets every year.
 * @returns {Promise<string>} - The generated letter number (e.g., "1/01", "2/01", etc.)
 */
const generateLetterNumber = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const currentYear = new Date().getFullYear();

    // Find the last leave application for the current year within a transaction
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
      .sort({ letterNumber: -1 }) // Sort by letterNumber
      .lean();

    let nextNumber = 1;
    if (lastLeave?.letterNumber) {
      // Extract the number part (e.g., "001/2023" -> 1)
      const lastNumber = parseInt(lastLeave.letterNumber.split('/')[0], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Add padding to the number (e.g., 1 -> "001")
    const paddedNumber = String(nextNumber).padStart(3, '0');

    await session.commitTransaction();
    session.endSession();

    return `${paddedNumber}/${currentYear}`; // Format: "001/2023"
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error generating letter number:', error);
    throw new Error('Failed to generate letter number');
  }
};

/**
 * Create a new leave application by an authenticated user.
 * Validates the request, handles file uploads (if applicable), and checks annual leave quota.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - JSON response with success status and data.
 */
const createLeaveApplicationByUser = async (req, res) => {
  let tempFilePath = null;
  try {
    // request user id from token
    const userId = req.user.userId;

    // Find user id and populate employee
    const user = await User.findById(userId).populate({
      path: 'employee',
      populate: { path: 'division' },
    });

    // Validation if user and employee exist on database
    if (!user?.employee?.division) {
      return res.status(404).json({
        success: false,
        message: 'Employee data is incomplete',
      });
    }

    // Request body
    const { startDate, endDate, reason, typesOfLeave, description } = req.body;

    // Validate allowed types of leave
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

    // Validate start date and end date
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

    const dayLength = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Validate leave type-specific rules
    let physicianLetter = null;
    if (typesOfLeave === 'sick leave') {
      if (dayLength > 14) {
        return res.status(400).json({
          success: false,
          message: 'Sick leave cannot exceed 14 days',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Physician letter is required for sick leave',
        });
      }

      tempFilePath = req.file.path;
      try {
        const uploadResult = await uploadPhysicianLetter(tempFilePath);
        const media = new Media({
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          type: 'physicianLetter',
          uploadedBy: userId,
        });
        await media.save();
        physicianLetter = media._id;
      } finally {
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

    // Check annual leave quota (only validation, no deduction)
    if (typesOfLeave === 'annual leave') {
      if (user.employee.annualLeaveQuota < dayLength) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient annual leave quota',
        });
      }
    }

    // Generate letter number
    const letterNumber = await generateLetterNumber();

    // Create leave application
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

    // Notify manager (non-blocking)
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
    // Cleanup temporary file if an error occurs
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
 * Validates the physician letter for sick leave applications and checks annual leave quota.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - JSON response with success status and data.
 */
const reviewLeaveApplication = async (req, res) => {
  try {
    // Find leaveApp id
    const leaveApplication = await LeaveApplication.findById(req.params.id)
      .populate('employee')
      .populate('physicianLetter'); // Populate physicianLetter for review

    // Check if leave application exist
    if (!leaveApplication) {
      return res
        .status(404)
        .json({ success: false, message: 'Leave application not found' });
    }

    // Check if the leave application is already approved or rejected
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

    // request body
    const { status, notes } = req.body; // 'approved' or 'rejected'

    // Validate status
    if (!['reviewed', 'rejected'].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid review status' });
    }

    // Validate physician letter for sick leave
    if (
      leaveApplication.typesOfLeave === 'sick leave' &&
      !leaveApplication.physicianLetter
    ) {
      return res.status(400).json({
        success: false,
        message: 'Physician letter is required for sick leave applications',
      });
    }

    // Validate annual leave quota
    if (leaveApplication.typesOfLeave === 'annual leave') {
      const employee = await Employee.findById(leaveApplication.employee._id);
      if (employee.annualLeaveQuota < leaveApplication.dayLength) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient annual leave quota',
        });
      }
    }

    // Update status and review data
    leaveApplication.status = status;
    leaveApplication.reviewedData = {
      reviewedBy: req.user.userId, // ID of the manager who reviewed the application
      reviewedAt: new Date(),
      notes: notes || '', // Optional notes from the manager
    };

    if (status === 'rejected') {
      leaveApplication.rejectionData = {
        rejectedBy: req.user.userId,
        rejectedAt: new Date(),
        rejectionReason: notes,
      };

      // Notify employee
      await notifyUser(
        leaveApplication.employee.email,
        'Leave Application Rejected',
        `<p>Your leave application has been rejected. Reason: ${
          notes || 'No reason provided'
        }</p>`
      );
    } else {
      // Notify admin for final approval
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
 * Validates the physician letter for sick leave applications and deducts annual leave quota.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - JSON response with success status and data.
 */
const approvalLeaveApplication = async (req, res) => {
  try {
    // Find id leave application
    const leaveApplication = await LeaveApplication.findById(req.params.id)
      .populate('employee')
      .populate('physicianLetter'); // Populate physicianLetter for verification

    // Check if leave application exist
    if (!leaveApplication) {
      return res
        .status(404)
        .json({ success: false, message: 'Leave application not found' });
    }

    // Validate status
    if (leaveApplication.status !== 'reviewed') {
      return res.status(400).json({
        success: false,
        message: 'Only reviewed applications can be approved',
      });
    }

    // Validate physician letter for sick leave
    if (
      leaveApplication.typesOfLeave === 'sick leave' &&
      !leaveApplication.physicianLetter
    ) {
      return res.status(400).json({
        success: false,
        message: 'Physician letter is required for sick leave applications',
      });
    }

    // Validate and deduct annual leave quota
    if (leaveApplication.typesOfLeave === 'annual leave') {
      const employee = await Employee.findById(leaveApplication.employee._id);
      if (employee.annualLeaveQuota < leaveApplication.dayLength) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient annual leave quota',
        });
      }

      // Deduct annual leave quota
      employee.annualLeaveQuota -= leaveApplication.dayLength;
      await employee.save();
    }

    // Request body
    const { approvalNumber, notes } = req.body;

    // Update status and approval data
    leaveApplication.status = 'approved';
    leaveApplication.approvalData = {
      approvalNumber,
      approvedByAdmin: req.user.userId,
      approvedAt: new Date(),
      notes,
    };

    await leaveApplication.save();

    // Notify employee
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
