require('dotenv').config();
const express = require('express');
const connectToDB = require('./database/Mongo.database');
const { divisionRoutes } = require('./config/routes.conf');

// Conf app and port
const app = express();
const PORT = process.env.PORT;

// Connect to database
connectToDB();

// Middleware -> express.json()
app.use(express.json());

// Routes
app.use('/api/divisi', divisionRoutes);

// Listener
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
