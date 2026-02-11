import app from './app.js';
import connectDB from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// ==================== CORS ALLOWED ORIGINS ====================
// ⚠️ IMPORTANT: URLs ke end me SLASH (/) MAT DALO
const allowedOrigins = [
  'https://symphonious-entremet-a55135.netlify.app', // <-- No slash at end
  'http://localhost:5173'
];

// Add from environment variables
if (process.env.CLIENT_URL) {
  // Remove trailing slash if present
  const cleanUrl = process.env.CLIENT_URL.replace(/\/$/, '');
  allowedOrigins.push(cleanUrl);
}

if (process.env.ADDITIONAL_ORIGINS) {
  process.env.ADDITIONAL_ORIGINS.split(',').forEach(origin => {
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    if (cleanOrigin) allowedOrigins.push(cleanOrigin);
  });
}

// ==================== CORS MIDDLEWARE ====================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests with no origin (like mobile apps, Postman, curl)
  if (!origin) {
    return next();
  }

  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  } else {
    // Log rejected origins for debugging
    console.warn(`🚫 CORS blocked origin: ${origin}`);
    console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`);
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ==================== DEBUG ENDPOINT (Remove in production) ====================
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug-cors', (req, res) => {
    res.json({
      origin: req.headers.origin,
      allowedOrigins,
      env: {
        client_url: process.env.CLIENT_URL,
        node_env: process.env.NODE_ENV
      }
    });
  });
}

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
  console.log(`📚 API Base:       http://localhost:${PORT}/api`);
  console.log(`❤️  Health:         http://localhost:${PORT}/health`);
  console.log(`\n🌐 CORS ALLOWED ORIGINS:`);
  allowedOrigins.forEach((origin, index) => {
    console.log(`   ${index + 1}. ${origin}`);
  });
  console.log('='.repeat(60) + '\n');
});

// ==================== ERROR HANDLERS ====================
process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:');
  console.error(`   Error: ${error.message}`);
  console.error(`   Stack: ${error.stack}`);
  
  if (isProduction) {
    console.log('\n🔄 Graceful shutdown initiated...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(1);
    });
    
    setTimeout(() => {
      console.error('❌ Force shutdown');
      process.exit(1);
    }, 5000);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED REJECTION:');
  console.error(`   Reason: ${reason}`);
  console.error(`   Promise: ${promise}`);
  
  if (isProduction) {
    console.log('\n🔄 Graceful shutdown initiated...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(1);
    });
    
    setTimeout(() => {
      console.error('❌ Force shutdown');
      process.exit(1);
    }, 5000);
  }
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export { app, server, allowedOrigins };