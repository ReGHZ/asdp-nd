module.exports = {
  LoginRequest: {
    type: 'object',
    properties: {
      nik: { type: 'string', example: '1234567890' },
      password: { type: 'string', example: 'yourpassword' },
    },
    required: ['nik', 'password'],
  },
  LoginSuccess: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Logged in successfully' },
      token: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  },
};
