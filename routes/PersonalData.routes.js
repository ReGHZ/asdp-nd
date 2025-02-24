const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const {
  addPersonalData,
  updatePersonalDataById,
} = require('../controllers/PersonalData.controller');

const router = express.Router();

// All the routes related to PersonalData will be here
router.post('/add', authMiddleware, addPersonalData);
router.put('/update/:id', authMiddleware, updatePersonalDataById);

module.exports = router;
