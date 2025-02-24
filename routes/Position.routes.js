const express = require('express');
const {
  createPosition,
  getPositions,
  getSinglePositionById,
  updatePositionById,
  deletePositionById,
} = require('../controllers/Position.controller');
const authMiddleware = require('../middleware/Auth.middleware');
const isAdminUserMiddleware = require('../middleware/Admin.middleware');

// create express router
const router = express.Router();

// All the routes related to divisi will be here
router.post('/add', authMiddleware, isAdminUserMiddleware, createPosition);
router.get('/get', authMiddleware, getPositions);
router.get('/get/:id', authMiddleware, getSinglePositionById);
router.put(
  '/update/:id',
  authMiddleware,
  isAdminUserMiddleware,
  updatePositionById
);
router.delete(
  '/delete/:id',
  authMiddleware,
  isAdminUserMiddleware,
  deletePositionById
);

// Export the router
module.exports = router;
