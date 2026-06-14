require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');

const { testConnection, sequelize } = require('./config/database');
const routes = require('./routes');
const { errorHandler } = require('./utils/errors');
const { apiLimiter } = require('./middleware/rateLimiter');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'Apikey']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api', routes);

// Static files (if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    await testConnection();

    // Sync models (create tables if they don't exist)
    const syncOptions = process.env.NODE_ENV === 'development'
      ? { alter: true }
      : {};

    await sequelize.sync(syncOptions);
    console.log('Database models synchronized');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

module.exports = { app, startServer };

// Start server if this is the entry point
if (require.main === module) {
  startServer();
}
