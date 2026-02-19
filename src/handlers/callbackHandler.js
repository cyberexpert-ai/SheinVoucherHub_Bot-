const { sendMainMenu } = require('../commands/start');
const { adminCommand, handleAdminCallback } = require('../commands/admin');
const { 
    selectCategory, selectQuantity, viewOrder, myOrders 
} = require('../commands/user');
const { channelCheckMiddleware } = require('../middlewares/channelCheck');
const { userState } = require('../commands/user');

async function callbackHandler(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    
    try {
        await bot.deleteMessage(chatId, messageId);
    } catch (error) {}
    
    // ==================== CHANNEL VERIFICATION ====================
    if (data === 'verify_channels') {
        return channelCheckMiddleware.verifyAndRespond(bot, chatId, userId);
    }
    
    // ==================== ADMIN CALLBACKS ====================
    if (data.startsWith('admin_')) {
        return handleAdminCallback(bot, callbackQuery);
    }
    
    // ==================== CATEGORY SELECTION ====================
    if (data.startsWith('select_cat_')) {
        const categoryId = data.split('_')[2];
        return selectCategory(bot, chatId, userId, categoryId);
    }
    
    // ==================== QUANTITY SELECTION ====================
    if (data.startsWith('qty_')) {
        const quantity = data.split('_')[1];
        return selectQuantity(bot, chatId, userId, quantity);
    }
    
    // ==================== VIEW ORDER ====================
    if (data.startsWith('view_order_')) {
        const orderId = data.replace('view_order_', '');
        return viewOrder(bot, chatId, orderId);
    }
    
    // ==================== BACK TO CATEGORIES ====================
    if (data === 'back_to_categories') {
        const { buyVouchers } = require('../commands/user');
        return buyVouchers(bot, { chat: { id: chatId }, from: { id: userId } });
    }
    
    // ==================== BACK TO ORDERS ====================
    if (data === 'back_to_orders') {
        return myOrders(bot, { chat: { id: chatId }, from: { id: userId } });
    }
    
    // ==================== BACK TO MAIN ====================
    if (data === 'back_to_main') {
        return sendMainMenu(bot, chatId);
    }
}

module.exports = { callbackHandler };
