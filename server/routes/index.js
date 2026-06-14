const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const groupRoutes = require('./groups');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
    details: null
  });
});

module.exports = router;
