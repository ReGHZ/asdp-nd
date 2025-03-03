const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Register a new user along with the associated employee data.
 * Uses a transaction to ensure both Employee and User are created atomically.
 *
 * @param {Object} req - Express request object.
 *   req.body should include:
 *     - nik: Unique identifier for the user.
 *     - password: User's password.
 *     - role: User role (e.g., "admin" or "user").
 *     - ...dataEmployee: Other employee-related fields.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response indicating success or failure.
 */
const register = async (req, res) => {
  // Start a new session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Extract user information from request body
    const { nik, password, role, ...dataEmployee } = req.body;

    // Check if a user with the provided NIK already exists
    const checkExistingUser = await User.findOne({ nik }).session(session);
    if (checkExistingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Validate password using regex
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters long, contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new Employee record
    const employee = new Employee(dataEmployee);
    await employee.save({ session });

    // Create a new User record linked to the Employee
    const user = new User({
      nik,
      password: hashedPassword,
      role,
      employee: employee._id,
    });
    await user.save({ session });

    // Commit transaction if both operations succeed
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error during user registration:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Authenticate user credentials and generate a JWT token.
 *
 * @param {Object} req - Express request object.
 *   req.body should include:
 *     - nik: The user's unique identifier.
 *     - password: The user's password.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response containing the JWT token if authentication is successful.
 */
const login = async (req, res) => {
  try {
    // Extract credentials from request body
    const { nik, password } = req.body;

    // Find user by NIK and populate the associated employee details
    const user = await User.findOne({ nik }).populate('employee');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist!",
      });
    }

    // Compare provided password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // 401 Unauthorized is more appropriate for invalid credentials
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials!',
      });
    }

    // Generate JWT token with user information
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
    });
  } catch (e) {
    console.error('Error during user login:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Change the user's password after verifying the old password.
 *
 * @param {Object} req - Express request object.
 *   req.body should include:
 *     - oldPassword: The user's current password.
 *     - newPassword: The user's new password.
 *   req.user should include:
 *     - userId: The authenticated user's ID (extracted from the JWT token).
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response indicating whether the password change was successful.
 */
const changePassword = async (req, res) => {
  try {
    // Extract old and new passwords from request body
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId; // Extracted from verified JWT token

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify that the old password matches the stored password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Old password is incorrect',
      });
    }

    // Prevent setting the new password equal to the old password
    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as the old password',
      });
    }

    // Validate new password using regex
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters long, contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password and save
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (e) {
    console.error('Error during password change:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

/**
 * Delete a user along with the associated employee and personal data.
 *
 * @param {Object} req - Express request object.
 *   req.params should include:
 *     - id: The ID of the user to delete.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response indicating whether the deletion was successful.
 */
const deleteUser = async (req, res) => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;
    const deletedUser = await User.findOneAndDelete({ _id: userId });
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser,
    });
  } catch (e) {
    console.error('Error during user deletion:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = { register, login, changePassword, deleteUser };
