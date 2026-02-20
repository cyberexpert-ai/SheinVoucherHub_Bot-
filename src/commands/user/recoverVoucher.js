const db = require('../../database/database');
const { deletePreviousMessage } = require('../../utils/helpers');

let userState = {};

async function recoverVouchers(bot, msg) {
    const chatId = msg.chat.id;
    
    await deletePreviousMessage(bot, chatId);
    
    const message = `🔁 **Recover Vouchers**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSend your Order ID\nExample: \`SVH-20260219-ABC123\`\n\n⚠️ Recovery available within 2 hours of delivery\n✅ Only orders delivered to YOU can be recovered`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['← Back to Menu']],
            resize_keyboard: true
        }
    });
    
    userState[msg.from.id] = { step: 'awaiting_recovery' };
}

async function handleRecovery(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const orderId = text.trim();
    
    if (orderId === '← Back to Menu' || orderId === '← Back' || orderId === 'Back') {
        delete userState[userId];
        const { startCommand } = require('../start');
        return startCommand(bot, msg);
    }
    
    await bot.sendMessage(chatId, `⏳ **Processing recovery request for Order** \`${orderId}\`...`, {
        parse_mode: 'Markdown'
    });
    
    const recovery = db.canRecover(orderId, userId);
    
    if (!recovery.can) {
        let errorMsg = '';
        if (recovery.reason === 'not_found') {
            errorMsg = `⚠️ **Order not found:** \`${orderId}\``;
        } else if (recovery.reason === 'wrong_user') {
            errorMsg = '❌ **This order belongs to another user!**';
        } else if (recovery.reason === 'not_delivered') {
            errorMsg = '❌ **This order is not delivered yet!**';
        } else if (recovery.reason === 'expired') {
            errorMsg = '⏰ **Recovery period expired** (2 hours limit)';
        }
        
        await bot.sendMessage(chatId, errorMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [['← Back to Menu']],
                resize_keyboard: true
            }
        });
        
        delete userState[userId];
        return;
    }
    
    const order = recovery.order;
    const user = db.getUser(userId);
    
    const adminMsg = `🔄 **Recovery Request**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Order ID:** \`${orderId}\`\n**User:** ${user?.firstName || 'N/A'} (@${user?.username || 'N/A'})\n**User ID:** \`${userId}\`\n**Category:** ${order.categoryName}\n**Quantity:** ${order.quantity}\n**Amount:** ₹${order.totalPrice}\n**Original Delivery:** ${new Date(order.deliveredAt || order.createdAt).toLocaleString()}\n\n**Action Required:** Process recovery`;

    await bot.sendMessage(process.env.ADMIN_ID, adminMsg, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Send New Code', callback_data: `recover_${orderId}` },
                    { text: '❌ Cannot Recover', callback_data: `norecover_${orderId}` }
                ]
            ]
        }
    });
    
    await bot.sendMessage(chatId, '✅ **Recovery request sent to admin.** You will receive response soon.', {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['← Back to Menu']],
            resize_keyboard: true
        }
    });
    
    delete userState[userId];
}

module.exports = {
    recoverVouchers,
    handleRecovery
};
