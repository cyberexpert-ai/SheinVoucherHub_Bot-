-- Create database
CREATE DATABASE IF NOT EXISTS if0_41202378_sheinvoucherhub_db;
USE if0_41202378_sheinvoucherhub_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME,
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    block_expires DATETIME,
    is_admin BOOLEAN DEFAULT FALSE,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    warning_count INT DEFAULT 0,
    INDEX idx_telegram (telegram_id),
    INDEX idx_blocked (is_blocked)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    display_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sort_order INT DEFAULT 0,
    INDEX idx_active (is_active)
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    code VARCHAR(255) UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by BIGINT,
    order_id VARCHAR(50),
    used_at DATETIME,
    added_by BIGINT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    notes TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_code (code),
    INDEX idx_used (is_used),
    INDEX idx_category (category_id)
);

-- Price tiers table
CREATE TABLE IF NOT EXISTS price_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    is_special BOOLEAN DEFAULT FALSE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_quantity (category_id, quantity),
    INDEX idx_category (category_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    category_id INT NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    utr_number VARCHAR(255),
    screenshot_id VARCHAR(255),
    status ENUM('pending', 'processing', 'completed', 'rejected', 'expired') DEFAULT 'pending',
    admin_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at DATETIME,
    recovery_expires DATETIME,
    INDEX idx_order_id (order_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_utr (utr_number),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

-- Order vouchers mapping
CREATE TABLE IF NOT EXISTS order_vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    voucher_id INT NOT NULL,
    voucher_code VARCHAR(255) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
    INDEX idx_order (order_id)
);

-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    category_id INT,
    min_quantity INT DEFAULT 1,
    max_uses INT,
    used_count INT DEFAULT 0,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
);

-- Broadcast messages table
CREATE TABLE IF NOT EXISTS broadcasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT,
    message_text TEXT,
    media_url VARCHAR(500),
    button_text VARCHAR(255),
    button_url VARCHAR(500),
    target ENUM('all', 'active', 'blocked', 'specific') DEFAULT 'all',
    target_user_id BIGINT,
    sent_count INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    created_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    scheduled_for DATETIME,
    is_sent BOOLEAN DEFAULT FALSE
);

-- User warnings table
CREATE TABLE IF NOT EXISTS user_warnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reason TEXT NOT NULL,
    warning_type ENUM('fake_utr', 'fake_recovery', 'abuse', 'spam', 'other') NOT NULL,
    created_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    INDEX idx_user (user_id)
);

-- Fraud detection table
CREATE TABLE IF NOT EXISTS fraud_detection (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utr_number VARCHAR(255) UNIQUE,
    order_id VARCHAR(50),
    user_id BIGINT,
    reason TEXT,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_utr (utr_number)
);

-- Statistics table
CREATE TABLE IF NOT EXISTS stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE UNIQUE,
    total_users INT DEFAULT 0,
    new_users INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    blocked_users INT DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, value, display_name, sort_order) VALUES
('₹500', 500, '₹500 Shein Voucher', 1),
('₹1000', 1000, '₹1000 Shein Voucher', 2),
('₹2000', 2000, '₹2000 Shein Voucher', 3),
('₹4000', 4000, '₹4000 Shein Voucher', 4);

-- Insert price tiers for ₹500
DELIMITER $$
CREATE PROCEDURE InsertPriceTiers()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE cat_id INT;
    
    -- Get category IDs
    SELECT id INTO cat_id FROM categories WHERE name = '₹500' LIMIT 1;
    SET i = 1;
    WHILE i <= 100 DO
        INSERT INTO price_tiers (category_id, quantity, price) 
        VALUES (cat_id, i, ROUND(49 * i * (1 - (i > 50) * 0.02 + (i > 80) * 0.01), 0));
        SET i = i + 1;
    END WHILE;
    
    SELECT id INTO cat_id FROM categories WHERE name = '₹1000' LIMIT 1;
    SET i = 1;
    WHILE i <= 100 DO
        INSERT INTO price_tiers (category_id, quantity, price) 
        VALUES (cat_id, i, ROUND(99 * i * (1 - (i > 50) * 0.02 + (i > 80) * 0.01), 0));
        SET i = i + 1;
    END WHILE;
    
    SELECT id INTO cat_id FROM categories WHERE name = '₹2000' LIMIT 1;
    SET i = 1;
    WHILE i <= 100 DO
        INSERT INTO price_tiers (category_id, quantity, price) 
        VALUES (cat_id, i, ROUND(199 * i * (1 - (i > 50) * 0.02 + (i > 80) * 0.01), 0));
        SET i = i + 1;
    END WHILE;
    
    SELECT id INTO cat_id FROM categories WHERE name = '₹4000' LIMIT 1;
    SET i = 1;
    WHILE i <= 100 DO
        INSERT INTO price_tiers (category_id, quantity, price) 
        VALUES (cat_id, i, ROUND(299 * i * (1 - (i > 50) * 0.02 + (i > 80) * 0.01), 0));
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL InsertPriceTiers();

-- Insert admin user
INSERT INTO users (telegram_id, username, first_name, is_admin) 
VALUES (8004114088, 'admin', 'Admin', TRUE)
ON DUPLICATE KEY UPDATE is_admin = TRUE;
