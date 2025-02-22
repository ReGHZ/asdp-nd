const express = require('express');
const {
  updateEmployeeDataById,
} = require('../controllers/Employee.controller');
const authMiddleware = require('../middleware/Auth.middleware');
const isAdminUserMiddleware = require('../middleware/Admin.middleware');

const router = express.Router();

// All the routes related to Employee will be here
router.put(
  '/update/:id',
  authMiddleware,
  isAdminUserMiddleware,
  updateEmployeeDataById
);

module.exports = router;
