const { User, RefreshToken } = require('../models');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
} = require('../middleware/auth');
const { ApiError, ValidationError } = require('../utils/errors');
const config = require('../config');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError('DUPLICATE_EMAIL', 'Email already registered', 409);
    }

    const user = User.build({ name, email });
    await user.setPassword(password);
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(
      user,
      req.headers['user-agent'],
      req.ip
    );

    res.cookie('refreshToken', refreshToken, config.cookie);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ApiError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new ApiError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(
      user,
      req.headers['user-agent'],
      req.ip
    );

    res.cookie('refreshToken', refreshToken, config.cookie);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      throw new ApiError('NO_REFRESH_TOKEN', 'Refresh token required', 401);
    }

    const result = await verifyRefreshToken(refreshToken);
    if (!result) {
      throw new ApiError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', 401);
    }

    const { userId, token: storedToken } = result;
    const user = await User.findByPk(userId);

    if (!user) {
      await revokeRefreshToken(refreshToken);
      throw new ApiError('USER_NOT_FOUND', 'User not found', 401);
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(
      user,
      req.headers['user-agent'],
      req.ip
    );

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    res.cookie('refreshToken', newRefreshToken, config.cookie);

    res.json({
      message: 'Token refreshed',
      accessToken: newAccessToken
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.clearCookie('refreshToken');

    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    const userId = req.userId;

    await revokeAllUserTokens(userId);

    res.clearCookie('refreshToken');

    res.json({
      message: 'Logged out from all devices'
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'created_at']
    });

    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'User not found', 404);
    }

    res.json({
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me
};
