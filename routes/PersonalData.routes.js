const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const { addPersonalData } = require('../controllers/PersonalData.controller');

const router = express.Router();

// All the routes related to PersonalData will be here
router.post('/add', authMiddleware, addPersonalData);

module.exports = router;
