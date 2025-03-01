const express = require('express');
const {
  register,
  login,
  changePassword,
  deleteUser,
} = require('../controllers/Auth.controller');
const authMiddleware = require('../middleware/Auth.middleware');
const roleMiddleware = require('../middleware/Role.middleware');
// Create express router
const router = express.Router();

// All the routes related to Authentication will be here
router.post('/register', authMiddleware, roleMiddleware(['admin']), register);
router.post('/login', login);
router.post('/changePassword', authMiddleware, changePassword);
router.delete(
  '/delete/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  deleteUser
);

// Export the router
module.exports = router;
