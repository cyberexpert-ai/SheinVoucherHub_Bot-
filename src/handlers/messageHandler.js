const { startCommand } = require('../commands/start');
const { adminCommand } = require('../commands/admin');
const { buyVoucher, recoverVoucher, myOrders, disclaimer, support } = require('../commands/user');
const { getSetting } = require('../sheets/googleSheets');

async function messageHandler(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    // Check if bot is active
    const botStatus = await getSetting('bot_status');
    if (botStatus === 'inactive' && userId.toString() !== process.env.ADMIN_ID) {
        return bot.sendMessage(chatId, '⚠️ Bot is currently under maintenance. Please try again later.');
    }
    
    // Handle commands
    switch(text) {
        case '/start':
            return startCommand(bot, msg);
            
        case '/admin':
            if (userId.toString() === process.env.ADMIN_ID) {
                return adminCommand(bot, msg);
            }
            break;
            
        case '🛒 Buy Voucher':
            return buyVoucher(bot, msg);
            
        case '🔁 Recover Vouchers':
            return recoverVoucher(bot, msg);
            
        case '📦 My Orders':
            return myOrders(bot, msg);
            
        case '📜 Disclaimer':
            return disclaimer(bot, msg);
            
        case '🆘 Support':
            return support(bot, msg);
            
        case '↩️ Back':
        case '↩️ Leave':
            return startCommand(bot, msg);
            
        default:
            // Handle any other messages
            return bot.sendMessage(chatId, '❌ Invalid command. Please use the buttons below.', {
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
}

module.exports = { messageHandler };
