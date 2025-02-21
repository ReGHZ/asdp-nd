const express = require('express');
const {
  register,
  login,
  changePassword,
} = require('../controllers/Auth.controller');
const authMiddleware = require('../middleware/Auth.middleware');
// Create express router
const router = express.Router();

// All the routes related to Authentication will be here
router.post('/register', register);
router.post('/login', login);
router.post('/changePassword', authMiddleware, changePassword);

// Export the router
module.exports = router;
