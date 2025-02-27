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

// Conf app and port
const app = express();
const PORT = process.env.PORT;

// Connect to database
connectToDB();

// Middleware -> express.json()
app.use(express.json());

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
