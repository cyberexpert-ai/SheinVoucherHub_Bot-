const { startCommand } = require('../commands/start');
const { adminCommand, handleAdminText } = require('../commands/admin');
const { 
    buyVouchers, myOrders, recoverVouchers, support, disclaimer 
} = require('../commands/user');
const { handleScreenshotUpload } = require('./paymentHandler');
const { getSetting } = require('../sheets/googleSheets');

let userState = {};

async function messageHandler(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    // Admin handler
    if (userId.toString() === process.env.ADMIN_ID) {
        if (text === '/admin') {
            return adminCommand(bot, msg);
        }
        const handled = await handleAdminText(bot, msg);
        if (handled) return;
    }
    
    // Check bot status
    const botStatus = await getSetting('bot_status');
    if (botStatus === 'inactive') {
        return bot.sendMessage(chatId, '⚠️ Bot is under maintenance.');
    }
    
    // Handle screenshot upload
    if (msg.photo || userState[userId]?.awaitingUtr) {
        return handleScreenshotUpload(bot, msg);
    }
    
    // Handle quantity input
    if (userState[userId]?.awaitingQty) {
        const qty = parseInt(text);
        const state = userState[userId];
        
        if (isNaN(qty) || qty < 1 || qty > parseInt(state.maxStock)) {
            return bot.sendMessage(chatId, `❌ Please enter a valid quantity (1-${state.maxStock}):`);
        }
        
        delete userState[userId].awaitingQty;
        const { selectQuantity } = require('../commands/user');
        return selectQuantity(bot, chatId, userId, qty.toString());
    }
    
    // Handle recovery input
    if (userState[userId]?.action === 'recovery') {
        delete userState[userId];
        return bot.sendMessage(chatId, '🔁 Recovery request sent to admin.');
    }
    
    // Handle main menu commands
    switch(text) {
        case '/start':
            return startCommand(bot, msg);
            
        case '🛒 Buy Vouchers':
            return buyVouchers(bot, msg);
            
        case '📦 My Orders':
            return myOrders(bot, msg);
            
        case '🔁 Recover Vouchers':
            return recoverVouchers(bot, msg);
            
        case '🆘 Support':
            return support(bot, msg);
            
        case '📜 Disclaimer':
            return disclaimer(bot, msg);
            
        case '🔙 Back':
            return startCommand(bot, msg);
            
        default:
            return bot.sendMessage(chatId, '❌ Invalid command. Please use the buttons below.', {
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
}

module.exports = { messageHandler };
