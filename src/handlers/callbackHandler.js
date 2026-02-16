const { startCommand } = require('../commands/start');
const { handleAdminCallback } = require('../commands/admin');
const { 
    selectCategory, selectQuantity, viewOrder 
} = require('../commands/user');
const { 
    handleManualPayment,
    approvePayment,
    rejectPayment 
} = require('./paymentHandler');

async function callbackHandler(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    await bot.deleteMessage(chatId, messageId).catch(() => {});
    
    // Admin callbacks
    if (data.startsWith('admin_') || data.startsWith('approve_') || 
        data.startsWith('reject_') || data.startsWith('block_')) {
        return handleAdminCallback(bot, callbackQuery);
    }
    
    // Payment callbacks
    if (data.startsWith('manual_pay_')) {
        const orderId = data.replace('manual_pay_', '');
        return handleManualPayment(bot, chatId, userId, orderId);
    }
    
    // Admin approve/reject payments
    if (data.startsWith('approve_')) {
        const orderId = data.replace('approve_', '');
        return approvePayment(bot, chatId, orderId);
    }
    
    if (data.startsWith('reject_')) {
        const orderId = data.replace('reject_', '');
        return rejectPayment(bot, chatId, orderId, 'Payment verification failed');
    }
    
    // Category selection
    if (data.startsWith('select_cat_')) {
        const categoryId = data.split('_')[2];
        return selectCategory(bot, chatId, userId, categoryId);
    }
    
    // Quantity selection
    if (data.startsWith('qty_')) {
        const quantity = data.split('_')[1];
        return selectQuantity(bot, chatId, userId, quantity);
    }
    
    // View order
    if (data.startsWith('view_order_')) {
        const orderId = data.replace('view_order_', '');
        return viewOrder(bot, chatId, orderId);
    }
    
    // Cancel payment
    if (data === 'cancel_payment') {
        return startCommand(bot, { chat: { id: chatId }, from: { id: userId } });
    }
    
    // Back to main
    if (data === 'back_to_main') {
        return startCommand(bot, { chat: { id: chatId }, from: { id: userId } });
    }
}

module.exports = { callbackHandler };
