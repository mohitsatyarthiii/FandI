import app from './app.js';
import connectDB from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// ==================== CORS ALLOWED ORIGINS ====================
const allowedOrigins = [
  'https://symphonious-entremet-a55135.netlify.app',  // <-- Netlify frontend
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://fandi.onrender.com'  // <-- Self URL bhi add karo
];

// Add from env if exists
if (process.env.CLIENT_URL) {
  const cleanUrl = process.env.CLIENT_URL.replace(/\/$/, '');
  if (!allowedOrigins.includes(cleanUrl)) {
    allowedOrigins.push(cleanUrl);
  }
}

if (process.env.ADDITIONAL_ORIGINS) {
  process.env.ADDITIONAL_ORIGINS.split(',').forEach(origin => {
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    if (cleanOrigin && !allowedOrigins.includes(cleanOrigin)) {
      allowedOrigins.push(cleanOrigin);
    }
  });
}

// ==================== CORS MIDDLEWARE ====================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // 🔥 IMPORTANT: Preflight request ke liye ALWAYS headers bhejo
  if (req.method === 'OPTIONS') {
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://symphonious-entremet-a55135.netlify.app');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  // Normal requests
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // Default fallback for Netlify
      res.setHeader('Access-Control-Allow-Origin', 'https://symphonious-entremet-a55135.netlify.app');
      console.warn(`⚠️ Origin not in allowed list: ${origin}`);
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  next();
});

// ==================== ENVIRONMENT CHECK ====================
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    if (isProduction) process.exit(1);
  }
});

// ==================== DATABASE CONNECTION ====================
connectDB();

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 SERVER STARTED SUCCESSFULLY`);
  console.log('='.repeat(60));
  console.log(`📡 Environment:    ${NODE_ENV}`);
  console.log(`🔌 Port:           ${PORT}`);
  console.log(`🌍 Host:           0.0.0.0`);
  console.log(`\n🌐 CORS ALLOWED ORIGINS:`);
  allowedOrigins.forEach((origin, index) => {
    console.log(`   ${index + 1}. ${origin}`);
  });
  console.log('='.repeat(60) + '\n');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    cors: {
      allowedOrigins,
      currentOrigin: req.headers.origin || 'none'
    }
  });
});

// ==================== ERROR HANDLERS ====================
process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:', error.message);
  if (isProduction) {
    server.close(() => process.exit(1));
    setTimeout(() => process.exit(1), 5000);
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('\n❌ UNHANDLED REJECTION:', reason);
  if (isProduction) {
    server.close(() => process.exit(1));
    setTimeout(() => process.exit(1), 5000);
  }
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, closing server...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, closing server...');
  server.close(() => process.exit(0));
});

export { app, server, allowedOrigins };