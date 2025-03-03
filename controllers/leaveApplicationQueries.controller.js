const LeaveApplication = require('../models/LeaveApplication');
const User = require('../models/User');

/**
 * List of allowed fields for sorting
 * @type {string[]}
 */
const ALLOWED_SORT_FIELDS = [
  'dateOfLetter', // Sorting by application date
  'startDate', // Sorting by leave start date
  'endDate', // Sorting by leave end date
  'status', // Sorting by application status
  'employee.name', // Sorting by employee name (after population)
  'employee.division.name', // Sorting by division name (after population)
];

/**
 * List of valid leave types
 * @type {string[]}
 */
const VALID_LEAVE_TYPES = [
  'annual leave',
  'sick leave',
  'maternity leave',
  'major leave',
];

/**
 * Escapes special characters in a string for safe use in regex
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Validates and parses a date string
 * @param {string} dateStr - Date string to validate
 * @returns {Date|null} Valid Date object or null if invalid
 */
const parseDate = (dateStr) => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Builds the base aggregation pipeline with filters
 * @param {Object} req - Express request object
 * @param {Object} initialMatch - Predefined security filters
 * @returns {Array} MongoDB aggregation pipeline
 * @throws {Error} If date format is invalid or filters are invalid
 */
const buildPipeline = (req, initialMatch = {}) => {
  const { startDate, endDate, typesOfLeave, status, employeeName, division } =
    req.query;
  const pipeline = [];
  const matchStage = { ...initialMatch };

  // Date range filter based on startDate and endDate
  if (startDate || endDate) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (startDate && !start) {
      throw new Error('Invalid startDate format. Expected format: YYYY-MM-DD');
    }
    if (endDate && !end) {
      throw new Error('Invalid endDate format. Expected format: YYYY-MM-DD');
    }
    if (start && end && start > end) {
      throw new Error('startDate must be before or equal to endDate');
    }

    const dateFilter = {};
    if (start) dateFilter.$gte = start;
    if (end) dateFilter.$lte = end;

    if (Object.keys(dateFilter).length > 0) {
      matchStage.startDate = dateFilter;
    }
  }

  // Filter by leave type
  if (typesOfLeave) {
    if (!VALID_LEAVE_TYPES.includes(typesOfLeave)) {
      throw new Error(
        `Invalid leave type. Valid types: ${VALID_LEAVE_TYPES.join(', ')}`
      );
    }
    matchStage.typesOfLeave = typesOfLeave;
  }

  // Filter by status
  if (status) {
    if (!['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
      throw new Error('Invalid status value');
    }
    matchStage.status = status;
  }

  // Add the base filters if any exist
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  // Lookup employee and populate division & position
  pipeline.push(
    {
      $lookup: {
        from: 'employees',
        localField: 'employee',
        foreignField: '_id',
        as: 'employee',
      },
    },
    { $unwind: { path: '$employee', preserveNullAndEmptyArrays: false } },
    {
      $lookup: {
        from: 'divisions',
        localField: 'employee.division',
        foreignField: '_id',
        as: 'employee.division',
      },
    },
    {
      $unwind: {
        path: '$employee.division',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: 'positions',
        localField: 'employee.position',
        foreignField: '_id',
        as: 'employee.position',
      },
    },
    {
      $unwind: {
        path: '$employee.position',
        preserveNullAndEmptyArrays: false,
      },
    }
  );

  // Filter by employee name (case-insensitive regex)
  if (employeeName?.trim()) {
    pipeline.push({
      $match: {
        'employee.name': new RegExp(escapeRegex(employeeName.trim()), 'i'),
      },
    });
  }

  // Filter by division (case-insensitive regex)
  if (division?.trim()) {
    pipeline.push({
      $match: {
        'employee.division.name': new RegExp(escapeRegex(division.trim()), 'i'),
      },
    });
  }

  return pipeline;
};

/**
 * Applies pagination and sorting to the pipeline
 * @param {Array} pipeline - Base aggregation pipeline
 * @param {Object} req - Express request object
 * @returns {Array} Modified pipeline with pagination stages
 */
const applyPaginationAndSorting = (pipeline, req) => {
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1); // Ensure page is at least 1
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10)); // Limit between 1 and 100

  // Validate and set sorting parameters
  const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy)
    ? req.query.sortBy
    : 'dateOfLetter'; // Default to 'dateOfLetter' if invalid
  const order = req.query.order === 'desc' ? -1 : 1; // Default to ascending

  // Ensure sorting fields exist after lookup and unwind
  pipeline.push({
    $addFields: {
      'employee.name': { $ifNull: ['$employee.name', ''] },
      'employee.division.name': { $ifNull: ['$employee.division.name', ''] },
    },
  });

  // Add sorting and pagination using $facet
  pipeline.push({
    $facet: {
      metadata: [
        { $count: 'total' }, // Count total documents
        { $addFields: { page, limit } }, // Include pagination info in metadata
      ],
      data: [
        { $sort: { [sortBy]: order } }, // Apply sorting
        { $skip: (page - 1) * limit }, // Skip documents for pagination
        { $limit: limit }, // Limit the number of documents
        {
          $project: {
            'employee.password': 0, // Exclude sensitive data
            'employee.email': 0, // Exclude sensitive data
          },
        },
      ],
    },
  });

  return pipeline;
};

/**
 * GET /leaveApplication/user
 * Returns leave applications for the authenticated user with pagination and filtering
 */
const getUserLeaveApplications = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user?.employee) {
      return res
        .status(404)
        .json({ success: false, message: 'Employee not found' });
    }

    // Build the pipeline with an employee filter
    const pipeline = buildPipeline(req, { employee: user.employee._id });
    const paginatedPipeline = applyPaginationAndSorting([...pipeline], req);

    // Execute the aggregation
    const [result = { metadata: [], data: [] }] =
      await LeaveApplication.aggregate(paginatedPipeline);
    const total = result.metadata[0]?.total || 0;
    const data = result.data || [];

    res.status(200).json({
      success: true,
      data,
      total,
      page: result.metadata[0]?.page || 1,
      limit: result.metadata[0]?.limit || 10,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

/**
 * GET /leaveApplication/manager
 * Returns leave applications for the manager's division with pagination and filtering
 */
const getManagerLeaveApplications = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate({
      path: 'employee',
      populate: 'division',
    });

    if (!user?.employee?.division) {
      return res
        .status(404)
        .json({ success: false, message: 'Division not found' });
    }

    // Remove the division query parameter to avoid overriding the manager's division filter
    const { division, ...otherQueryParams } = req.query;
    const modifiedReq = { ...req, query: otherQueryParams };

    // Build the pipeline without division filter
    const pipeline = buildPipeline(modifiedReq);

    // Add filter based on the manager's division
    pipeline.push({
      $match: {
        'employee.division._id': user.employee.division._id,
      },
    });

    // Apply pagination and sorting
    const paginatedPipeline = applyPaginationAndSorting([...pipeline], req);

    // Execute the aggregation
    const [result = { metadata: [], data: [] }] =
      await LeaveApplication.aggregate(paginatedPipeline);
    const total = result.metadata[0]?.total || 0;
    const data = result.data || [];

    res.status(200).json({
      success: true,
      data,
      total,
      page: result.metadata[0]?.page || 1,
      limit: result.metadata[0]?.limit || 10,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

/**
 * GET /leaveApplication/admin
 * Returns all leave applications with advanced filtering and pagination
 */
const getAdminLeaveApplications = async (req, res) => {
  try {
    // Build the pipeline without any initial filters
    const pipeline = buildPipeline(req);

    // Apply pagination and sorting
    const paginatedPipeline = applyPaginationAndSorting([...pipeline], req);

    // Execute the aggregation
    const [result = { metadata: [], data: [] }] =
      await LeaveApplication.aggregate(paginatedPipeline);
    const total = result.metadata[0]?.total || 0;
    const data = result.data || [];

    res.status(200).json({
      success: true,
      data,
      total,
      page: result.metadata[0]?.page || 1,
      limit: result.metadata[0]?.limit || 10,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

/**
 * Centralized error handler for controllers
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 */
const handleControllerError = (res, error) => {
  console.error('Controller Error:', error);

  const errorMap = {
    'Invalid startDate': 400,
    'Invalid endDate': 400,
    'startDate must be': 400,
    'Invalid leave type': 400,
    'Invalid status': 400,
  };

  const statusCode = Object.keys(errorMap).find((e) =>
    error.message.includes(e)
  )
    ? errorMap[e]
    : 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Server error' : error.message,
  });
};

module.exports = {
  getUserLeaveApplications,
  getManagerLeaveApplications,
  getAdminLeaveApplications,
};
