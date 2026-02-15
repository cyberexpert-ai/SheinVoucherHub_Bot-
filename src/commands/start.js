const { addUser, getUser } = require('../sheets/googleSheets');
const { channelCheckMiddleware } = require('../middlewares/channelCheck');
const { authMiddleware } = require('../middlewares/auth');

async function startCommand(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    
    // Add user to database if not exists
    await addUser(userId, username, firstName);
    
    // Check channel membership
    const isMember = await channelCheckMiddleware.checkChannels(bot, userId);
    
    if (!isMember) {
        return channelCheckMiddleware.sendJoinMessage(bot, chatId);
    }
    
    // Check if user is verified
    const user = await getUser(userId);
    if (user && user.verified !== 'true') {
        return authMiddleware.sendCaptcha(bot, chatId, userId);
    }
    
    // Send main menu
    const welcomeMessage = `🎯 Welcome to Shein Voucher Hub!

🚀 Get exclusive Shein vouchers at the best prices!

📌 Choose an option below:`;

    await bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
            keyboard: [
                ['🛒 Buy Voucher', '🔁 Recover Vouchers'],
                ['📦 My Orders', '📜 Disclaimer'],
                ['🆘 Support']
            ],
            resize_keyboard: true
        }
    });
}

module.exports = { startCommand };
