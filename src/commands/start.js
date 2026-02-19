const db = require('../database/database');
const { checkChannels, sendJoinMessage } = require('../middlewares/channelCheck');
const { deletePreviousMessage } = require('../utils/helpers');

async function startCommand(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    
    // Delete previous messages
    await deletePreviousMessage(bot, chatId, userId);
    
    // Add user to database
    db.addUser(userId, username, firstName);
    
    // Check channel membership
    const isMember = await checkChannels(bot, userId);
    
    if (!isMember) {
        return sendJoinMessage(bot, chatId);
    }
    
    // Send main menu
    await sendMainMenu(bot, chatId, firstName);
}

async function sendMainMenu(bot, chatId, firstName = '') {
    const welcomeMessage = `🎯 **Welcome to Shein Voucher Hub** ${firstName ? firstName : ''}!

🚀 Get exclusive Shein vouchers at the best prices!

📌 **Choose an option below:**`;

    await bot.sendMessage(chatId, welcomeMessage, {
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
