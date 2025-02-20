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
