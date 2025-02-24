// Import all individual routes
const divisionRoutes = require('../routes/Division.routes');
const positionRoutes = require('../routes/Position.routes');
const authRoutes = require('../routes/Auth.routes');
const employeeRoutes = require('../routes/Employee.routes');
const personalDataRoutes = require('../routes/PersonalData.routes');

// export all routes
module.exports = {
  divisionRoutes,
  positionRoutes,
  authRoutes,
  employeeRoutes,
  personalDataRoutes,
};
