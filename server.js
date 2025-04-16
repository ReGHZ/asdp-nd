require('dotenv').config();
const express = require('express');
const connectToDB = require('./database/Mongo.database');
const {
  divisionRoutes,
  positionRoutes,
  authRoutes,
  employeeRoutes,
  personalDataRoutes,
  LeaveApplicationRoutes,
} = require('./config/routes.conf');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.conf');

// Conf app and port
const app = express();
const PORT = process.env.PORT;

// Connect to database
connectToDB();

// Middleware -> express.json()
app.use(express.json());

// Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Leave Management API',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
    `,
    customfavIcon: '/public/favicon.ico',
  })
);

// Routes
app.use('/api/division', divisionRoutes);
app.use('/api/position', positionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/personalData', personalDataRoutes);
app.use('/api/leaveApplication', LeaveApplicationRoutes);

// Listener
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
