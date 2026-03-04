const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/helpers');
const { MESSAGES, KEYBOARD } = require('../../utils/constants');

const showOrders = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    try {
        logger.info(`Showing orders for user ${userId}`);
        
        const pool = getPool();
        
        // Get user's orders
        const orders = await pool.query(
            `SELECT o.*, c.name as category_name 
             FROM orders o
             JOIN categories c ON o.category_id = c.category_id
             WHERE o.user_id = $1
             ORDER BY o.created_at DESC
             LIMIT 10`,
            [userId]
        );
        
        if (orders.rows.length === 0) {
            await bot.sendMessage(chatId, MESSAGES.NO_ORDERS, {
                reply_markup: { keyboard: KEYBOARD.MAIN, resize_keyboard: true }
            });
            return;
        }
        
        let message = '📦 *Your Orders*\n\n';
        
        for (const order of orders.rows) {
            message += `*🧾 Order:* \`${order.order_id}\`\n`;
            message += `*🎟 Category:* ${order.category_name} | Qty: ${order.quantity}\n`;
            message += `*💰 Amount:* ${formatCurrency(order.total_price)} | *Status:* ${order.status}\n`;
            
            if (order.status === 'successful' && order.voucher_codes && order.voucher_codes.length > 0) {
                message += `*🔑 Code:* \`${order.voucher_codes[0]}\`\n`;
            }
            
            message += '━━━━━━━━━━━━━━━━━━\n';
        }
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: { keyboard: KEYBOARD.MAIN, resize_keyboard: true }
        });
        
    } catch (error) {
        logger.error('Error showing orders:', error);
        await bot.sendMessage(chatId, '❌ Error loading orders. Please try again.', {
            reply_markup: { keyboard: KEYBOARD.MAIN, resize_keyboard: true }
        });
    }
};

module.exports = {
    showOrders
};
