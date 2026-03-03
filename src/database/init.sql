-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    block_expires TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    language_code VARCHAR(10) DEFAULT 'en'
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_1 DECIMAL(10,2),
    price_2 DECIMAL(10,2),
    price_3 DECIMAL(10,2),
    price_4 DECIMAL(10,2),
    price_5 DECIMAL(10,2),
    price_custom DECIMAL(10,2),
    stock INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(category_id),
    code TEXT NOT NULL,
    is_sold BOOLEAN DEFAULT FALSE,
    order_id VARCHAR(50),
    sold_to BIGINT REFERENCES users(user_id),
    sold_at TIMESTAMP,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    category_id INT REFERENCES categories(category_id),
    quantity INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    utr_number VARCHAR(100),
    screenshot_file_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    admin_note TEXT,
    voucher_codes TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '2 hours',
    recovered BOOLEAN DEFAULT FALSE,
    recovery_expires TIMESTAMP
);

-- UTR tracking table (prevent reuse)
CREATE TABLE IF NOT EXISTS utr_tracking (
    utr_id SERIAL PRIMARY KEY,
    utr_number VARCHAR(100) UNIQUE NOT NULL,
    order_id VARCHAR(50) REFERENCES orders(order_id),
    user_id BIGINT REFERENCES users(user_id),
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_valid BOOLEAN DEFAULT TRUE
);

-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    discount_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    usage_limit INT,
    used_count INT DEFAULT 0,
    category_id INT REFERENCES categories(category_id),
    is_active BOOLEAN DEFAULT TRUE
);

-- Broadcast messages table
CREATE TABLE IF NOT EXISTS broadcasts (
    broadcast_id SERIAL PRIMARY KEY,
    message_text TEXT NOT NULL,
    photo_url TEXT,
    button_text VARCHAR(100),
    button_url TEXT,
    target_users TEXT DEFAULT 'all',
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    created_by BIGINT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Blocked UTRs table (fraud detection)
CREATE TABLE IF NOT EXISTS blocked_utrs (
    blocked_utr_id SERIAL PRIMARY KEY,
    utr_number VARCHAR(100) UNIQUE NOT NULL,
    reason TEXT,
    blocked_by BIGINT REFERENCES users(user_id),
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table for message tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    last_message_id INT,
    last_command VARCHAR(50),
    temp_data JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    message TEXT,
    reply_to_message_id INT,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_category ON vouchers(category_id, is_sold);
CREATE INDEX IF NOT EXISTS idx_users_blocked ON users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_utr_tracking_utr ON utr_tracking(utr_number);
CREATE INDEX IF NOT EXISTS idx_orders_utr ON orders(utr_number);

-- Insert default categories
INSERT INTO categories (name, price_1, price_2, price_3, price_4, price_5, stock) VALUES
('₹500', 149, 298, 447, 596, 745, 100),
('₹1000', 299, 598, 897, 1196, 1495, 100),
('₹2000', 699, 1398, 2097, 2796, 3495, 100),
('₹4000', 1999, 3998, 5997, 7996, 9995, 100)
ON CONFLICT DO NOTHING;

-- Set admin user
INSERT INTO users (user_id, username, is_admin, verified) 
VALUES (8004114088, 'admin', TRUE, TRUE)
ON CONFLICT (user_id) DO UPDATE SET is_admin = TRUE;
