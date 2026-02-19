const db = require('../database/database');
const { channelCheckMiddleware } = require('../middlewares/channelCheck');

async function startCommand(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    
    // অ্যাডমিন মোড চেক
    const { isAdminMode, exitAdminMode } = require('./admin');
    if (isAdminMode(chatId)) {
        exitAdminMode();
    }
    
    // ইউজার অ্যাড
    db.addUser(userId, username, firstName);
    
    // চ্যানেল চেক
    const isMember = await channelCheckMiddleware.checkChannels(bot, userId);
    if (!isMember) {
        return channelCheckMiddleware.sendJoinMessage(bot, chatId);
    }
    
    // মেনু দেখাও
    await sendMainMenu(bot, chatId, firstName);
}

async function sendMainMenu(bot, chatId, firstName = '') {
    const welcome = `🎯 **Welcome ${firstName}!**

🚀 Get Shein vouchers at best prices!

👇 Choose option:`;

    await bot.sendMessage(chatId, welcome, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                ['🛒 Buy Vouchers', '📦 My Orders'],
                ['🔁 Recover Vouchers', '🆘 Support'],
                ['📜 Disclaimer']
            ],
            resize_keyboard: true
        }
    });
}

module.exports = { startCommand, sendMainMenu };
