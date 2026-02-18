const { addUser, getUser } = require('../sheets/googleSheets');
const { channelCheckMiddleware } = require('../middlewares/channelCheck');
const keyboards = require('../keyboards/keyboards');

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

📌 **Features:**
• 🛒 Buy Vouchers - Multiple categories available
• 📦 My Orders - Track your purchases
• 🔁 Recover Vouchers - Get lost vouchers back
• 🆘 Support - 24/7 customer support
• 📜 Disclaimer - Terms and conditions

✨ **How to use:**
1️⃣ Select a category
2️⃣ Choose quantity
3️⃣ Make payment via QR code
4️⃣ Upload screenshot and UTR
5️⃣ Get vouchers instantly after admin approval

👇 **Choose an option below:**`;

    await bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.mainMenu
    });
}

module.exports = { startCommand, sendWelcomeMessage };
