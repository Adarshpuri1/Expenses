class ApiError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details
    };
  }
}

class ValidationError extends ApiError {
  constructor(message, details = null) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized access') {
    super('UNAUTHORIZED', message, 401);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403);
  }
}

class ConflictError extends ApiError {
  constructor(message, details = null) {
    super('CONFLICT', message, 409, details);
  }
}

class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super('RATE_LIMIT_EXCEEDED', message, 429);
  }
}

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_ENTRY',
      details: null
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid reference to related resource',
      code: 'INVALID_REFERENCE',
      details: null
    });
  }

  // Generic server error (don't leak internal details)
  return res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: null
  });
};

module.exports = {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  errorHandler
};
