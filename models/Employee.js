const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      // Validate email format using regex
      match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'],
    },
    placeOfBirth: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: [0, 'Age must be a positive number.'],
    },
    gender: {
      type: String,
      enum: ['Laki-laki', 'Perempuan'],
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    workEntryDate: {
      type: Date,
      required: true,
      // Validate that workEntryDate is not in the future
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: 'Work entry date cannot be in the future.',
      },
    },
    workTenure: {
      type: String,
    },
    tenure: {
      type: String,
    },
    dateSelectedPosition: {
      type: Date,
      required: true,
      // Validate that dateSelectedPosition is not in the future
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: 'Date selected position cannot be in the future.',
      },
    },
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
    socialSecurityEmployment: {
      type: String,
      required: true,
    },
    socialSecurityHealthcare: {
      type: String,
      required: true,
    },
    numberLetterOfDecree: {
      type: String,
      required: true,
    },
    jobSegment: {
      type: String,
      enum: ['Darat', 'Laut'],
      required: true,
    },
    salaryGrade: {
      type: String,
      required: true,
    },
    salaryScaleGrade: {
      type: String,
      required: true,
    },
    thtScale: {
      type: String,
      required: true,
    },
    thtGradeScale: {
      type: String,
      required: true,
    },
    basicIncomePensionClass: {
      type: String,
      required: true,
    },
    basicIncomePensionScaleClass: {
      type: String,
      required: true,
    },
    rank: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    segment: {
      type: String,
      required: true,
    },
    annualLeaveQuota: {
      type: Number,
      default: 12,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate workTenure and tenure (approximate calculation)
// Note: The calculation is approximate and uses the difference in milliseconds converted to years.
EmployeeSchema.pre('save', function (next) {
  const now = new Date();

  // Calculate workTenure in years (approximate)
  const workTenureMs = now - this.workEntryDate;
  const workTenureYear = Math.floor(workTenureMs / (1000 * 60 * 60 * 24 * 365));
  this.workTenure = `${workTenureYear} year${workTenureYear !== 1 ? 's' : ''}`;

  // Calculate tenure in years (approximate)
  const tenureMs = now - this.dateSelectedPosition;
  const tenureYear = Math.floor(tenureMs / (1000 * 60 * 60 * 24 * 365));
  this.tenure = `${tenureYear} year${tenureYear !== 1 ? 's' : ''}`;

  next();
});

module.exports = mongoose.model('Employee', EmployeeSchema);
