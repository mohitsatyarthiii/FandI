import dotenv from 'dotenv';

dotenv.config();

const jwtConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your_fallback_secret_key_change_in_production',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  
  // Cookie settings for production
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Validate JWT secret
if (!jwtConfig.jwtSecret || jwtConfig.jwtSecret === 'your_fallback_secret_key_change_in_production') {
  console.warn('⚠️  WARNING: Using default JWT secret. Change JWT_SECRET in .env for production!');
}

export { jwtConfig };