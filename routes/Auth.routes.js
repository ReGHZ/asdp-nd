const express = require('express');
const {
  register,
  login,
  changePassword,
  deleteUser,
} = require('../controllers/Auth.controller');
const authMiddleware = require('../middleware/Auth.middleware');
const isAdminUserMiddleware = require('../middleware/Admin.middleware');
// Create express router
const router = express.Router();

// All the routes related to Authentication will be here
router.post('/register', authMiddleware, isAdminUserMiddleware, register);
router.post('/login', login);
router.post('/changePassword', authMiddleware, changePassword);
router.delete('/delete/:id', authMiddleware, isAdminUserMiddleware, deleteUser);

// Export the router
module.exports = router;
