const express = require('express');
const {
  createDivision,

  getSingleDivisionById,
  updateDivisionById,
  deleteDivisionById,
  getDivisions,
} = require('../controllers/Division.controller');
const authMiddleware = require('../middleware/Auth.middleware');
const roleMiddleware = require('../middleware/Role.middleware');

// Create express router
const router = express.Router();

// All the routes related to divisi will be here
router.post('/add', authMiddleware, roleMiddleware(['admin']), createDivision);
router.get('/get', authMiddleware, getDivisions);
router.get('/get/:id', authMiddleware, getSingleDivisionById);
router.put(
  '/update/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  updateDivisionById
);
router.delete(
  '/delete/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  deleteDivisionById
);

// Export the router
module.exports = router;
