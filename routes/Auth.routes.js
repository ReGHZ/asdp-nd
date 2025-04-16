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

/**
 * @swagger
 * tags:
 *   name: Login
 *   description: Login first to get a jwt token
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login and generate JWT token
 *     tags: [Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginSuccess'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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
