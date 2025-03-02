const fs = require('fs').promises;
const { uploadPhysicianLetter } = require('../helpers/Cloudinary.helper');
const LeaveApplication = require('../models/LeaveApplication');
const Media = require('../models/Media');
const User = require('../models/User');
const {
  notifyManager,
  notifyAdmin,
  notifyUser,
} = require('../helpers/Mail.helper');

// Generate letter number (format: 1/01, 1/02, .... and reset each year)
const generateLetterNumber = async () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  const lastLeave = await LeaveApplication.findOne({
    dateOfLetter: {
      $gte: new Date(`${currentYear}-01-01`),
      $lte: new Date(`${currentYear}-12-31`),
    },
  }).sort({ dateOfLetter: -1 });

  let nextNumber = 1;
  if (lastLeave && lastLeave.letterNumber) {
    const lastNumber = parseInt(lastLeave.letterNumber.split('/')[0]);
    nextNumber = lastNumber + 1;
  }

  return `${nextNumber}/${currentMonth}`;
};

// Create a leave application
const createLeaveApplicationByUser = async (req, res) => {
  try {
    // request user id from token
    const userId = req.user.userId;

    // Find user id and populate employee
    const user = await User.findById(userId).populate({
      path: 'employee',
      populate: { path: 'division' },
    });

    // Validation if user and employee exist on database
    if (!user || !user.employee || !user.employee.division) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Request body
    const { startDate, endDate, reason, typesOfLeave, description } = req.body;

    // Generate letter number
    const letterNumber = await generateLetterNumber();

    // Validate type of leave
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayLength = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (dayLength <= 0) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // Handle file upload for sick leave
    let physicianLetter = null;
    if (typesOfLeave === 'sick leave') {
      if (dayLength > 14) {
        if (req.file) await fs.unlink(req.file.path);
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

      // Upload file to Cloudinary
      const uploadResult = await uploadPhysicianLetter(req.file.path);

      // Save media record to DB
      const media = new Media({
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        type: 'physicianLetter',
        uploadedBy: userId,
      });
      await media.save();

      physicianLetter = media._id;
    }

    if (typesOfLeave === 'annual leave') {
      console.log('Annual leave quota:', user.employee.annualLeaveQuota);
      console.log('Requested day length:', dayLength);
      if (user.employee.annualLeaveQuota <= 0) {
        return res.status(400).json({
          success: false,
          message: 'You have no remaining annual leave quota',
        });
      }
      if (user.employee.annualLeaveQuota < dayLength) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient annual leave quota',
        });
      }
      // Deduct from annual leave quota
      user.employee.annualLeaveQuota -= dayLength;
      await user.employee.save();
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

    // Create leave application
    const newLeaveApplication = new LeaveApplication({
      employee: user.employee._id,
      letterNumber,
      startDate,
      endDate,
      dayLength: dayLength,
      reason,
      typesOfLeave,
      description,
      physicianLetter,
    });

    await newLeaveApplication.save();

    // Notify manager
    const divisionId = user.employee.division._id;
    await notifyManager(
      divisionId,
      'New Leave Application Submitted',
      `<p>A new leave application has ben submitted by ${user.employee.name}. Please review it </p>`
    );

    return res.status(200).json({
      success: true,
      message: 'Leave application created successfully',
      data: newLeaveApplication,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Manager's reviewed leave application
const reviewLeaveApplication = async (req, res) => {
  try {
    // Find leaveApp id
    const leaveApplicationId = req.params.id;
    const leaveApplication = await LeaveApplication.findById(
      leaveApplicationId
    ).populate('employee');

    // Check if leave application exist
    if (!leaveApplication) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found',
      });
    }

    // request body
    const { status, reason } = req.body; // 'approved' or 'rejected'

    // update status
    leaveApplication.status = status;
    leaveApplication.reviewedBy = req.user.userId;
    leaveApplication.reviewedAt = new Date();

    if (status === 'reviewed') {
      await notifyAdmin(
        'Leave Application Needs Approval',
        `<p>Leave application by ${leaveApplication.employee.name} has been reviewed by the Manager. Please approve for final approval</p>`
      );
    } else if (status === 'rejected') {
      leaveApplication.rejectionData = {
        rejectedBy: req.user.userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      };
      await notifyUser(
        leaveApplication.employee.email,
        'Leave Application Rejected',
        `<p> Your leave application has been. rejected. Reason ${reason}</p>`
      );
    }
    await leaveApplication.save();

    return res.status(200).json({
      success: true,
      data: leaveApplication,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Admin's proceed approval
const approvalLeaveApplication = async (req, res) => {
  try {
    // Find id leave application
    const applicationId = req.params.id;
    const leaveApplication = await LeaveApplication.findById(
      applicationId
    ).populate('employee');

    // Check if leave application exist
    if (!leaveApplication) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found',
      });
    }

    // Request body
    const { approvalNumber, notes } = req.body;

    // Ensure only pending or reviewed applications can be approved
    if (!['pending', 'reviewed'].includes(leaveApplication.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or reviewed applications can be approved.',
      });
    }

    // Approve leave application
    leaveApplication.status = 'approved';
    leaveApplication.approvalData = {
      approvalNumber,
      approvedByAdmin: req.user.userId,
      approvedAt: new Date(),
      notes,
    };

    await leaveApplication.save();

    // Prepare email content
    const subject = 'Leave Application Approved';
    const message = `<p>Your leave application has been approved. Approval Number: ${approvalNumber}.</p>`;

    // Send email to employee
    await notifyUser(leaveApplication.employee.email, subject, message);

    return res.status(200).json({
      success: true,
      data: leaveApplication,
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
  createLeaveApplicationByUser,
  reviewLeaveApplication,
  approvalLeaveApplication,
};
