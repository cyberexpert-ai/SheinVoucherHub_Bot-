const db = require('../../database/database');
const helpers = require('../../utils/helpers');
const constants = require('../../utils/constants');

async function showAdminPanel(bot, chatId, userId) {
    const stats = {
        users: await db.query('SELECT COUNT(*) as count FROM users'),
        orders: await db.query('SELECT COUNT(*) as count FROM orders'),
        pending: await db.query('SELECT COUNT(*) as count FROM orders WHERE status = "pending"'),
        revenue: await db.query('SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status = "completed"'),
        stock: await db.query('SELECT COUNT(*) as count FROM vouchers WHERE is_used = FALSE')
    };
    
    const message = `👑 Admin Panel\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `📊 Statistics:\n` +
                    `• Total Users: ${stats.users[0].count}\n` +
                    `• Total Orders: ${stats.orders[0].count}\n` +
                    `• Pending Orders: ${stats.pending[0].count}\n` +
                    `• Total Revenue: ₹${stats.revenue[0].total}\n` +
                    `• Available Stock: ${stats.stock[0].count}\n\n` +
                    `Select an option:`;
    
    const keyboard = [
        ['📂 Categories', '🎟 Vouchers'],
        ['💰 Prices', '👥 Users'],
        ['📦 Orders', '📢 Broadcast'],
        ['🏷 Discounts', '📈 Detailed Stats'],
        ['🔒 Security', '↩️ Back']
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    });
}

module.exports = {
    showAdminPanel
};
