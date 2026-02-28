const { forceJoinMiddleware } = require('../middlewares/channelCheck');
const { userExistsMiddleware } = require('../middlewares/auth');
const constants = require('../utils/constants');
const helpers = require('../utils/helpers');

async function startCommand(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Auto delete previous messages
    if (global.lastMessages && global.lastMessages[userId]) {
        try {
            await bot.deleteMessage(chatId, global.lastMessages[userId]);
        } catch (error) {
            // Ignore deletion errors
        }
    }
    
    // Check channel membership first
    const membership = await require('../middlewares/channelCheck').checkChannelMembership(bot, userId);
    
    if (!membership.joined) {
        const joinMsg = await bot.sendMessage(chatId, constants.JOIN_MESSAGE, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Verify', callback_data: 'verify_channels' }]
                ]
            }
        });
        global.lastMessages = global.lastMessages || {};
        global.lastMessages[userId] = joinMsg.message_id;
        return;
    }
    
    // User is joined, create/update in database
    await db.createOrUpdateUser({
        telegram_id: userId,
        username: msg.from.username,
        first_name: msg.from.first_name,
        last_name: msg.from.last_name
    });
    
    // Show main menu
    const welcomeMsg = await bot.sendMessage(chatId, constants.WELCOME_MESSAGE, {
        reply_markup: {
            keyboard: [
                [constants.MAIN_MENU.BUY, constants.MAIN_MENU.RECOVER],
                [constants.MAIN_MENU.ORDERS, constants.MAIN_MENU.DISCLAIMER],
                [constants.MAIN_MENU.SUPPORT]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
    
    global.lastMessages[userId] = welcomeMsg.message_id;
}

module.exports = startCommand;
