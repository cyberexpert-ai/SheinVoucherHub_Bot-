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
    
    // ==================== ADMIN HANDLER ====================
    if (userId.toString() === process.env.ADMIN_ID) {
        // Check if admin is in input mode
        const { adminState } = require('../commands/admin');
        
        if (adminState[chatId]) {
            const { handleAdminInput } = require('../commands/admin');
            const handled = await handleAdminInput(bot, msg);
            if (handled) return;
        }
        
        if (text === '/admin') {
            return adminCommand(bot, msg);
        }
        
        const { handleAdminText } = require('../commands/admin');
        const handled = await handleAdminText(bot, msg);
        if (handled) return;
        
        // ✅ ERROR DELETED - Admin panel-এ কিছু দেখানো হবে না
        console.log(`Admin typed: ${text} - silently ignored`);
        return;
    }
    
    // ==================== BOT STATUS CHECK ====================
    const botStatus = await getSetting('bot_status');
    if (botStatus === 'inactive') {
        return bot.sendMessage(chatId, '⚠️ Bot is under maintenanc     e. Please try again later.');
    }
    
    // ==================== USER STATE HANDLERS ====================
    
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
    
    // ==================== MAIN MENU COMMANDS ====================
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
            
        case '🔙 Back to Main Menu':
        case '🔙 Back':
            return startCommand(bot, msg);
            
        default:
            // ✅ ERROR COMPLETELY DELETED - কিছু দেখানো হবে না
            // ইউজার যা ইচ্ছা টাইপ করুক, কিছু রেসপন্ড করবে না
            console.log(`User ${userId} typed: ${text} - silently ignored`);
            return;
    }
}

module.exports = { messageHandler };
