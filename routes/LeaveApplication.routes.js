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

/**
 * @swagger
 * tags:
 *   name: Leave Applications
 *   description: Employee leave application management
 */

/**
 * @swagger
 * /leaveApplication/add:
 *   post:
 *     summary: Submit a new leave application
 *     description: |
 *       Allows an employee to submit a new leave application.
 *       The type of leave must be specified. For sick leave, a physician letter is optional at this stage.
 *     tags: [Leave Applications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/LeaveApplicationInput'
 *           encoding:
 *             file:
 *               contentType: application/pdf
 *     responses:
 *       201:
 *         $ref: '#/components/responses/LeaveCreated'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/add',
  authMiddleware,
  uploadMiddleware,
  handleUploadError,
  createLeaveApplicationByUser
);

/**
 * @swagger
 * /leaveApplication/review/{id}:
 *   put:
 *     summary: Review or reject a leave application (Manager)
 *     description: |
 *       Manager can review or reject a leave application.
 *       Special validations:
 *       - Sick leave requires physician letter
 *       - Annual leave checks quota
 *     tags: [Leave Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeaveReviewInput'
 *           examples:
 *             reviewed:
 *               value:
 *                 status: reviewed
 *                 notes: "Looks good, pending admin approval"
 *             rejected:
 *               value:
 *                 status: rejected
 *                 notes: "Insufficient supporting documents"
 *     responses:
 *       200:
 *         description: Successfully processed
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/responses/LeaveReviewed'
 *                 - $ref: '#/components/responses/LeaveRejected'
 *             examples:
 *               reviewed:
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "5f8d04b3ab35b2c0a4c7b3a2"
 *                     status: "reviewed"
 *                     reviewedData:
 *                       reviewedBy: "5f8d04b3ab35b2c0a4c7b3a1"
 *                       reviewedAt: "2023-01-15T10:30:00Z"
 *                       notes: "Looks good"
 *               rejected:
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "5f8d04b3ab35b2c0a4c7b3a2"
 *                     status: "rejected"
 *                     rejectionData:
 *                       rejectedBy: "5f8d04b3ab35b2c0a4c7b3a1"
 *                       rejectedAt: "2023-01-15T10:30:00Z"
 *                       rejectionReason: "Insufficient docs"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             examples:
 *               invalidStatus:
 *                 value:
 *                   success: false
 *                   message: "Invalid review status"
 *               alreadyFinalized:
 *                 value:
 *                   success: false
 *                   message: "Leave application has already been finalized"
 *               missingLetter:
 *                 value:
 *                   success: false
 *                   message: "Physician letter is required for sick leave"
 *               insufficientQuota:
 *                 value:
 *                   success: false
 *                   message: "Insufficient annual leave quota"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden (role not allowed)
 *       404:
 *         description: Leave application not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
  '/review/:id',
  authMiddleware,
  roleMiddleware(['admin'], true),
  reviewLeaveApplication
);

/**
 * @swagger
 * /leaveApplication/approve/{id}:
 *   put:
 *     summary: Approve a leave application (Admin)
 *     description: |
 *       Admin can approve a reviewed leave application.
 *       Special validations:
 *       - Only reviewed applications can be approved
 *       - Sick leave requires physician letter
 *       - Annual leave will deduct quota
 *     tags: [Leave Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeaveApprovalInput'
 *           examples:
 *             standardApproval:
 *               value:
 *                 approvalNumber: "APP/2023/001"
 *                 notes: "Approved with full pay"
 *     responses:
 *       200:
 *         $ref: '#/components/responses/LeaveApproved'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             examples:
 *               notReviewed:
 *                 value:
 *                   success: false
 *                   message: "Only reviewed applications can be approved"
 *               missingLetter:
 *                 value:
 *                   success: false
 *                   message: "Physician letter is required for sick leave"
 *               insufficientQuota:
 *                 value:
 *                   success: false
 *                   message: "Insufficient annual leave quota"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden (role not allowed)
 *       404:
 *         description: Leave application not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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
