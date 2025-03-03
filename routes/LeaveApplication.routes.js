const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const {
  createLeaveApplicationByUser,
  reviewLeaveApplication,
  approvalLeaveApplication,
} = require('../controllers/leaveApplicationCommands.controller');
const {
  getUserLeaveApplications,
  getManagerLeaveApplications,
  getAdminLeaveApplications,
} = require('../controllers/leaveApplicationQueries.controller');
const {
  uploadMiddleware,
  handleUploadError,
} = require('../middleware/Upload.middleware');

const roleMiddleware = require('../middleware/Role.middleware');

const router = express.Router();

// All the routes related to LeaveApplicationComands will be here
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
// All the routes related to LeaveApplicationQueries will be here
router.get('/user', authMiddleware, getUserLeaveApplications);
router.get(
  '/manager',
  authMiddleware,
  roleMiddleware(['admin'], true),
  getManagerLeaveApplications
);
router.get(
  '/admin',
  authMiddleware,
  roleMiddleware(['admin']),
  getAdminLeaveApplications
);
module.exports = router;
