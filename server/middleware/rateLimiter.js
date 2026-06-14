const rateLimit = require('express-rate-limit');

const rateLimiter = (windowMs, max, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
      details: null
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const apiLimiter = rateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 mins
const authLimiter = rateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 mins
const importLimiter = rateLimiter(60 * 60 * 1000, 5); // 5 imports per hour

module.exports = {
  rateLimiter,
  apiLimiter,
  authLimiter,
  importLimiter
};
