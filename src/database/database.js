const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

let pool;

const initDatabase = async () => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');

    // Read and execute init.sql
    const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await pool.query(initSQL);
    logger.info('Database schema initialized');

    return pool;
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
};

module.exports = {
  initDatabase,
  getPool
};
