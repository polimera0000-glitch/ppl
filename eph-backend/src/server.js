const app = require('./app');
const config = require('./config');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

const PORT = config.server.port;

// Test database connection
async function testDbConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

// Sync database models (only in development)
async function syncDatabase() {
  try {
    if (config.server.env === 'development') {
      // Use migrations in production instead of sync
      // await sequelize.sync({ alter: true });
      logger.info('Database models synchronized (development mode)');
    }
  } catch (error) {
    logger.error('Error synchronizing database models:', error);
    process.exit(1);
  }
}

// Check if initial admin exists, create one if not
async function ensureInitialAdmin() {
  try {
    const { User } = require('./models');
    
    // Check if any admin exists
    const adminExists = await User.findOne({ where: { role: 'admin', is_active: true } });
    
    if (!adminExists) {
      logger.warn('No active admin found. Creating initial admin...');
      
      // Create initial admin account
      const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL || '';
      const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || '';
      const initialAdminName = process.env.INITIAL_ADMIN_NAME || '';
      
      await User.create({
        name: initialAdminName,
        email: initialAdminEmail,
        password_hash: initialAdminPassword, // Will be hashed by model hook
        role: 'admin',
        is_active: true,
        verified: true,
        force_password_change: true // Force password change on first login
      });
      
      logger.info(`Initial admin created: ${initialAdminEmail}`);
      logger.warn(`SECURITY WARNING: Change the admin password immediately after first login!`);
      logger.info(`Default admin credentials: ${initialAdminEmail} / ${initialAdminPassword}`);
    }
  } catch (error) {
    logger.error('Error ensuring initial admin:', error);
    // Don't exit - this is not critical for server startup
  }
}

// Start server
async function startServer() {
  try {
    await testDbConnection();
    await syncDatabase();
    
    // Ensure initial admin exists (only in development or if specified)
    if (config.server.env === 'development' || process.env.CREATE_INITIAL_ADMIN === 'true') {
      await ensureInitialAdmin();
    }
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 PPL Backend Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${config.server.env}`);
      logger.info(`📱 API Version: ${config.server.apiVersion}`);
      
      if (config.server.env === 'development') {
        logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/${config.server.apiVersion}`);
        logger.info(`📚 Health Check: http://localhost:${PORT}/health`);
        logger.info(`🔐 Admin Panel: Access via /api/${config.server.apiVersion}/admin routes`);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`\n🛑 ${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await sequelize.close();
          logger.info('Database connection closed');
          
          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();