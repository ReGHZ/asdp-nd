// docs/schemas/error.js
module.exports = {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Error message' },
      errors: {
        type: 'array',
        items: { type: 'object' },
      },
    },
  },
};
