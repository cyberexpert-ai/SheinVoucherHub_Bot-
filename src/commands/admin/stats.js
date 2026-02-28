const db = require('../../database/database');
const helpers = require('../../utils/helpers');

async function showDetailedStats(bot, chatId) {
    // Get overall stats
    const totalUsers = await db.query('SELECT COUNT(*) as count FROM users');
    const activeToday = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE DATE(last_active) = CURDATE()'
    );
    const newToday = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE DATE(joined_at) = CURDATE()'
    );
    
    const orders = await db.query('SELECT COUNT(*) as count FROM orders');
    const pendingOrders = await db.query(
        'SELECT COUNT(*) as count FROM orders WHERE status = "pending"'
    );
    const completedOrders = await db.query(
        'SELECT COUNT(*) as count FROM orders WHERE status = "completed"'
    );
    
    const revenue = await db.query(
        'SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status = "completed"'
    );
    const todayRevenue = await db.query(
        'SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE DATE(completed_at) = CURDATE() AND status = "completed"'
    );
    
    const stock = await db.query('SELECT COUNT(*) as count FROM vouchers WHERE is_used = FALSE');
    const usedStock = await db.query('SELECT COUNT(*) as count FROM vouchers WHERE is_used = TRUE');
    
    const blocked = await db.query('SELECT COUNT(*) as count FROM users WHERE is_blocked = TRUE');
    
    // Category breakdown
    const categories = await db.getCategories(false);
    let catStats = '';
    for (const cat of categories) {
        const catStock = await db.getVoucherCount(cat.id, false);
        const catOrders = await db.query(
            'SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as rev FROM orders WHERE category_id = ? AND status = "completed"',
            [cat.id]
        );
        catStats += `${cat.name}: Stock: ${catStock} | Orders: ${catOrders[0].count} | Rev: ₹${catOrders[0].rev}\n`;
    }
    
    const message = `📊 Detailed Statistics\n` +
                    `━━━━━━━━━━━━━━━━\n\n` +
                    `👥 USERS\n` +
                    `Total: ${totalUsers[0].count}\n` +
                    `Active Today: ${activeToday[0].count}\n` +
                    `New Today: ${newToday[0].count}\n` +
                    `Blocked: ${blocked[0].count}\n\n` +
                    
                    `📦 ORDERS\n` +
                    `Total: ${orders[0].count}\n` +
                    `Pending: ${pendingOrders[0].count}\n` +
                    `Completed: ${completedOrders[0].count}\n\n` +
                    
                    `💰 REVENUE\n` +
                    `Total: ₹${revenue[0].total}\n` +
                    `Today: ₹${todayRevenue[0].total}\n` +
                    `Average: ₹${completedOrders[0].count ? (revenue[0].total / completedOrders[0].count).toFixed(2) : 0}\n\n` +
                    
                    `🎟 VOUCHERS\n` +
                    `Available: ${stock[0].count}\n` +
                    `Used: ${usedStock[0].count}\n` +
                    `Total: ${stock[0].count + usedStock[0].count}\n\n` +
                    
                    `📊 CATEGORY BREAKDOWN\n` +
                    `${catStats}\n` +
                    
                    `━━━━━━━━━━━━━━━━\n`;
    
    await bot.sendMessage(chatId, message);
}

async function showUserGrowth(bot, chatId) {
    const daily = await db.query(
        `SELECT DATE(joined_at) as date, COUNT(*) as count 
         FROM users 
         WHERE joined_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY DATE(joined_at)
         ORDER BY date DESC`
    );
    
    let message = '📈 User Growth (Last 7 Days)\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const day of daily) {
        message += `${day.date}: +${day.count} users\n`;
    }
    
    await bot.sendMessage(chatId, message);
}

async function showOrderStats(bot, chatId) {
    const hourly = await db.query(
        `SELECT HOUR(created_at) as hour, COUNT(*) as count 
         FROM orders 
         WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
         GROUP BY HOUR(created_at)
         ORDER BY hour`
    );
    
    let message = '📊 Order Activity (Last 24h)\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const h of hourly) {
        const hourStr = h.hour.toString().padStart(2, '0') + ':00';
        message += `${hourStr}: ${h.count} orders\n`;
    }
    
    await bot.sendMessage(chatId, message);
}

module.exports = {
    showDetailedStats,
    showUserGrowth,
    showOrderStats
};
