const db = require('../../database/database');
const helpers = require('../../utils/helpers');
const constants = require('../../utils/constants');

async function showOrders(bot, chatId, userId) {
    const orders = await db.getUserOrders(userId, 10);
    
    if (!orders.length) {
        const msg = await bot.sendMessage(chatId, constants.ERRORS.NO_ORDERS, {
            reply_markup: {
                keyboard: [[constants.BUTTONS.BACK]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
        global.lastMessages[userId] = msg.message_id;
        return;
    }
    
    let message = '📦 Your Orders\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const order of orders) {
        const statusEmoji = order.status === 'completed' ? '✅' :
                           order.status === 'pending' ? '⏳' :
                           order.status === 'rejected' ? '❌' : '⌛';
        
        message += `${statusEmoji} ${order.order_id}\n`;
        message += `🎟 ${order.category_name} | Qty ${order.quantity}\n`;
        message += `💰 ${helpers.formatCurrency(order.total_price)} | ${order.status.toUpperCase()}\n`;
        
        if (order.status === 'completed' && order.vouchers) {
            const voucherList = order.vouchers.split(',');
            message += `📋 Codes: ${voucherList.length} available\n`;
        }
        
        message += '━━━━━━━━━━━━━━━━\n\n';
    }
    
    const msg = await bot.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: {
            keyboard: [[constants.BUTTONS.BACK]],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
    
    global.lastMessages[userId] = msg.message_id;
}

async function showOrderDetail(bot, chatId, userId, orderId) {
    const order = await db.getOrder(orderId);
    
    if (!order || order.user_id != userId) {
        await bot.sendMessage(chatId, '❌ Order not found.');
        return;
    }
    
    let message = `🧾 Order Details\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `Order ID: ${order.order_id}\n`;
    message += `Date: ${helpers.formatDate(order.created_at)}\n`;
    message += `Category: ${order.category_name}\n`;
    message += `Quantity: ${order.quantity}\n`;
    message += `Total: ${helpers.formatCurrency(order.total_price)}\n`;
    message += `Status: ${order.status.toUpperCase()}\n`;
    
    if (order.status === 'completed') {
        const vouchers = order.vouchers ? order.vouchers.split(',') : [];
        message += `\n📋 Voucher Codes:\n`;
        
        const buttons = [];
        for (let i = 0; i < vouchers.length; i++) {
            buttons.push([{
                text: `📋 Copy Code ${i+1}`,
                callback_data: `copy_code_${vouchers[i].trim()}`
            }]);
        }
        
        const msg = await bot.sendMessage(chatId, message, {
            reply_markup: {
                inline_keyboard: buttons
            }
        });
        global.lastMessages[userId] = msg.message_id;
    } else {
        const msg = await bot.sendMessage(chatId, message, {
            reply_markup: {
                keyboard: [[constants.BUTTONS.BACK]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
        global.lastMessages[userId] = msg.message_id;
    }
}

module.exports = {
    showOrders,
    showOrderDetail
};
