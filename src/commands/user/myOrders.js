const db = require('../../database/database');
const { deletePreviousMessage } = require('../../utils/helpers');

let userState = {};

async function myOrders(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    await deletePreviousMessage(bot, chatId, userId);
    
    const orders = db.getUserOrders(userId);
    
    if (orders.length === 0) {
        return bot.sendMessage(chatId, '📦 **You don\'t have any orders yet.**', {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [['← Back to Menu']],
                resize_keyboard: true
            }
        });
    }
    
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let text = '📦 **Your Orders**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    sortedOrders.forEach(order => {
        const statusEmoji = order.status === 'delivered' ? '✅' : 
                           order.status === 'pending_approval' ? '⏳' :
                           order.status === 'rejected' ? '❌' : '🔄';
        
        text += `🧾 \`${order.id}\`\n`;
        text += `🎟 ${order.categoryName} | Qty ${order.quantity}\n`;
        text += `💰 ₹${order.totalPrice} | ${statusEmoji} ${order.status}\n\n`;
    });
    
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nClick any order to view details`;
    
    const keyboard = {
        inline_keyboard: sortedOrders.slice(0, 5).map(order => [
            { text: `📦 ${order.id}`, callback_data: `view_order_${order.id}` }
        ]).concat([[{ text: '← Back to Menu', callback_data: 'back_to_main' }]])
    };
    
    await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function viewOrder(bot, chatId, orderId) {
    await deletePreviousMessage(bot, chatId);
    
    const order = db.getOrder(orderId);
    if (!order) return;
    
    let text = `📦 **Order Details**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
               `**Order ID:** \`${order.id}\`\n` +
               `**Date:** ${new Date(order.createdAt).toLocaleString()}\n` +
               `**Category:** ${order.categoryName}\n` +
               `**Quantity:** ${order.quantity}\n` +
               `**Price per code:** ₹${order.pricePerCode || 'N/A'}\n` +
               `**Total:** ₹${order.totalPrice}\n` +
               `**Status:** `;
    
    if (order.status === 'delivered') {
        text += '✅ Delivered';
        
        const vouchers = db.getVouchers(order.categoryId)
            .filter(v => v.orderId === orderId);
        
        if (vouchers.length > 0) {
            text += `\n\n**Your Vouchers:**\n`;
            vouchers.forEach((v, i) => {
                text += `${i+1}. \`${v.code}\`\n`;
            });
        }
    } else if (order.status === 'pending_approval') {
        text += '⏳ Pending Approval';
    } else if (order.status === 'rejected') {
        text += '❌ Rejected';
        if (order.adminNote) {
            text += `\n**Reason:** ${order.adminNote}`;
        }
    } else if (order.status === 'pending') {
        text += '🔄 Awaiting Payment';
    } else {
        text += '🔄 Processing';
    }
    
    await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '← Back to Orders', callback_data: 'back_to_orders' }]
            ]
        }
    });
}

module.exports = {
    myOrders,
    viewOrder
};
