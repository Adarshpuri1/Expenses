module.exports = {
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-key-change-in-production',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-change-in-production',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d'
  },
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  rates: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  currency: {
    cacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
    defaultCurrency: 'INR'
  }
};
