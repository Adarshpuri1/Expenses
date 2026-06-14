const { validationResult, body, param, query } = require('express-validator');
const { ValidationError } = require('../utils/errors');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));
    throw new ValidationError('Validation failed', details);
  }
  next();
};

const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateGroupCreate = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Group name must be between 2 and 255 characters'),
  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array'),
  body('members.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Member IDs must be positive integers'),
  handleValidationErrors
];

const validateGroupUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Group name must be between 2 and 255 characters'),
  handleValidationErrors
];

const validateExpense = [
  param('groupId')
    .isInt({ min: 1 })
    .withMessage('Valid group ID is required'),
  body('paid_by')
    .isInt({ min: 1 })
    .withMessage('Payer ID is required'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('amount')
    .isInt({ min: 0 })
    .withMessage('Amount must be a non-negative integer (in paise)'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .isUppercase()
    .withMessage('Currency must be 3 uppercase letters'),
  body('split_type')
    .optional()
    .isIn(['equal', 'exact', 'percentage', 'shares'])
    .withMessage('Invalid split type'),
  body('date')
    .optional()
    .isDate()
    .withMessage('Invalid date format'),
  body('splits')
    .optional()
    .isArray()
    .withMessage('Splits must be an array'),
  handleValidationErrors
];

const validateSettlement = [
  param('groupId')
    .isInt({ min: 1 })
    .withMessage('Valid group ID is required'),
  body('paid_to')
    .isInt({ min: 1 })
    .withMessage('Payee ID is required'),
  body('amount')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer (in paise)'),
  body('date')
    .optional()
    .isDate()
    .withMessage('Invalid date format'),
  handleValidationErrors
];

const validateMemberQuery = [
  param('groupId')
    .isInt({ min: 1 })
    .withMessage('Valid group ID is required'),
  query('at')
    .optional()
    .isDate()
    .withMessage('Invalid date format'),
  handleValidationErrors
];

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
};

const sanitizeMiddleware = (req, res, next) => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
};

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateGroupCreate,
  validateGroupUpdate,
  validateExpense,
  validateSettlement,
  validateMemberQuery,
  sanitizeInput,
  sanitizeMiddleware
};
