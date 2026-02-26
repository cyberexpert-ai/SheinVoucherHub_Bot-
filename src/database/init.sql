CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_until DATETIME DEFAULT NULL,
    ban_reason VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE,
    stock INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prices (
    category_id INT,
    quantity INT,
    price INT,
    PRIMARY KEY (category_id, quantity),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    code VARCHAR(255) UNIQUE,
    is_used BOOLEAN DEFAULT FALSE,
    used_by BIGINT DEFAULT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(50) PRIMARY KEY,
    user_id BIGINT,
    category_id INT,
    quantity INT,
    total_price INT,
    utr VARCHAR(255) UNIQUE,
    status ENUM('pending', 'successful', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
