const { addUser, getUser } = require('../sheets/googleSheets');
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
    
    // Send welcome message and main menu
    await sendWelcomeMessage(bot, chatId, firstName);
}

async function sendWelcomeMessage(bot, chatId, firstName) {
    const welcomeMessage = `🎯 **Welcome to Shein Voucher Hub!** ${firstName ? firstName : ''}

🚀 Get exclusive Shein vouchers at the best prices!

📌 **How to use:**
1️⃣ Click on 'Buy Vouchers'
2️⃣ Select a category
3️⃣ Choose quantity
4️⃣ Make payment via QR code
5️⃣ Upload screenshot and UTR
6️⃣ Get vouchers after admin approval

👇 **Click the buttons below:**`;

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

async function sendMainMenu(bot, chatId) {
    await bot.sendMessage(chatId, '📌 **Main Menu**', {
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

module.exports = { startCommand, sendWelcomeMessage, sendMainMenu };
