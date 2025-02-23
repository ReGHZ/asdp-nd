const mongoose = require('mongoose');
const Employee = require('./Employee');

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

// Middleware for delete Employee if User deleted
UserSchema.pre('findOneAndDelete', async function (next) {
  const user = await this.model.findOne(this.getQuery());
  if (user && user.employee) {
    await Employee.deleteOne({ _id: user.employee });
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
