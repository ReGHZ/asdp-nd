const express = require('express');
const { register, login } = require('../controllers/Auth.controller');

// Create express router
const router = express.Router();

// All the routes related to Authentication will be here
router.post('/register', register);
router.post('/login', login);

// Export the router
module.exports = router;
