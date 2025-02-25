const mongoose = require('mongoose');

const PersonalDataSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    familialStatus: {
      type: String,
    },
    education: { type: String },
    major: { type: String },
    nationalIdentificationNumber: { type: String },
    taxpayerIdentificationNumber: { type: String },
    inhealthNumber: { type: String },
    bankNumber: { type: String },
    shoeSize: { type: Number },
    clothesSize: { type: String },
    // Save reference to media for profile picture
    profilePicture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PersonalData', PersonalDataSchema);
