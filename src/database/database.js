const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        user_id BIGINT PRIMARY KEY,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        block_reason TEXT,
        block_expiry TIMESTAMP,
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        verified BOOLEAN DEFAULT FALSE,
        language VARCHAR(10) DEFAULT 'en'
      );

      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Price tiers table
      CREATE TABLE IF NOT EXISTS price_tiers (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        UNIQUE(category_id, quantity)
      );

      -- Vouchers table
      CREATE TABLE IF NOT EXISTS vouchers (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'available',
        order_id VARCHAR(50),
        purchased_by BIGINT REFERENCES users(user_id),
        purchased_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(code)
      );

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) UNIQUE NOT NULL,
        user_id BIGINT REFERENCES users(user_id),
        category_id INTEGER REFERENCES categories(id),
        quantity INTEGER NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        utr_number VARCHAR(255),
        screenshot_file_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        admin_notes TEXT,
        recovery_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Order vouchers mapping
      CREATE TABLE IF NOT EXISTS order_vouchers (
        order_id VARCHAR(50) REFERENCES orders(order_id) ON DELETE CASCADE,
        voucher_id INTEGER REFERENCES vouchers(id) ON DELETE CASCADE,
        PRIMARY KEY (order_id, voucher_id)
      );

      -- Discounts table
      CREATE TABLE IF NOT EXISTS discounts (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        value DECIMAL(10,2),
        category_id INTEGER REFERENCES categories(id),
        min_quantity INTEGER DEFAULT 1,
        max_quantity INTEGER,
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Broadcast messages table
      CREATE TABLE IF NOT EXISTS broadcasts (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        photo VARCHAR(255),
        buttons JSONB,
        target_type VARCHAR(50),
        target_value TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        sent_count INTEGER DEFAULT 0,
        total_count INTEGER,
        created_by BIGINT REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scheduled_for TIMESTAMP
      );

      -- Support tickets table
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        ticket_id VARCHAR(50) UNIQUE NOT NULL,
        user_id BIGINT REFERENCES users(user_id),
        message TEXT,
        photo VARCHAR(255),
        status VARCHAR(50) DEFAULT 'open',
        admin_response TEXT,
        resolved_by BIGINT REFERENCES users(user_id),
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Blocked UTRs table (anti-fraud)
      CREATE TABLE IF NOT EXISTS blocked_utrs (
        id SERIAL PRIMARY KEY,
        utr_number VARCHAR(255) UNIQUE NOT NULL,
        reason TEXT,
        blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        blocked_by BIGINT REFERENCES users(user_id)
      );

      -- Used Order IDs table
      CREATE TABLE IF NOT EXISTS used_order_ids (
        order_id VARCHAR(50) PRIMARY KEY,
        user_id BIGINT REFERENCES users(user_id),
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Activity logs table
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(user_id),
        action VARCHAR(255),
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_utr ON orders(utr_number);
      CREATE INDEX IF NOT EXISTS idx_support_user_id ON support_tickets(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);

      -- Insert default categories with price tiers
      INSERT INTO categories (name, value, description) VALUES
        ('₹500', 500, '500 Rupee Voucher Category'),
        ('₹1000', 1000, '1000 Rupee Voucher Category'),
        ('₹2000', 2000, '2000 Rupee Voucher Category'),
        ('₹4000', 4000, '4000 Rupee Voucher Category')
      ON CONFLICT (id) DO NOTHING;

      -- Insert price tiers for each category
      -- This will be handled by a separate function to insert all 100 quantities
      DO $$
      DECLARE
        cat_record RECORD;
        qty INTEGER;
      BEGIN
        FOR cat_record IN SELECT id, value FROM categories LOOP
          FOR qty IN 1..100 LOOP
            INSERT INTO price_tiers (category_id, quantity, price)
            VALUES (
              cat_record.id, 
              qty,
              CASE 
                WHEN cat_record.value = 500 THEN 
                  CASE 
                    WHEN qty <= 5 THEN qty * 49
                    WHEN qty <= 10 THEN qty * 49.8
                    WHEN qty <= 20 THEN qty * 49.5
                    WHEN qty <= 30 THEN qty * 49.3
                    WHEN qty <= 50 THEN qty * 49.2
                    ELSE qty * 49
                  END
                WHEN cat_record.value = 1000 THEN 
                  CASE 
                    WHEN qty <= 5 THEN qty * 99
                    WHEN qty <= 10 THEN qty * 99.8
                    WHEN qty <= 20 THEN qty * 99.5
                    WHEN qty <= 30 THEN qty * 99.3
                    WHEN qty <= 50 THEN qty * 99.2
                    ELSE qty * 99
                  END
                WHEN cat_record.value = 2000 THEN 
                  CASE 
                    WHEN qty <= 5 THEN qty * 199
                    WHEN qty <= 10 THEN qty * 199.8
                    WHEN qty <= 20 THEN qty * 199.5
                    WHEN qty <= 30 THEN qty * 199.3
                    WHEN qty <= 50 THEN qty * 199.2
                    ELSE qty * 199
                  END
                WHEN cat_record.value = 4000 THEN 
                  CASE 
                    WHEN qty <= 5 THEN qty * 299
                    WHEN qty <= 10 THEN qty * 299.8
                    WHEN qty <= 20 THEN qty * 299.5
                    WHEN qty <= 30 THEN qty * 299.3
                    WHEN qty <= 50 THEN qty * 299.2
                    ELSE qty * 299
                  END
              END
            )
            ON CONFLICT (category_id, quantity) DO NOTHING;
          END LOOP;
        END LOOP;
      END $$;
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };
