const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { formatCurrency, formatOrderMessage } = require('../../utils/helpers');
const { MESSAGES, KEYBOARD } = require('../../utils/constants');

const showOrders = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    try {
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
                reply_markup: { keyboard: KEYBOARD.BACK, resize_keyboard: true }
            });
            return;
        }
        
        let message = '📦 Your Orders\n\n';
        
        for (const order of orders.rows) {
            message += `🧾 ${order.order_id}\n`;
            message += `🎟 ${order.category_name} | Qty ${order.quantity}\n`;
            message += `💰 ${formatCurrency(order.total_price)} | ${order.status}\n`;
            
            if (order.status === 'successful' && order.voucher_codes) {
                message += `🔑 Code: \`${order.voucher_codes[0]}\`\n`;
            }
            
            message += '━━━━━━━━━━━\n';
        }
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: { keyboard: KEYBOARD.BACK, resize_keyboard: true }
        });
        
    } catch (error) {
        logger.error('Error showing orders:', error);
        await bot.sendMessage(chatId, '❌ Error loading orders. Please try again.');
    }
};

const showOrderDetails = async (bot, user, message, orderId) => {
    const chatId = message.chat.id;
    const userId = user.id;
    
    try {
        const pool = getPool();
        
        const order = await pool.query(
            `SELECT o.*, c.name as category_name 
             FROM orders o
             JOIN categories c ON o.category_id = c.category_id
             WHERE o.order_id = $1 AND o.user_id = $2`,
            [orderId, userId]
        );
        
        if (order.rows.length === 0) {
            await bot.sendMessage(chatId, '❌ Order not found.');
            return;
        }
        
        const ord = order.rows[0];
        
        let message = `📦 Order Details\n\n`;
        message += `Order ID: ${ord.order_id}\n`;
        message += `Category: ${ord.category_name}\n`;
        message += `Quantity: ${ord.quantity}\n`;
        message += `Total: ${formatCurrency(ord.total_price)}\n`;
        message += `Status: ${ord.status}\n`;
        message += `Date: ${ord.created_at.toLocaleString()}\n\n`;
        
        if (ord.status === 'successful' && ord.voucher_codes) {
            message += `Your Vouchers:\n`;
            ord.voucher_codes.forEach((code, index) => {
                message += `${index + 1}. \`${code}\`\n`;
            });
        }
        
        const buttons = [];
        if (ord.status === 'successful' && ord.voucher_codes) {
            buttons.push([{ text: '📋 Copy Code', callback_data: `copy_${ord.voucher_codes[0]}` }]);
        }
        buttons.push([{ text: '↩️ Back', callback_data: 'back_orders' }]);
        
        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
        });
        
    } catch (error) {
        logger.error('Error showing order details:', error);
        await bot.sendMessage(chatId, '❌ Error loading order details.');
    }
};

module.exports = {
    showOrders,
    showOrderDetails
};
