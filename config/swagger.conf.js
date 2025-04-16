const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
require('dotenv').config(); // pastikan ini dipanggil paling atas

// Import schemas & responses
const leaveSchema = require('../docs/schemas/leave');
const authSchema = require('../docs/schemas/auth');
const errorSchema = require('../docs/schemas/error');
const commonResponses = require('../docs/responses/common');
const leaveResponses = require('../docs/responses/leave');

// Setup servers dari env
const servers = [
  {
    url: process.env.BASE_URL || 'http://localhost:5000/api',
    description:
      process.env.NODE_ENV === 'production'
        ? 'Production server'
        : 'Local development server',
  },
];

// Swagger options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Leave Management API',
      version: '1.0.0',
      description: 'API for employee leave management system',
      contact: {
        name: 'Developer',
        email: 'dev@example.com',
      },
    },
    servers,
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
