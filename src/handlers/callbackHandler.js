const { sendMainMenu } = require('../commands/start');
const { adminCommand } = require('../commands/admin');
const { 
    selectCategory, selectQuantity, myOrders 
} = require('../commands/user');
const { channelCheckMiddleware } = require('../middlewares/channelCheck');

async function callbackHandler(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    await bot.deleteMessage(chatId, callbackQuery.message.message_id).catch(() => {});
    
    if (data === 'verify_channels') {
        return channelCheckMiddleware.verifyAndRespond(bot, chatId, userId);
    }
    
    if (data === 'back_to_main') {
        return sendMainMenu(bot, chatId);
    }
    
    if (data.startsWith('select_cat_')) {
        const id = data.split('_')[2];
        return selectCategory(bot, chatId, userId, id);
    }
    
    if (data.startsWith('qty_')) {
        const qty = data.split('_')[1];
        return selectQuantity(bot, chatId, userId, qty);
    }
    
    if (data === 'back_to_categories') {
        const { buyVouchers } = require('../commands/user');
        return buyVouchers(bot, { chat: { id: chatId }, from: { id: userId } });
    }
}

module.exports = { callbackHandler };
