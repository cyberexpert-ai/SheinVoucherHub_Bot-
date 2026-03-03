const { MESSAGES, KEYBOARD } = require('../../utils/constants');

const show = async (msg) => {
    const bot = global.bot;
    const chatId = msg.chat.id;
    
    await bot.sendMessage(chatId, MESSAGES.DISCLAIMER, {
        reply_markup: { keyboard: KEYBOARD.BACK, resize_keyboard: true }
    });
};

module.exports = {
    show
};
