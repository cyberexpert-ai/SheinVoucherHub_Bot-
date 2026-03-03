const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/helpers');

const showStats = async (bot, chatId) => {
    const pool = getPool();
    
    try {
        // Overall stats
        const overall = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE last_active > NOW() - INTERVAL '24 hours') as active_24h,
                (SELECT COUNT(*) FROM users WHERE joined_at > NOW() - INTERVAL '7 days') as new_week,
                (SELECT COUNT(*) FROM orders) as total_orders,
                (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
                (SELECT COUNT(*) FROM orders WHERE status = 'successful') as successful_orders,
                (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'successful') as total_revenue
        `);
        
        // Daily stats for last 7 days
        const daily = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders,
                COALESCE(SUM(CASE WHEN status = 'successful' THEN total_price ELSE 0 END), 0) as revenue
            FROM orders
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);
        
        // Category stats
        const categories = await pool.query(`
            SELECT 
                c.name,
                c.stock,
                COUNT(v.voucher_id) as total_vouchers,
                SUM(CASE WHEN v.is_sold THEN 1 ELSE 0 END) as sold
            FROM categories c
            LEFT JOIN vouchers v ON c.category_id = v.category_id
            GROUP BY c.category_id, c.name, c.stock
            ORDER BY c.category_id
        `);
        
        let message = '📊 Detailed Statistics\n\n';
        message += '━━━━━━━━━━━━━━━━━━\n';
        message += '📈 OVERALL\n';
        message += '━━━━━━━━━━━━━━━━━━\n';
        message += `👥 Total Users: ${overall.rows[0].total_users}\n`;
        message += `🟢 Active (24h): ${overall.rows[0].active_24h}\n`;
        message += `🆕 New (7d): ${overall.rows[0].new_week}\n`;
        message += `📦 Total Orders: ${overall.rows[0].total_orders}\n`;
        message += `⏳ Pending: ${overall.rows[0].pending_orders}\n`;
        message += `✅ Successful: ${overall.rows[0].successful_orders}\n`;
        message += `💰 Total Revenue: ${formatCurrency(overall.rows[0].total_revenue)}\n\n`;
        
        message += '━━━━━━━━━━━━━━━━━━\n';
        message += '📅 LAST 7 DAYS\n';
        message += '━━━━━━━━━━━━━━━━━━\n';
        daily.rows.forEach(day => {
            message += `${day.date}: ${day.orders} orders | ${formatCurrency(day.revenue)}\n`;
        });
        message += '\n';
        
        message += '━━━━━━━━━━━━━━━━━━\n';
        message += '📦 CATEGORY STOCKS\n';
        message += '━━━━━━━━━━━━━━━━━━\n';
        categories.rows.forEach(cat => {
            message += `${cat.name}: Stock ${cat.stock} | Total ${cat.total_vouchers} | Sold ${cat.sold || 0}\n`;
        });
        
        const buttons = [
            [
                { text: '📊 Refresh', callback_data: 'admin_stats' },
                { text: '📥 Export', callback_data: 'admin_exportstats' }
            ],
            [{ text: '↩️ Back', callback_data: 'admin_back' }]
        ];
        
        await bot.sendMessage(chatId, message, {
            reply_markup: { inline_keyboard: buttons }
        });
        
    } catch (error) {
        logger.error('Error showing stats:', error);
        await bot.sendMessage(chatId, '❌ Error loading statistics.');
    }
};

module.exports = {
    showStats
};
