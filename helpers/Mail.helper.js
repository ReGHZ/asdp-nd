const { sendEmail } = require('../config/mail.conf');
const User = require('../models/User');

// Get manager's email from a specific division
const getManagerEmails = async (divisionId) => {
  const managers = await User.find({ role: 'admin' }).populate({
    path: 'employee',
    populate: [{ path: 'position' }, { path: 'division' }],
  });

  return managers
    .filter(
      (manager) =>
        manager.employee?.position?.name === 'Manager' &&
        manager.employee?.division?._id.equals(divisionId)
    )
    .map((manager) => manager.employee.email);
};

// Get admin's email
const getAdminEmails = async () => {
  const admins = await User.find({ role: 'admin' }).populate({
    path: 'employee',
    populate: { path: 'position' }, // Check if role 'admin' is manager or not
  });

  return admins
    .filter((admin) => admin.employee?.position?.name !== 'Manager') // exclude manager
    .map((admin) => admin.employee.email);
};

// Send email notifications
const notifyManager = async (divisionId, subject, html) => {
  const managerEmails = await getManagerEmails(divisionId);
  if (managerEmails.length > 0) {
    await sendEmail(managerEmails, subject, html);
  }
};

const notifyAdmin = async (subject, html) => {
  const adminEmails = await getAdminEmails();
  if (adminEmails.length > 0) {
    await sendEmail(adminEmails, subject, html);
  }
};

const notifyUser = async (userEmail, subject, html) => {
  if (userEmail) {
    await sendEmail(userEmail, subject, html);
  }
};

module.exports = { notifyManager, notifyAdmin, notifyUser };
