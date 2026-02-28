const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        });
    }

    async query(sql, params) {
        try {
            const [results] = await this.pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async transaction(callback) {
        const connection = await this.pool.getConnection();
        await connection.beginTransaction();
        
        try {
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // User methods
    async getUser(telegramId) {
        const users = await this.query(
            'SELECT * FROM users WHERE telegram_id = ?',
            [telegramId]
        );
        return users[0];
    }

    async createOrUpdateUser(userData) {
        const { telegram_id, username, first_name, last_name } = userData;
        
        await this.query(
            `INSERT INTO users (telegram_id, username, first_name, last_name, last_active) 
             VALUES (?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE 
             username = VALUES(username),
             first_name = VALUES(first_name),
             last_name = VALUES(last_name),
             last_active = NOW()`,
            [telegram_id, username, first_name, last_name]
        );
        
        return this.getUser(telegram_id);
    }

    async blockUser(telegramId, reason, expiresIn = null) {
        let expiresAt = null;
        if (expiresIn) {
            expiresAt = new Date(Date.now() + expiresIn * 60000);
        }
        
        await this.query(
            'UPDATE users SET is_blocked = TRUE, block_reason = ?, block_expires = ? WHERE telegram_id = ?',
            [reason, expiresAt, telegramId]
        );
    }

    async unblockUser(telegramId) {
        await this.query(
            'UPDATE users SET is_blocked = FALSE, block_reason = NULL, block_expires = NULL WHERE telegram_id = ?',
            [telegramId]
        );
    }

    // Category methods
    async getCategories(activeOnly = true) {
        let sql = 'SELECT * FROM categories';
        if (activeOnly) {
            sql += ' WHERE is_active = TRUE';
        }
        sql += ' ORDER BY sort_order ASC, id ASC';
        
        return this.query(sql);
    }

    async getCategory(categoryId) {
        const categories = await this.query(
            'SELECT * FROM categories WHERE id = ?',
            [categoryId]
        );
        return categories[0];
    }

    async addCategory(name, value, displayName) {
        const result = await this.query(
            'INSERT INTO categories (name, value, display_name) VALUES (?, ?, ?)',
            [name, value, displayName]
        );
        return result.insertId;
    }

    async updateCategory(categoryId, data) {
        const updates = [];
        const values = [];
        
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }
        
        if (updates.length === 0) return;
        
        values.push(categoryId);
        await this.query(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
    }

    async deleteCategory(categoryId) {
        await this.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    }

    // Voucher methods
    async getVoucherCount(categoryId, used = false) {
        const results = await this.query(
            'SELECT COUNT(*) as count FROM vouchers WHERE category_id = ? AND is_used = ?',
            [categoryId, used]
        );
        return results[0].count;
    }

    async addVoucher(categoryId, code, addedBy) {
        await this.query(
            'INSERT INTO vouchers (category_id, code, added_by) VALUES (?, ?, ?)',
            [categoryId, code, addedBy]
        );
    }

    async addBulkVouchers(categoryId, codes, addedBy) {
        if (!codes.length) return;
        
        const values = codes.map(code => [categoryId, code, addedBy]);
        const placeholders = values.map(() => '(?, ?, ?)').join(',');
        const flattened = values.flat();
        
        await this.query(
            `INSERT INTO vouchers (category_id, code, added_by) VALUES ${placeholders}`,
            flattened
        );
    }

    async getAvailableVouchers(categoryId, limit) {
        return this.query(
            'SELECT id, code FROM vouchers WHERE category_id = ? AND is_used = FALSE ORDER BY id ASC LIMIT ?',
            [categoryId, limit]
        );
    }

    async markVoucherAsUsed(voucherId, userId, orderId) {
        await this.query(
            'UPDATE vouchers SET is_used = TRUE, used_by = ?, order_id = ?, used_at = NOW() WHERE id = ?',
            [userId, orderId, voucherId]
        );
    }

    // Price tier methods
    async getPriceTier(categoryId, quantity) {
        const prices = await this.query(
            'SELECT price FROM price_tiers WHERE category_id = ? AND quantity = ?',
            [categoryId, quantity]
        );
        return prices[0]?.price;
    }

    async updatePriceTier(categoryId, quantity, price) {
        await this.query(
            `INSERT INTO price_tiers (category_id, quantity, price) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE price = VALUES(price)`,
            [categoryId, quantity, price]
        );
    }

    // Order methods
    async createOrder(orderData) {
        const { order_id, user_id, category_id, quantity, total_price, utr_number, screenshot_id } = orderData;
        
        await this.query(
            `INSERT INTO orders (order_id, user_id, category_id, quantity, total_price, utr_number, screenshot_id, status, recovery_expires)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 2 HOUR))`,
            [order_id, user_id, category_id, quantity, total_price, utr_number, screenshot_id]
        );
        
        return order_id;
    }

    async getOrder(orderId) {
        const orders = await this.query(
            `SELECT o.*, c.name as category_name, c.value as category_value, u.username, u.first_name
             FROM orders o
             LEFT JOIN categories c ON o.category_id = c.id
             LEFT JOIN users u ON o.user_id = u.telegram_id
             WHERE o.order_id = ?`,
            [orderId]
        );
        return orders[0];
    }

    async getUserOrders(userId, limit = 10) {
        return this.query(
            `SELECT o.*, c.name as category_name, c.value as category_value,
                    GROUP_CONCAT(ov.voucher_code) as vouchers
             FROM orders o
             LEFT JOIN categories c ON o.category_id = c.id
             LEFT JOIN order_vouchers ov ON o.order_id = ov.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT ?`,
            [userId, limit]
        );
    }

    async updateOrderStatus(orderId, status, note = null) {
        let sql = 'UPDATE orders SET status = ?, updated_at = NOW()';
        const params = [status];
        
        if (status === 'completed') {
            sql += ', completed_at = NOW()';
        }
        
        if (note) {
            sql += ', admin_note = ?';
            params.push(note);
        }
        
        sql += ' WHERE order_id = ?';
        params.push(orderId);
        
        await this.query(sql, params);
    }

    async assignVouchersToOrder(orderId, vouchers) {
        const values = vouchers.map(v => [orderId, v.id, v.code]);
        const placeholders = values.map(() => '(?, ?, ?)').join(',');
        const flattened = values.flat();
        
        await this.query(
            `INSERT INTO order_vouchers (order_id, voucher_id, voucher_code) VALUES ${placeholders}`,
            flattened
        );
    }

    async checkUtrExists(utr) {
        const results = await this.query(
            'SELECT id FROM orders WHERE utr_number = ? UNION SELECT id FROM fraud_detection WHERE utr_number = ?',
            [utr, utr]
        );
        return results.length > 0;
    }

    // Stats methods
    async updateDailyStats() {
        const today = new Date().toISOString().split('T')[0];
        
        await this.query(
            `INSERT INTO stats (date, total_users, new_users, total_orders, completed_orders, total_revenue, blocked_users)
             SELECT 
                 ?,
                 (SELECT COUNT(*) FROM users),
                 (SELECT COUNT(*) FROM users WHERE DATE(joined_at) = ?),
                 (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = ?),
                 (SELECT COUNT(*) FROM orders WHERE DATE(completed_at) = ? AND status = 'completed'),
                 (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE DATE(completed_at) = ? AND status = 'completed'),
                 (SELECT COUNT(*) FROM users WHERE is_blocked = TRUE)
             ON DUPLICATE KEY UPDATE
                 total_users = VALUES(total_users),
                 new_users = VALUES(new_users),
                 total_orders = VALUES(total_orders),
                 completed_orders = VALUES(completed_orders),
                 total_revenue = VALUES(total_revenue),
                 blocked_users = VALUES(blocked_users)`,
            [today, today, today, today, today]
        );
    }
}

module.exports = new Database();
