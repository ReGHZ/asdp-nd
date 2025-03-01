const express = require('express');
const {
  updateEmployeeDataById,
  getAllEmployees,
  getDetailEmployeeById,
} = require('../controllers/Employee.controller');
const authMiddleware = require('../middleware/Auth.middleware');
const roleMiddleware = require('../middleware/Role.middleware');

const router = express.Router();

// All the routes related to Employee will be here
router.put(
  '/update/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  updateEmployeeDataById
);
router.get('/get', authMiddleware, roleMiddleware(['admin']), getAllEmployees);
router.get(
  '/get/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  getDetailEmployeeById
);

module.exports = router;
