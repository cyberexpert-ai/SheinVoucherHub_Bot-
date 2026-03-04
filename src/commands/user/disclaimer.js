const { MESSAGES, KEYBOARD } = require('../../utils/constants');

const show = async (msg) => {
    const bot = global.bot;
    const chatId = msg.chat.id;
    
    await bot.sendMessage(chatId, MESSAGES.DISCLAIMER, {
        parse_mode: 'Markdown',
        reply_markup: { keyboard: KEYBOARD.MAIN, resize_keyboard: true }
    });
};

module.exports = {
    show
};
