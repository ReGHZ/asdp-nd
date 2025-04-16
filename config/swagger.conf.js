// config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// Import schema dan response
const leaveSchema = require('../docs/schemas/leave');
const authSchema = require('../docs/schemas/auth');
const errorSchema = require('../docs/schemas/error');
const commonResponses = require('../docs/responses/common');
const leaveResponses = require('../docs/responses/leave');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Leave Management API',
      version: '1.0.0',
      description: 'API untuk manajemen cuti karyawan',
      contact: {
        name: 'Developer',
        email: 'dev@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ...authSchema,
        ...leaveSchema,
        ...errorSchema,
      },
      responses: {
        ...commonResponses,
        ...leaveResponses,
      },
    },
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../docs/**/*.yaml'),
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
