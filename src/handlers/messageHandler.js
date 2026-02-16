const { startCommand } = require('../commands/start');
const { adminCommand } = require('../commands/admin');
const { buyVoucher, recoverVoucher, myOrders, disclaimer, support } = require('../commands/user');
const { handleScreenshotUpload } = require('./paymentHandler');
const { getSetting } = require('../sheets/googleSheets');

let userState = {};

async function messageHandler(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    const botStatus = await getSetting('bot_status');
    if (botStatus === 'inactive' && userId.toString() !== process.env.ADMIN_ID) {
        return bot.sendMessage(chatId, '⚠️ Bot is under maintenance. Please try again later.');
    }
    
    if (msg.photo || (text && userState[userId]?.awaitingUtr)) {
        return handleScreenshotUpload(bot, msg);
    }
    
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
        case '↩️ Back to Menu':
        case '❌ Cancel':
        case '❌ Cancel Payment':
            return startCommand(bot, msg);
            
        case '📸 Send Screenshot':
            userState[userId] = { awaitingScreenshot: true };
            return bot.sendMessage(chatId, '📸 Please send the payment screenshot:', {
                reply_markup: { force_reply: true }
            });
            
        default:
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
