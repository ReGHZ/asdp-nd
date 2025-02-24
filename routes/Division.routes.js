const express = require('express');
const {
  createDivision,

  getSingleDivisionById,
  updateDivisionById,
  deleteDivisionById,
  getDivisions,
} = require('../controllers/Division.controller');
const authMiddleware = require('../middleware/Auth.middleware');
const isAdminUserMiddleware = require('../middleware/Admin.middleware');

// Create express router
const router = express.Router();

// All the routes related to divisi will be here
router.post('/add', authMiddleware, isAdminUserMiddleware, createDivision);
router.get('/get', authMiddleware, getDivisions);
router.get('/get/:id', authMiddleware, getSingleDivisionById);
router.put(
  '/update/:id',
  authMiddleware,
  isAdminUserMiddleware,
  updateDivisionById
);
router.delete(
  '/delete/:id',
  authMiddleware,
  isAdminUserMiddleware,
  deleteDivisionById
);

// Export the router
module.exports = router;
