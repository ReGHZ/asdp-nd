const express = require('express');
const {
  createPosition,
  getPositions,
  getSinglePositionById,
  updatePositionById,
  deletePositionById,
} = require('../controllers/Position.controller');
const authMiddleware = require('../middleware/Auth.middleware');
const roleMiddleware = require('../middleware/Role.middleware');

// create express router
const router = express.Router();

// All the routes related to divisi will be here
router.post('/add', authMiddleware, roleMiddleware(['admin']), createPosition);
router.get('/get', authMiddleware, getPositions);
router.get('/get/:id', authMiddleware, getSinglePositionById);
router.put(
  '/update/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  updatePositionById
);
router.delete(
  '/delete/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  deletePositionById
);

// Export the router
module.exports = router;
