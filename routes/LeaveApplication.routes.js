const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const {
  createLeaveApplicationByUser,
} = require('../controllers/LeaveApplication.controller');
const {
  uploadMiddleware,
  handleUploadError,
} = require('../middleware/Upload.middleware');

const router = express.Router();

// All the routes related to LeaveApplication will be here
router.post(
  '/add',
  authMiddleware,
  uploadMiddleware,
  handleUploadError,
  createLeaveApplicationByUser
);

module.exports = router;
