const express = require('express');
const authMiddleware = require('../middleware/Auth.middleware');
const uploadMiddleware = require('../middleware/Upload.middleware');
const {
  addPersonalData,
  updatePersonalDataById,
  updateProfilePicture,
} = require('../controllers/PersonalData.controller');

const router = express.Router();

// All the routes related to PersonalData will be here
router.post('/add', authMiddleware, addPersonalData);
router.put('/update/:id', authMiddleware, updatePersonalDataById);
router.post(
  '/upload',
  authMiddleware,
  uploadMiddleware.single('image'),
  updateProfilePicture
);

module.exports = router;
