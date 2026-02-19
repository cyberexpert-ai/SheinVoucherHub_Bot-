const { startCommand } = require('../commands/start');
const { adminCommand, handleAdminText, isAdminMode } = require('../commands/admin');
const { 
    buyVouchers, myOrders, recoverVouchers, support, disclaimer,
    handleRecovery, handleScreenshot, userState
} = require('../commands/user');
const db = require('../database/database');

async function messageHandler(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    // ==================== ADMIN HANDLER ====================
    if (userId.toString() === process.env.ADMIN_ID) {
        if (text === '/admin') return adminCommand(bot, msg);
        
        const handled = await handleAdminText(bot, msg);
        if (handled) return;
        
        // Admin silent ignore
        return;
    }
    
    // ==================== CHECK BLOCKED ====================
    if (db.isUserBlocked(userId)) {
        const blocked = db.getBlockedUsers().find(b => b.id === userId);
        let msg = '⛔ **You are blocked!**\n';
        
        if (blocked?.expiresAt) {
            const expiry = new Date(blocked.expiresAt);
            msg += `\n**Reason:** ${blocked.reason}\n**Expires:** ${expiry.toLocaleString()}`;
        } else {
            msg += `\n**Reason:** ${blocked?.reason || 'Violation of rules'}`;
        }
        
        msg += `\n\nContact ${process.env.SUPPORT_BOT} for appeal.`;
        
        return bot.sendMessage(chatId, msg, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🆘 Contact Support', url: `https://t.me/${process.env.SUPPORT_BOT.replace('@', '')}` }]
                ]
            }
        });
    }
    
    // ==================== BOT STATUS ====================
    if (db.getBotStatus() !== 'active') {
        return bot.sendMessage(chatId, '⚠️ Bot is under maintenance. Please try again later.');
    }
    
    // ==================== USER STATE HANDLERS ====================
    
    // Handle screenshot upload
    if (msg.photo || userState[userId]?.step === 'awaiting_utr') {
        return handleScreenshot(bot, msg);
    }
    
    // Handle quantity input
    if (userState[userId]?.step === 'awaiting_qty') {
        const qty = parseInt(text);
        const state = userState[userId];
        
        if (isNaN(qty) || qty < 1 || qty > state.maxStock) {
            return bot.sendMessage(chatId, `❌ Please enter a valid quantity (1-${state.maxStock}):`);
        }
        
        delete userState[userId].step;
        const { selectQuantity } = require('../commands/user');
        return selectQuantity(bot, chatId, userId, qty.toString());
    }
    
    // Handle recovery input
    if (userState[userId]?.step === 'awaiting_recovery') {
        return handleRecovery(bot, msg);
    }
    
    // ==================== MAIN MENU COMMANDS ====================
    switch(text) {
        case '/start': return startCommand(bot, msg);
        case '🛒 Buy Vouchers': return buyVouchers(bot, msg);
        case '📦 My Orders': return myOrders(bot, msg);
        case '🔁 Recover Vouchers': return recoverVouchers(bot, msg);
        case '🆘 Support': return support(bot, msg);
        case '📜 Disclaimer': return disclaimer(bot, msg);
        case '🔙 Back': return startCommand(bot, msg);
        default: return; // Silent ignore
    }
}

module.exports = { messageHandler };
