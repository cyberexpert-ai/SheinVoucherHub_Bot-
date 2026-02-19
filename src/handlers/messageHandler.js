const { startCommand } = require('../commands/start');
const { adminCommand, handleAdminText } = require('../commands/admin');
const { 
    buyVouchers, myOrders, recoverVouchers, support, disclaimer 
} = require('../commands/user');
const db = require('../database/database');

let userState = {};

async function messageHandler(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    // অ্যাডমিন
    if (userId.toString() === process.env.ADMIN_ID) {
        if (text === '/admin') return adminCommand(bot, msg);
        
        const handled = await handleAdminText(bot, msg);
        if (handled) return;
        
        console.log(`Admin: ${text} - ignored`);
        return;
    }
    
    // বট স্ট্যাটাস
    if (db.getBotStatus() !== 'active') {
        return bot.sendMessage(chatId, '⚠️ Maintenance mode.');
    }
    
    // ইউজার ইনপুট
    if (userState[userId]?.awaitingQty) {
        const qty = parseInt(text);
        const state = userState[userId];
        
        if (isNaN(qty) || qty < 1 || qty > state.maxStock) {
            return bot.sendMessage(chatId, `❌ Valid: 1-${state.maxStock}`);
        }
        
        delete userState[userId].awaitingQty;
        const { selectQuantity } = require('../commands/user');
        return selectQuantity(bot, chatId, userId, qty.toString());
    }
    
    if (userState[userId]?.action === 'recovery') {
        delete userState[userId];
        return bot.sendMessage(chatId, '🔁 Request sent.');
    }
    
    // মেনু কমান্ড
    switch(text) {
        case '/start': return startCommand(bot, msg);
        case '🛒 Buy Vouchers': return buyVouchers(bot, msg);
        case '📦 My Orders': return myOrders(bot, msg);
        case '🔁 Recover Vouchers': return recoverVouchers(bot, msg);
        case '🆘 Support': return support(bot, msg);
        case '📜 Disclaimer': return disclaimer(bot, msg);
        case '🔙 Back': return startCommand(bot, msg);
        default: return; // কিছু দেখায় না
    }
}

module.exports = { messageHandler };
