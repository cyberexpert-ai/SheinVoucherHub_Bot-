const { addUser, getUser, updateUserVerification } = require('../sheets/googleSheets');
const { channelCheckMiddleware } = require('../middlewares/channelCheck');

async function startCommand(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    
    // Add user to database
    await addUser(userId, username, firstName);
    
    // Check channel membership
    const isMember = await channelCheckMiddleware.checkChannels(bot, userId);
    
    if (!isMember) {
        return channelCheckMiddleware.sendJoinMessage(bot, chatId);
    }
    
    // Send main menu directly (no captcha)
    await sendMainMenu(bot, chatId);
}

async function sendMainMenu(bot, chatId) {
    const welcomeMessage = `🎯 Welcome to Shein Voucher Hub!

🚀 Get exclusive Shein vouchers at the best prices!

📌 Choose an option below:`;

    await bot.sendMessage(chatId, welcomeMessage, {
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

async function handleVerificationSuccess(bot, chatId) {
    await sendMainMenu(bot, chatId);
}

module.exports = { startCommand, sendMainMenu, handleVerificationSuccess };
