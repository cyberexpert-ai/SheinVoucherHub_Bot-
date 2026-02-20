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
    block_until DATETIME,
    is_verified BOOLEAN DEFAULT FALSE,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    INDEX(telegram_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    stock INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);

-- Price tiers table
CREATE TABLE IF NOT EXISTS price_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_quantity (category_id, quantity)
);

-- Voucher codes table
CREATE TABLE IF NOT EXISTS voucher_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    code VARCHAR(255) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    order_id VARCHAR(50),
    used_by BIGINT,
    used_at DATETIME,
    added_by BIGINT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX(code),
    INDEX(is_used)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    category_id INT,
    category_name VARCHAR(100),
    quantity INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    utr_number VARCHAR(255),
    screenshot_id VARCHAR(255),
    status ENUM('pending', 'success', 'rejected', 'expired') DEFAULT 'pending',
    admin_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    delivered_at DATETIME,
    expires_at DATETIME,
    recovery_attempts INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX(user_id),
    INDEX(order_id),
    INDEX(status),
    INDEX(utr_number)
);

-- Order codes mapping
CREATE TABLE IF NOT EXISTS order_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50),
    code_id INT,
    code_text VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (code_id) REFERENCES voucher_codes(id)
);

-- Blocked UTRs table
CREATE TABLE IF NOT EXISTS blocked_utrs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utr_number VARCHAR(255) UNIQUE NOT NULL,
    blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    blocked_by BIGINT,
    reason TEXT
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    message TEXT,
    file_id VARCHAR(255),
    status ENUM('open', 'replied', 'closed') DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    admin_reply TEXT,
    replied_by BIGINT,
    INDEX(user_id),
    INDEX(status)
);

-- Broadcast messages table
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT,
    message_text TEXT,
    file_id VARCHAR(255),
    button_text VARCHAR(255),
    button_url VARCHAR(500),
    target ENUM('all', 'active', 'blocked') DEFAULT 'all',
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    created_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, display_name, stock) VALUES
('500', '₹500 Shein Voucher', 0),
('1000', '₹1000 Shein Voucher', 6),
('2000', '₹2000 Shein Voucher', 0),
('4000', '₹4000 Shein Voucher', 0)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- Insert price tiers for ₹500
INSERT INTO price_tiers (category_id, quantity, price) VALUES
(1, 1, 49), (1, 2, 98), (1, 3, 147), (1, 4, 196), (1, 5, 249),
(1, 6, 298), (1, 7, 347), (1, 8, 396), (1, 9, 445), (1, 10, 498),
(1, 11, 547), (1, 12, 596), (1, 13, 645), (1, 14, 694), (1, 15, 747),
(1, 16, 796), (1, 17, 845), (1, 18, 894), (1, 19, 943), (1, 20, 996)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- Insert price tiers for ₹1000
INSERT INTO price_tiers (category_id, quantity, price) VALUES
(2, 1, 99), (2, 2, 198), (2, 3, 297), (2, 4, 396), (2, 5, 499),
(2, 6, 598), (2, 7, 697), (2, 8, 796), (2, 9, 895), (2, 10, 998),
(2, 11, 1097), (2, 12, 1196), (2, 13, 1295), (2, 14, 1394), (2, 15, 1497),
(2, 16, 1596), (2, 17, 1695), (2, 18, 1794), (2, 19, 1893), (2, 20, 1996)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- Insert price tiers for ₹2000
INSERT INTO price_tiers (category_id, quantity, price) VALUES
(3, 1, 199), (3, 2, 398), (3, 3, 597), (3, 4, 796), (3, 5, 999),
(3, 6, 1198), (3, 7, 1397), (3, 8, 1596), (3, 9, 1795), (3, 10, 1998),
(3, 11, 2197), (3, 12, 2396), (3, 13, 2595), (3, 14, 2794), (3, 15, 2997),
(3, 16, 3196), (3, 17, 3395), (3, 18, 3594), (3, 19, 3793), (3, 20, 3996)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- Insert price tiers for ₹4000
INSERT INTO price_tiers (category_id, quantity, price) VALUES
(4, 1, 299), (4, 2, 598), (4, 3, 897), (4, 4, 1196), (4, 5, 1499),
(4, 6, 1798), (4, 7, 2097), (4, 8, 2396), (4, 9, 2695), (4, 10, 2998),
(4, 11, 3297), (4, 12, 3596), (4, 13, 3895), (4, 14, 4194), (4, 15, 4497),
(4, 16, 4796), (4, 17, 5095), (4, 18, 5394), (4, 19, 5693), (4, 20, 5996)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- Insert settings
INSERT INTO settings (setting_key, setting_value) VALUES
('recovery_hours', '2'),
('min_recovery_minutes', '10'),
('max_recovery_minutes', '30'),
('welcome_message', '🎯 Welcome to Shein Voucher Hub S!\n\n🚀 Get exclusive Shein vouchers at the best prices!\n\n📌 Choose an option below:')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
