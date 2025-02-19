const express = require('express');
const {
  createPosition,
  getPositions,
  getSinglePositionById,
  updatePositionById,
  deletePositionById,
} = require('../controllers/Position.controller');

// create express router
const router = express.Router();

// All the routes related to divisi will be here
router.post('/add', createPosition);
router.get('/get', getPositions);
router.get('/get/:id', getSinglePositionById);
router.put('/update/:id', updatePositionById);
router.delete('/delete/:id', deletePositionById);

// Export the router
module.exports = router;
