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
      enum: ['pending', 'reviewed', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedData: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Only manager's can review
      reviewedAt: { type: Date },
      notes: String,
    },
    approvalData: {
      approvalNumber: String,
      notes: String,
      approvedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
    },
    rejectionData: {
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectedAt: Date,
      rejectionReason: String,
    },
    physicianLetter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);
