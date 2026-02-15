const { startCommand } = require('../commands/start');
const { handleAdminCallback } = require('../commands/admin');
const { 
    selectCategory, selectQuantity, viewOrder,
    processPayment 
} = require('../commands/user');
const { 
    getOrder, updateOrderStatus, assignVoucherToOrder,
    getAvailableVouchers, getCategories
} = require('../sheets/googleSheets');

async function callbackHandler(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    
    // Delete previous message
    await bot.deleteMessage(chatId, messageId);
    
    // Handle channel check
    if (data === 'check_channels') {
        return startCommand(bot, { chat: { id: chatId }, from: { id: userId } });
    }
    
    // Handle admin callbacks
    if (data.startsWith('admin_') || data.startsWith('add_voucher_') || 
        data.startsWith('toggle_') || data.startsWith('approve_') ||
        data.startsWith('reject_') || data.startsWith('recover_') ||
        data.startsWith('norecover_') || data.startsWith('reply_')) {
        return handleAdminCallback(bot, callbackQuery);
    }
    
    // Handle category selection
    if (data.startsWith('select_cat_')) {
        const categoryId = data.split('_')[2];
        return selectCategory(bot, chatId, userId, categoryId);
    }
    
    // Handle quantity selection
    if (data.startsWith('qty_')) {
        const quantity = data.split('_')[1];
        return selectQuantity(bot, chatId, userId, quantity);
    }
    
    // Handle back to categories
    if (data === 'back_to_categories') {
        const categories = await getCategories();
        const keyboard = categories.map(cat => [
            { text: `💰 ${cat.name} - ₹${cat.price_per_code} (${cat.stock} left)`, callback_data: `select_cat_${cat.category_id}` }
        ]);
        keyboard.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);
        
        await bot.sendMessage(chatId, '🛒 Select voucher category:', {
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    
    // Handle back to main menu
    if (data === 'back_to_main') {
        return startCommand(bot, { chat: { id: chatId }, from: { id: userId } });
    }
    
    // Handle view order
    if (data.startsWith('view_order_')) {
        const orderId = data.replace('view_order_', '');
        return viewOrder(bot, chatId, orderId);
    }
    
    // Handle back to orders
    if (data === 'back_to_orders') {
        // Re-show orders
        const orders = await getUserOrders(userId);
        let message = '📦 Your Orders\n━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        for (const order of orders.slice(0, 5)) {
            const statusEmoji = order.status === 'delivered' ? '✅' : '⏳';
            message += `🧾 ${order.order_id}\n`;
            message += `🎟 ${order.category} | Qty ${order.quantity}\n`;
            message += `💰 ₹${order.total_price} | ${statusEmoji} ${order.status}\n\n`;
        }
        
        const keyboard = orders.slice(0, 5).map(order => [
            { text: order.order_id, callback_data: `view_order_${order.order_id}` }
        ]);
        keyboard.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);
        
        await bot.sendMessage(chatId, message, {
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    
    // Handle copy voucher
    if (data.startsWith('copy_')) {
        const voucherId = data.replace('copy_', '');
        // Implement voucher copy
        await bot.sendMessage(chatId, '✅ Voucher code copied!');
    }
}

module.exports = { callbackHandler };
