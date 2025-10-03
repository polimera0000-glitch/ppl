const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Trust proxy (for accurate IP addresses behind load balancers)
app.set('trust proxy', 1);

// Security middleware (helmet CSP)
const externalConnectSrc = [];

if (config.supabase && config.supabase.url) {
  externalConnectSrc.push(config.supabase.url);
} else if (config.storage && config.storage.publicUrl) {
  externalConnectSrc.push(config.storage.publicUrl);
}

const connectSrcList = ["'self'"].concat(externalConnectSrc);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: connectSrcList,
      },
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman, mobile apps

    if (
      config.security.corsOrigin.includes(origin) ||
      config.server.env === 'development'
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.window * 5 * 1000, // Convert minutes to ms
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: config.rateLimit.window,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/',
});

app.use(limiter);

// Request logging
if (config.server.env !== 'test') {
  const morganFormat =
    config.server.env === 'production' ? 'combined' : 'dev';
  app.use(
    morgan(morganFormat, {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Body parsing middleware
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1d',
    etag: true,
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
    version: config.server.apiVersion,
    uptime: process.uptime(),
  });
});

// API routes
app.use(`/api/${config.server.apiVersion}`, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'EPH Platform Backend API',
    version: config.server.apiVersion,
    environment: config.server.env,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: `/api/${config.server.apiVersion}`,
      docs: `/api/${config.server.apiVersion}/docs`, // Future API docs
    },
  });
});

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    availableEndpoints: {
      health: '/health',
      api: `/api/${config.server.apiVersion}`,
    },
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
