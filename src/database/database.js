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

    async getUser(telegramId) {
        const users = await this.query(
            'SELECT * FROM users WHERE telegram_id = ?',
            [telegramId]
        );
        return users[0];
    }

    async createUser(telegramId, username, firstName, lastName) {
        await this.query(
            `INSERT INTO users (telegram_id, username, first_name, last_name, joined_at, last_active) 
             VALUES (?, ?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE 
             username = VALUES(username),
             first_name = VALUES(first_name),
             last_name = VALUES(last_name),
             last_active = NOW()`,
            [telegramId, username, firstName, lastName]
        );
        return this.getUser(telegramId);
    }

    async updateUserActivity(telegramId) {
        await this.query(
            'UPDATE users SET last_active = NOW() WHERE telegram_id = ?',
            [telegramId]
        );
    }

    async isUserBlocked(telegramId) {
        const user = await this.getUser(telegramId);
        if (!user) return false;
        
        if (user.is_blocked) {
            if (user.block_until && new Date(user.block_until) > new Date()) {
                return true;
            } else if (user.block_until && new Date(user.block_until) <= new Date()) {
                await this.unblockUser(telegramId);
                return false;
            }
            return user.is_blocked;
        }
        return false;
    }

    async blockUser(telegramId, reason, minutes = null) {
        let blockUntil = null;
        if (minutes) {
            blockUntil = new Date(Date.now() + minutes * 60000);
        }
        
        await this.query(
            `UPDATE users SET 
             is_blocked = TRUE, 
             block_reason = ?,
             block_until = ? 
             WHERE telegram_id = ?`,
            [reason, blockUntil, telegramId]
        );
    }

    async unblockUser(telegramId) {
        await this.query(
            `UPDATE users SET 
             is_blocked = FALSE, 
             block_reason = NULL,
             block_until = NULL 
             WHERE telegram_id = ?`,
            [telegramId]
        );
    }

    async getCategories() {
        return this.query(
            'SELECT * FROM categories WHERE is_active = TRUE ORDER BY CAST(name AS UNSIGNED)'
        );
    }

    async getCategory(id) {
        const categories = await this.query(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );
        return categories[0];
    }

    async addCategory(name, displayName) {
        const result = await this.query(
            'INSERT INTO categories (name, display_name) VALUES (?, ?)',
            [name, displayName]
        );
        return result.insertId;
    }

    async updateCategory(id, data) {
        const updates = [];
        const values = [];
        
        for (const [key, value] of Object.entries(data)) {
            updates.push(`${key} = ?`);
            values.push(value);
        }
        values.push(id);
        
        await this.query(
            `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
    }

    async deleteCategory(id) {
        await this.query('UPDATE categories SET is_active = FALSE WHERE id = ?', [id]);
    }

    async getPriceTier(categoryId, quantity) {
        const tiers = await this.query(
            'SELECT * FROM price_tiers WHERE category_id = ? AND quantity = ?',
            [categoryId, quantity]
        );
        return tiers[0];
    }

    async getPriceTiers(categoryId) {
        return this.query(
            'SELECT * FROM price_tiers WHERE category_id = ? ORDER BY quantity',
            [categoryId]
        );
    }

    async updatePriceTier(categoryId, quantity, price) {
        await this.query(
            `INSERT INTO price_tiers (category_id, quantity, price) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE price = VALUES(price)`,
            [categoryId, quantity, price]
        );
    }

    async deletePriceTier(categoryId, quantity) {
        await this.query(
            'DELETE FROM price_tiers WHERE category_id = ? AND quantity = ?',
            [categoryId, quantity]
        );
    }

    async getVoucherCodes(categoryId, limit = null) {
        let query = 'SELECT * FROM voucher_codes WHERE category_id = ? AND is_used = FALSE';
        const params = [categoryId];
        
        if (limit) {
            query += ' LIMIT ?';
            params.push(limit);
        }
        
        return this.query(query, params);
    }

    async getAvailableStock(categoryId) {
        const result = await this.query(
            'SELECT COUNT(*) as stock FROM voucher_codes WHERE category_id = ? AND is_used = FALSE',
            [categoryId]
        );
        return result[0].stock;
    }

    async addVoucherCode(categoryId, code, addedBy) {
        await this.query(
            'INSERT INTO voucher_codes (category_id, code, added_by) VALUES (?, ?, ?)',
            [categoryId, code, addedBy]
        );
        
        // Update category stock count
        await this.updateCategoryStock(categoryId);
    }

    async addBulkVoucherCodes(categoryId, codes, addedBy) {
        const values = codes.map(code => [categoryId, code, addedBy]);
        await this.query(
            'INSERT INTO voucher_codes (category_id, code, added_by) VALUES ?',
            [values]
        );
        
        // Update category stock count
        await this.updateCategoryStock(categoryId);
    }

    async updateCategoryStock(categoryId) {
        const stock = await this.getAvailableStock(categoryId);
        await this.query(
            'UPDATE categories SET stock = ? WHERE id = ?',
            [stock, categoryId]
        );
        return stock;
    }

    async createOrder(userId, categoryId, categoryName, quantity, totalPrice, utr, screenshotId) {
        const orderId = this.generateOrderId();
        
        // Check if UTR is blocked
        const blocked = await this.query(
            'SELECT * FROM blocked_utrs WHERE utr_number = ?',
            [utr]
        );
        
        if (blocked.length > 0) {
            throw new Error('UTR_BLOCKED');
        }
        
        // Set expiry time (2 hours from now)
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        
        const result = await this.query(
            `INSERT INTO orders 
             (order_id, user_id, category_id, category_name, quantity, total_price, utr_number, screenshot_id, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderId, userId, categoryId, categoryName, quantity, totalPrice, utr, screenshotId, expiresAt]
        );
        
        return orderId;
    }

    generateOrderId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `SVH-${timestamp}-${random}`;
    }

    async getOrder(orderId) {
        const orders = await this.query(
            'SELECT * FROM orders WHERE order_id = ?',
            [orderId]
        );
        return orders[0];
    }

    async getUserOrders(userId, limit = 10) {
        return this.query(
            `SELECT * FROM orders 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [userId, limit]
        );
    }

    async updateOrderStatus(orderId, status, adminNote = null) {
        await this.query(
            `UPDATE orders SET 
             status = ?, 
             admin_note = ?,
             updated_at = NOW() 
             WHERE order_id = ?`,
            [status, adminNote, orderId]
        );
    }

    async deliverOrder(orderId, adminId) {
        const order = await this.getOrder(orderId);
        if (!order) return false;
        
        // Get available codes
        const codes = await this.getVoucherCodes(order.category_id, order.quantity);
        
        if (codes.length < order.quantity) {
            return false;
        }
        
        // Mark codes as used and assign to order
        for (let i = 0; i < codes.length; i++) {
            const code = codes[i];
            await this.query(
                `UPDATE voucher_codes SET 
                 is_used = TRUE, 
                 order_id = ?,
                 used_by = ?,
                 used_at = NOW() 
                 WHERE id = ?`,
                [orderId, order.user_id, code.id]
            );
            
            // Save to order_codes
            await this.query(
                'INSERT INTO order_codes (order_id, code_id, code_text) VALUES (?, ?, ?)',
                [orderId, code.id, code.code]
            );
        }
        
        // Update order status
        await this.query(
            `UPDATE orders SET 
             status = 'success', 
             delivered_at = NOW(),
             updated_at = NOW() 
             WHERE order_id = ?`,
            [orderId]
        );
        
        // Update user stats
        await this.query(
            `UPDATE users SET 
             total_orders = total_orders + 1,
             total_spent = total_spent + ? 
             WHERE telegram_id = ?`,
            [order.total_price, order.user_id]
        );
        
        // Update category stock
        await this.updateCategoryStock(order.category_id);
        
        return codes.map(c => c.code);
    }

    async getDeliveredCodes(orderId) {
        const codes = await this.query(
            'SELECT code_text FROM order_codes WHERE order_id = ?',
            [orderId]
        );
        return codes.map(c => c.code_text);
    }

    async blockUTR(utr, reason, blockedBy) {
        await this.query(
            'INSERT INTO blocked_utrs (utr_number, reason, blocked_by) VALUES (?, ?, ?)',
            [utr, reason, blockedBy]
        );
    }

    async isUTRBlocked(utr) {
        const result = await this.query(
            'SELECT * FROM blocked_utrs WHERE utr_number = ?',
            [utr]
        );
        return result.length > 0;
    }

    async createSupportTicket(userId, message, fileId = null) {
        const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const result = await this.query(
            `INSERT INTO support_tickets (ticket_id, user_id, message, file_id) 
             VALUES (?, ?, ?, ?)`,
            [ticketId, userId, message, fileId]
        );
        
        return ticketId;
    }

    async getSupportTickets(status = 'open') {
        return this.query(
            `SELECT t.*, u.username, u.first_name 
             FROM support_tickets t
             JOIN users u ON t.user_id = u.telegram_id
             WHERE t.status = ?
             ORDER BY t.created_at DESC`,
            [status]
        );
    }

    async replyToTicket(ticketId, reply, adminId) {
        await this.query(
            `UPDATE support_tickets SET 
             status = 'replied',
             admin_reply = ?,
             replied_by = ?,
             updated_at = NOW() 
             WHERE ticket_id = ?`,
            [reply, adminId, ticketId]
        );
    }

    async closeTicket(ticketId) {
        await this.query(
            `UPDATE support_tickets SET 
             status = 'closed',
             updated_at = NOW() 
             WHERE ticket_id = ?`,
            [ticketId]
        );
    }

    async getSetting(key) {
        const settings = await this.query(
            'SELECT setting_value FROM settings WHERE setting_key = ?',
            [key]
        );
        return settings[0]?.setting_value;
    }

    async updateSetting(key, value) {
        await this.query(
            `INSERT INTO settings (setting_key, setting_value) 
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
            [key, value]
        );
    }

    async getStats() {
        const stats = {};
        
        // Total users
        const users = await this.query('SELECT COUNT(*) as count FROM users');
        stats.totalUsers = users[0].count;
        
        // Active users (last 24h)
        const active = await this.query(
            'SELECT COUNT(*) as count FROM users WHERE last_active > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
        );
        stats.activeUsers = active[0].count;
        
        // Total orders
        const orders = await this.query('SELECT COUNT(*) as count FROM orders');
        stats.totalOrders = orders[0].count;
        
        // Orders by status
        const pending = await this.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
        stats.pendingOrders = pending[0].count;
        
        const success = await this.query("SELECT COUNT(*) as count FROM orders WHERE status = 'success'");
        stats.successOrders = success[0].count;
        
        const rejected = await this.query("SELECT COUNT(*) as count FROM orders WHERE status = 'rejected'");
        stats.rejectedOrders = rejected[0].count;
        
        // Total revenue
        const revenue = await this.query("SELECT SUM(total_price) as total FROM orders WHERE status = 'success'");
        stats.totalRevenue = revenue[0].total || 0;
        
        // Total stock
        const stock = await this.query('SELECT SUM(stock) as total FROM categories WHERE is_active = TRUE');
        stats.totalStock = stock[0].total || 0;
        
        return stats;
    }

    async getBlockedUsers() {
        return this.query(
            'SELECT telegram_id, username, first_name, block_reason, block_until FROM users WHERE is_blocked = TRUE'
        );
    }

    async getAllUsers() {
        return this.query('SELECT telegram_id, username, first_name, last_active, total_orders FROM users ORDER BY joined_at DESC');
    }

    async expireOldOrders() {
        await this.query(
            `UPDATE orders SET status = 'expired' 
             WHERE status = 'pending' AND expires_at < NOW()`
        );
    }

    async cleanupExpiredRecoveries() {
        // This will be used for recovery expiry
        await this.expireOldOrders();
    }
}

module.exports = new Database();
