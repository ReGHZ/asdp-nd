const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const {
  createLeaveApplicationByUser,
  reviewLeaveApplication,
  approvalLeaveApplication,
} = require('../controllers/LeaveApplication.controller');
const {
  uploadMiddleware,
  handleUploadError,
} = require('../middleware/Upload.middleware');

const roleMiddleware = require('../middleware/Role.middleware');

const router = express.Router();

// All the routes related to LeaveApplication will be here
router.post(
  '/add',
  authMiddleware,
  uploadMiddleware,
  handleUploadError,
  createLeaveApplicationByUser
);

router.put(
  '/review/:id',
  authMiddleware,
  roleMiddleware(['admin'], true),
  reviewLeaveApplication
);

router.put(
  '/approve/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  approvalLeaveApplication
);
module.exports = router;
