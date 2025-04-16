// docs/responses/leave.js
module.exports = {
  LeaveCreated: {
    description: 'Leave application created successfully',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/LeaveApplication' },
      },
    },
  },

  LeaveReviewed: {
    description: 'Leave application reviewed successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/LeaveApplication' },
          },
        },
      },
    },
  },

  LeaveRejected: {
    description: 'Leave application rejected successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/LeaveApplication' },
          },
        },
      },
    },
  },

  LeaveApproved: {
    description: 'Leave application approved successfully',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                status: { type: 'string', example: 'approved' },
                approvalData: {
                  $ref: '#/components/schemas/LeaveApprovalData',
                },
              },
            },
          },
        },
        examples: {
          success: {
            value: {
              success: true,
              data: {
                _id: '5f8d04b3ab35b2c0a4c7b3a2',
                status: 'approved',
                approvalData: {
                  approvalNumber: 'APP/2023/001',
                  approvedByAdmin: '5f8d04b3ab35b2c0a4c7b3a1',
                  approvedAt: '2023-01-20T08:15:00Z',
                  notes: 'Approved with full pay',
                },
              },
            },
          },
        },
      },
    },
  },
};
