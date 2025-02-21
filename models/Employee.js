const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: { type: String, required: true, unique: true },
    placeOfBirth: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    age: { type: Number, required: true },
    gender: {
      type: String,
      enum: ['Laki-laki', 'Perempuan'],
      required: true,
    },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    workEntryDate: { type: Date, required: true },
    workTenure: { type: String },
    tenure: { type: String },
    dateSelectedPosition: { type: Date, required: true },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      required: true,
    },
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Position',
      required: true,
    },
    socialSecurityEmployment: { type: String, required: true },
    socialSecurityHealthcare: { type: String, required: true },
    numberLetterOfDecree: { type: String, required: true },
    jobSegment: { type: String, enum: ['Darat', 'Laut'], required: true },
    slaryGrade: { type: String, required: true },
    slaryScaleGrade: { type: String, required: true },
    thtScale: { type: String, required: true },
    thtGradeScale: { type: String, required: true },
    basicIncomePensionClass: { type: String, required: true },
    basicIncomePensionScaleClass: { type: String, required: true },
    rank: { type: String, required: true },
    class: { type: String, required: true },
    segment: { type: String, required: true },
    leaveQuota: { type: Number, default: 12 },
  },
  {
    timestamps: true,
  }
);

// Middleware for calculate workTenure and tenure
EmployeeSchema.pre('save', function (next) {
  const now = new Date();

  // Calculate workTenure (in years)
  const workTenureMs = now - this.workEntryDate;
  const workTenureYear = Math.floor(workTenureMs / (1000 * 60 * 60 * 24 * 365));
  this.workTenure = `${workTenureYear} year`;

  // Calculate tenure (in years)
  const tenureMs = now - this.dateSelectedPosition;
  const tenureYear = Math.floor(tenureMs / (1000 * 60 * 60 * 24 * 365));
  this.tenure = `${tenureYear} year`;

  next();
});

module.exports = mongoose.model('Employee', EmployeeSchema);
