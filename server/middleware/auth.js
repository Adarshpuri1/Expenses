const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, RefreshToken } = require('../models');
const { ApiError } = require('../utils/errors');

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.accessTokenSecret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );
};

const generateRefreshToken = async (user, userAgent, ipAddress) => {
  const token = jwt.sign(
    { userId: user.id },
    config.jwt.refreshTokenSecret,
    { expiresIn: config.jwt.refreshTokenExpiry }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const refreshToken = await RefreshToken.create({
    user_id: user.id,
    token,
    expires_at: expiresAt,
    user_agent: userAgent,
    ip_address: ipAddress
  });

  return token;
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.accessTokenSecret);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshTokenSecret);
    const storedToken = await RefreshToken.findOne({
      where: { token, revoked: false }
    });

    if (!storedToken || new Date() > storedToken.expires_at) {
      return null;
    }

    return { userId: decoded.userId, token: storedToken };
  } catch (error) {
    return null;
  }
};

const revokeRefreshToken = async (token) => {
  await RefreshToken.update(
    { revoked: true, revoked_at: new Date() },
    { where: { token } }
  );
};

const revokeAllUserTokens = async (userId) => {
  await RefreshToken.update(
    { revoked: true, revoked_at: new Date() },
    { where: { user_id: userId, revoked: false } }
  );
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('UNAUTHORIZED', 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw new ApiError('UNAUTHORIZED', 'Invalid or expired access token', 401);
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new ApiError('UNAUTHORIZED', 'User not found', 401);
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError('UNAUTHORIZED', 'Authentication failed', 401));
    }
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);

      if (decoded) {
        const user = await User.findByPk(decoded.userId);
        if (user) {
          req.user = user;
          req.userId = user.id;
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  authMiddleware,
  optionalAuth
};
