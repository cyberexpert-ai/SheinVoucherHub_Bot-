const { checkChannelJoin } = require('./auth');
const { MESSAGES } = require('../utils/constants');

const channelCheckMiddleware = async (bot, msg, next) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    // Skip check for admin
    if (userId.toString() === process.env.ADMIN_ID) {
        return next();
    }
    
    const isJoined = await checkChannelJoin(bot, userId);
    
    if (!isJoined) {
        const keyboard = {
            inline_keyboard: [
                [{ text: '📢 Official channel', url: 'https://t.me/SheinVoucherHub' }],
                [{ text: '📢 Order Alert 2', url: 'https://t.me/OrdersNotify' }],
                [{ text: '✅ Verify', callback_data: 'verify_join' }]
            ]
        };
        
        await bot.sendMessage(chatId, MESSAGES.JOIN_REQUIRED, {
            reply_markup: keyboard,
            parse_mode: 'HTML'
        });
        return false;
    }
    
    return next();
};

module.exports = channelCheckMiddleware;
