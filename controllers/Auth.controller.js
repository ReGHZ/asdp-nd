const Employee = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registration
const register = async (req, res) => {
  try {
    // Extract user information from request body
    const { nik, password, role, ...dataEmployee } = req.body;

    // Check if user nik is already exist in our database
    const checkExistingUser = await User.findOne({ $or: [{ nik }] });

    if (checkExistingUser) {
      return res.status(400).json({
        success: false,
        message: 'User is already exist',
      });
    }

    // Validate password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters long, contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Employee
    const employee = new Employee(dataEmployee);
    await employee.save();

    // Create User
    const user = new User({
      nik,
      password: hashedPassword,
      role,
      employee: employee._id,
    });

    await user.save();

    if (user) {
      return res.status(200).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'unable to register user! Please try again',
      });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    // Extract user information from our request body
    const { nik, password } = req.body;

    // Find user from nik
    const user = await User.findOne({ nik }).populate('employee');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User doesnt exist!',
      });
    }

    // Check if password correct or not
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(404).json({
        success: false,
        message: 'invalid credentials!',
      });
    }

    // Create user token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '30m',
      }
    );

    return res.status(200).json({
      success: true,
      message: 'logged in successfully',
      token,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    // Extract user information from our request body
    const { oldPassword, newPassword } = req.body;

    const userId = req.user.userId; // Extracted from verified JWT tokens

    // Find user by Id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if old password is match
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Old password is incorrect',
      });
    }

    // Validate password
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters long, contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update new password
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

// Delete User :: don't use
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findOneAndDelete({ _id: userId });

    if (!deleteUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfulyy',
      data: deletedUser,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = { register, login, changePassword, deleteUser };
