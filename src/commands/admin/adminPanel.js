const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/helpers');

const showAdminPanel = async (msg) => {
    const bot = global.bot;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check if admin
    if (userId.toString() !== process.env.ADMIN_ID) {
        await bot.sendMessage(chatId, '⛔ Unauthorized access.');
        return;
    }
    
    try {
        const pool = getPool();
        
        // Get stats
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const orderStats = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'successful' THEN 1 ELSE 0 END) as successful,
                COALESCE(SUM(CASE WHEN status = 'successful' THEN total_price ELSE 0 END), 0) as revenue
            FROM orders
        `);
        
        const stats = orderStats.rows[0];
        
        const adminMessage = `👑 Admin Panel

📊 Quick Stats
━━━━━━━━━━━━━━━━━━
👥 Total Users: ${userCount.rows[0].count}
📦 Total Orders: ${stats.total_orders || 0}
⏳ Pending: ${stats.pending || 0}
✅ Successful: ${stats.successful || 0}
💰 Revenue: ${formatCurrency(stats.revenue || 0)}

━━━━━━━━━━━━━━━━━━
Select an option below:`;

        const adminKeyboard = {
            inline_keyboard: [
                [{ text: '📊 Category Management', callback_data: 'admin_category' }],
                [{ text: '🎟 Voucher Management', callback_data: 'admin_voucher' }],
                [{ text: '💰 Price Management', callback_data: 'admin_price' }],
                [{ text: '👥 User Management', callback_data: 'admin_users' }],
                [{ text: '📦 Order Management', callback_data: 'admin_orders' }],
                [{ text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
                [{ text: '🏷 Discount Codes', callback_data: 'admin_discount' }],
                [{ text: '📈 Detailed Stats', callback_data: 'admin_stats' }],
                [{ text: '🔒 Security', callback_data: 'admin_security' }]
            ]
        };
        
        await bot.sendMessage(chatId, adminMessage, {
            reply_markup: adminKeyboard
        });
        
    } catch (error) {
        logger.error('Error in admin panel:', error);
        await bot.sendMessage(chatId, '❌ Error loading admin panel.');
    }
};

module.exports = showAdminPanel;
