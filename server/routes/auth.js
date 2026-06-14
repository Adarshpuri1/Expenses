const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../utils/validation');
const { rateLimiter } = require('../middleware/rateLimiter');

// Rate limit for auth endpoints
const authLimiter = rateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 mins

router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.get('/me', authController.me);

module.exports = router;
