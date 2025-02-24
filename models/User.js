const mongoose = require('mongoose');
const Employee = require('./Employee');
const PersonalData = require('./PersonalData');

const UserSchema = new mongoose.Schema(
  {
    nik: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware for delete Employee and PersonalData if User deleted
UserSchema.pre('findOneAndDelete', async function (next) {
  const user = await this.model.findOne(this.getQuery());
  if (user && user.employee) {
    // Delete personalData
    await PersonalData.deleteMany({ employee: user.employee });
    // Delete employee
    await Employee.findByIdAndDelete(user.employee);
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
