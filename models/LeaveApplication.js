const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    letterNumber: {
      type: String,
      required: true,
    },
    dateOfLetter: {
      type: Date,
      default: Date.now,
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dayLength: String,
    typesOfLeave: {
      type: String,
      enum: ['annual leave', 'sick leave', 'maternity leave', 'major leave'],
      required: true,
    },
    reason: { type: String, required: true },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Manager yang mereview
    reviewedAt: { type: Date },
    approvalData: {
      //  Admin completes approval data
      approvalNumber: String,
      notes: String,
    },
    physicianLetter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);
