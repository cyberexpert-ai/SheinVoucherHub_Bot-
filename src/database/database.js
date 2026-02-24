const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        
        // Create tables
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id BIGINT PRIMARY KEY,
                username VARCHAR(255),
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                is_blocked BOOLEAN DEFAULT FALSE,
                block_reason TEXT,
                block_until DATETIME NULL,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_active DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE,
                display_name VARCHAR(255),
                stock INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS prices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category_name VARCHAR(100),
                quantity INT,
                price INT,
                UNIQUE KEY unique_category_quantity (category_name, quantity),
                FOREIGN KEY (category_name) REFERENCES categories(name) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS vouchers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(255) UNIQUE,
                category_name VARCHAR(100),
                is_used BOOLEAN DEFAULT FALSE,
                used_by BIGINT NULL,
                used_at DATETIME NULL,
                order_id VARCHAR(50) NULL,
                added_by BIGINT,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_name) REFERENCES categories(name) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                order_id VARCHAR(50) PRIMARY KEY,
                user_id BIGINT,
                category_name VARCHAR(100),
                quantity INT,
                total_price INT,
                utr_number VARCHAR(255) UNIQUE,
                screenshot_file_id VARCHAR(255),
                status ENUM('pending', 'success', 'rejected', 'expired') DEFAULT 'pending',
                voucher_codes TEXT,
                admin_note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                expires_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(user_id),
                FOREIGN KEY (category_name) REFERENCES categories(name)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS discounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) UNIQUE,
                category_name VARCHAR(100),
                quantity INT,
                discount_type ENUM('percentage', 'fixed') DEFAULT 'fixed',
                discount_value INT,
                valid_from DATETIME,
                valid_until DATETIME,
                max_uses INT DEFAULT 1,
                used_count INT DEFAULT 0,
                created_by BIGINT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS used_utr (
                utr_number VARCHAR(255) PRIMARY KEY,
                user_id BIGINT,
                order_id VARCHAR(50),
                used_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT,
                message TEXT,
                admin_reply TEXT,
                status ENUM('open', 'closed') DEFAULT 'open',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS temp_block (
                user_id BIGINT PRIMARY KEY,
                reason VARCHAR(255),
                blocked_until DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        `);

        // Insert default categories if not exists
        const defaultCategories = ['500', '1000', '2000', '4000'];
        for (const cat of defaultCategories) {
            await connection.query(
                'INSERT IGNORE INTO categories (name, display_name, stock) VALUES (?, ?, ?)',
                [cat, `₹${cat} Voucher`, 0]
            );
        }

        // Insert default prices
        await insertDefaultPrices(connection);

        connection.release();
        console.log("✅ Database tables created/verified");
    } catch (error) {
        console.error("❌ Database initialization error:", error);
    }
}

async function insertDefaultPrices(connection) {
    // Price tables for different categories
    const priceTables = {
        '500': generatePriceTable(500, 49, 5, 249, 100, 4980),
        '1000': generatePriceTable(1000, 99, 5, 499, 100, 9980),
        '2000': generatePriceTable(2000, 199, 5, 999, 100, 19980),
        '4000': generatePriceTable(4000, 299, 5, 1499, 100, 29980)
    };

    for (const [category, prices] of Object.entries(priceTables)) {
        for (const [qty, price] of Object.entries(prices)) {
            await connection.query(
                'INSERT IGNORE INTO prices (category_name, quantity, price) VALUES (?, ?, ?)',
                [category, parseInt(qty), price]
            );
        }
    }
}

function generatePriceTable(category, price1, price5, price5Value, maxQty, maxPrice) {
    const prices = {};
    
    // Generate prices for all quantities
    for (let qty = 1; qty <= maxQty; qty++) {
        if (qty === 1) {
            prices[qty] = price1;
        } else if (qty === 5) {
            prices[qty] = price5Value;
        } else {
            // Calculate based on pattern
            let basePrice;
            if (category === 500) {
                basePrice = qty <= 5 ? qty * price1 : Math.floor(qty * price1 * 0.95);
            } else if (category === 1000) {
                basePrice = qty <= 5 ? qty * price1 : Math.floor(qty * price1 * 0.95);
            } else if (category === 2000) {
                basePrice = qty <= 5 ? qty * price1 : Math.floor(qty * price1 * 0.95);
            } else {
                basePrice = qty <= 5 ? qty * price1 : Math.floor(qty * price1 * 0.95);
            }
            
            // Round to nearest number ending with 9, 99, or 999
            prices[qty] = roundToPattern(basePrice);
        }
    }
    
    return prices;
}

function roundToPattern(price) {
    if (price < 100) {
        // Make it end with 9 (e.g., 49, 59, 69)
        return Math.floor(price / 10) * 10 + 9;
    } else if (price < 1000) {
        // Make it end with 99 (e.g., 199, 299, 399)
        return Math.floor(price / 100) * 100 + 99;
    } else {
        // Make it end with 999 (e.g., 1999, 2999)
        return Math.floor(price / 1000) * 1000 + 999;
    }
}

async function query(sql, params) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
}

module.exports = {
    pool,
    query,
    initDatabase
};
