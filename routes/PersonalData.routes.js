const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const {
  addPersonalData,
  updatePersonalDataById,
  updateProfilePicture,
} = require('../controllers/PersonalData.controller');
const {
  uploadMiddleware,
  handleUploadError,
} = require('../middleware/Upload.middleware');

const router = express.Router();

// All the routes related to PersonalData will be here
router.post('/add', authMiddleware, addPersonalData);
router.put('/update/:id', authMiddleware, updatePersonalDataById);
router.post(
  '/upload',
  authMiddleware,
  uploadMiddleware,
  handleUploadError,
  updateProfilePicture
);

module.exports = router;
