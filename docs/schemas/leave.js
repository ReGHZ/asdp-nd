// docs/schemas/leave.js
module.exports = {
  LeaveApplication: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
      letterNumber: { type: 'string', example: '001/2023' },
      startDate: { type: 'string', format: 'date', example: '2023-01-01' },
      endDate: { type: 'string', format: 'date', example: '2023-01-05' },
      typesOfLeave: {
        type: 'string',
        enum: ['sick leave', 'annual leave', 'maternity leave', 'major leave'],
      },
      status: {
        type: 'string',
        enum: ['pending', 'reviewed', 'approved', 'rejected'],
        default: 'pending',
      },
    },
  },

  LeaveApplicationInput: {
    type: 'object',
    required: ['startDate', 'endDate', 'typesOfLeave'],
    properties: {
      startDate: {
        type: 'string',
        format: 'date',
      },
      endDate: {
        type: 'string',
        format: 'date',
      },
      reason: {
        type: 'string',
        maxLength: 500,
      },
      typesOfLeave: {
        type: 'string',
        enum: ['sick leave', 'annual leave', 'maternity leave', 'major leave'],
      },
      description: {
        type: 'string',
        maxLength: 500,
      },
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },

  LeaveReviewInput: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['reviewed', 'rejected'],
        description: 'Review status',
      },
      notes: {
        type: 'string',
        description: 'Optional review notes',
        maxLength: 500,
      },
    },
  },

  LeaveReviewData: {
    type: 'object',
    properties: {
      reviewedBy: {
        type: 'string',
        description: 'User ID of the reviewer',
      },
      reviewedAt: {
        type: 'string',
        format: 'date-time',
      },
      notes: {
        type: 'string',
      },
    },
  },

  LeaveRejectionData: {
    type: 'object',
    properties: {
      rejectedBy: {
        type: 'string',
        description: 'User ID who rejected',
      },
      rejectedAt: {
        type: 'string',
        format: 'date-time',
      },
      rejectionReason: {
        type: 'string',
      },
    },
  },

  LeaveApprovalInput: {
    type: 'object',
    required: ['approvalNumber'],
    properties: {
      approvalNumber: {
        type: 'string',
        description: 'Nomor persetujuan resmi',
        example: 'APP/2023/001',
      },
      notes: {
        type: 'string',
        description: 'Catatan persetujuan',
        maxLength: 500,
      },
    },
  },

  LeaveApprovalData: {
    type: 'object',
    properties: {
      approvalNumber: { type: 'string' },
      approvedByAdmin: { type: 'string' },
      approvedAt: { type: 'string', format: 'date-time' },
      notes: { type: 'string' },
    },
  },
};
