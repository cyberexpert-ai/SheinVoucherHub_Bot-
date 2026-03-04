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
        
        const categoryStats = await pool.query(`
            SELECT 
                COUNT(*) as total_categories,
                SUM(stock) as total_stock
            FROM categories WHERE is_active = true
        `);
        
        const stats = orderStats.rows[0];
        const catStats = categoryStats.rows[0];
        
        const adminMessage = `👑 *Admin Panel*\n\n` +
            `📊 *Quick Stats*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👥 *Total Users:* ${userCount.rows[0].count}\n` +
            `📦 *Total Orders:* ${stats.total_orders || 0}\n` +
            `⏳ *Pending:* ${stats.pending || 0}\n` +
            `✅ *Successful:* ${stats.successful || 0}\n` +
            `💰 *Revenue:* ${formatCurrency(stats.revenue || 0)}\n` +
            `📊 *Categories:* ${catStats.total_categories || 0}\n` +
            `🎫 *Total Stock:* ${catStats.total_stock || 0}\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `Select an option below:`;

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
            parse_mode: 'Markdown',
            reply_markup: adminKeyboard
        });
        
    } catch (error) {
        logger.error('Error in admin panel:', error);
        await bot.sendMessage(
            chatId, 
            '❌ Error loading admin panel. Please check logs.',
            {
                reply_markup: {
                    keyboard: [
                        ['🛒 Buy Voucher', '🔁 Recover Vouchers'],
                        ['📦 My Orders', '📜 Disclaimer'],
                        ['🆘 Support']
                    ],
                    resize_keyboard: true
                }
            }
        );
    }
};

module.exports = showAdminPanel;
