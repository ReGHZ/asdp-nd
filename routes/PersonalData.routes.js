const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const {
  updateProfilePicture,
  createPersonalDataByUser,
  updatePersonalDataByUser,
  getPersonalDataByUser,
} = require('../controllers/PersonalData.controller');
const {
  uploadMiddleware,
  handleUploadError,
} = require('../middleware/Upload.middleware');

const router = express.Router();

// All the routes related to PersonalData will be here
router.post('/add', authMiddleware, createPersonalDataByUser);
router.put('/update', authMiddleware, updatePersonalDataByUser);
router.get('/get', authMiddleware, getPersonalDataByUser);
router.post(
  '/upload',
  authMiddleware,
  uploadMiddleware,
  handleUploadError,
  updateProfilePicture
);

module.exports = router;
