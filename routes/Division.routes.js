const express = require('express');
const {
  createDivision,

  getSingleDivisionById,
  updateDivisionById,
  deleteDivisionById,
  getDivisions,
} = require('../controllers/Division.controller');

// Create express router
const router = express.Router();

// All the routes related to divisi will be here
router.post('/add', createDivision);
router.get('/get', getDivisions);
router.get('/get/:id', getSingleDivisionById);
router.put('/update/:id', updateDivisionById);
router.delete('/delete/:id', deleteDivisionById);

// Export the router
module.exports = router;
