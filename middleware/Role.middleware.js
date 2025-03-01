const User = require('../models/User');

const roleMiddleware = (roles, checkManager = false) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId; // From token JWT

      // Populate employee -> position
      const user = await User.findById(userId).populate({
        path: 'employee',
        populate: {
          path: 'position',
          model: 'Position',
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check role user (admin/user)
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied! Insufficient permissions',
        });
      }

      // If checkManager is active, make sure the user is admin and the position is Manager
      if (checkManager && user.role === 'admin') {
        const position = user.employee?.position;

        if (!position || position.name.toLowerCase() !== 'manager') {
          return res.status(403).json({
            success: false,
            message: 'Access denied! Manager rights required',
          });
        }
      }

      next();
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: 'Something went wrong!' });
    }
  };
};

module.exports = roleMiddleware;
