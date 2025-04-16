// docs/responses/common.js
module.exports = {
  BadRequest: {
    description: 'Bad request',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
        example: {
          success: false,
          message: 'Invalid input data',
        },
      },
    },
  },
  Unauthorized: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
        example: {
          success: false,
          message: 'Authentication required',
        },
      },
    },
  },
  ServerError: {
    description: 'Internal server error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
        example: {
          success: false,
          message: 'Something went wrong!',
        },
      },
    },
  },
};
