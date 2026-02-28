const constants = require('../../utils/constants');

async function showDisclaimer(bot, chatId, userId) {
    const msg = await bot.sendMessage(chatId, constants.DISCLAIMER_TEXT, {
        reply_markup: {
            keyboard: [[constants.BUTTONS.BACK]],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
    
    global.lastMessages[userId] = msg.message_id;
}

module.exports = {
    showDisclaimer
};
