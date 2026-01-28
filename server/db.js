const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// Load configuration
let config;
try {
  config = require('./config/env');
} catch (e) {
  // Fallback configuration for environments without config file
  config = {
    db: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'As120340560',
      database: process.env.DB_NAME || 'test'
    }
  };
  console.warn("Could not load env.js, using fallback config.");
}

// For Vercel serverless, use connection pool instead of single connection
let connection;

if (process.env.VERCEL) {
  // In Vercel, create a connection pool (lazy connection)
  const poolConfig = {
    host: config.db.host,
    port: config.db.port || 3306,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
  };

  // Only add SSL if DB_USE_SSL is set to 'true' (for Railway, PlanetScale, etc.)
  // InfinityFree doesn't require SSL
  if (process.env.DB_USE_SSL === 'true') {
    poolConfig.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    };
  }

  connection = mysql.createPool(poolConfig);

  console.log('Database pool created for Vercel environment');
  console.log('Connecting to:', config.db.host + ':' + (config.db.port || 3306));
} else {
  // Local development: use single connection
  connection = mysql.createConnection({
    host: config.db.host,
    port: config.db.port || 3306,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    charset: 'utf8mb4',
    connectTimeout: 30000,
    acquireTimeout: 30000,
    timeout: 30000
  });

  // Connect to database (only in local environment)
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
    } else {
      console.log('Successfully connected to the database.');
    }
  });
}

// Export the connection properly for both promise and callback usage
module.exports = connection;