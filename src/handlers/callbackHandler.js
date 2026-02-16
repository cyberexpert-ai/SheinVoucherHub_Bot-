const { startCommand, sendMainMenu } = require('../commands/start');
const { handleAdminText } = require('../commands/admin');
const { 
    selectCategory, selectQuantity, viewOrder, myOrders 
} = require('../commands/user');
const { 
    handleManualPayment,
    approvePayment,
    rejectPayment 
} = require('./paymentHandler');
const { channelCheckMiddleware } = require('../middlewares/channelCheck');

let adminState = {};

async function callbackHandler(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    
    try {
        await bot.deleteMessage(chatId, messageId);
    } catch (error) {}
    
    // Channel verification
    if (data === 'verify_channels') {
        return channelCheckMiddleware.verifyAndRespond(bot, chatId, userId);
    }
    
    // Admin callbacks
    if (data === 'admin_add_category') {
        adminState[chatId] = { action: 'add_category' };
        await bot.sendMessage(chatId, '➕ Send category amount (e.g., 500 for ₹500 voucher):');
        return;
    }
    
    if (data === 'admin_back') {
        const { adminCommand } = require('../commands/admin');
        return adminCommand(bot, { chat: { id: chatId } });
    }
    
    // Payment callbacks
    if (data.startsWith('manual_pay_')) {
        const orderId = data.replace('manual_pay_', '');
        return handleManualPayment(bot, chatId, userId, orderId);
    }
    
    if (data.startsWith('approve_')) {
        if (userId.toString() === process.env.ADMIN_ID) {
            const orderId = data.replace('approve_', '');
            return approvePayment(bot, chatId, orderId);
        }
    }
    
    if (data.startsWith('reject_')) {
        if (userId.toString() === process.env.ADMIN_ID) {
            const orderId = data.replace('reject_', '');
            return rejectPayment(bot, chatId, orderId, 'Payment verification failed');
        }
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
    
    // Back to categories
    if (data === 'back_to_categories') {
        const { buyVouchers } = require('../commands/user');
        return buyVouchers(bot, { chat: { id: chatId }, from: { id: userId } });
    }
    
    // Back to orders
    if (data === 'back_to_orders') {
        return myOrders(bot, { chat: { id: chatId }, from: { id: userId } });
    }
    
    // Back to main
    if (data === 'back_to_main') {
        return sendMainMenu(bot, chatId);
    }
    
    // Cancel payment
    if (data === 'cancel_payment') {
        return sendMainMenu(bot, chatId);
    }
}

module.exports = { callbackHandler };
