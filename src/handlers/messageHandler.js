const { startCommand } = require('../commands/start');
const { adminCommand, handleAdminText } = require('../commands/admin');
const userCommands = require('../commands/user');
const paymentHandler = require('./paymentHandler');
const db = require('../database/database');

let userState = userCommands.userState;

async function messageHandler(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    // ==================== ADMIN HANDLER ====================
    if (userId.toString() === process.env.ADMIN_ID) {
        if (text === '/admin') return adminCommand(bot, msg);
        
        const handled = await handleAdminText(bot, msg);
        if (handled) return;
        
        return;
    }
    
    // ==================== CHECK BLOCKED ====================
    if (db.isUserBlocked(userId)) {
        const blocked = db.getBlockedUsers().find(b => b.id === userId);
        let msgText = '⛔ **You are blocked!**\n';
        
        if (blocked?.expiresAt) {
            const expiry = new Date(blocked.expiresAt);
            msgText += `\n**Reason:** ${blocked.reason}\n**Expires:** ${expiry.toLocaleString()}`;
        } else {
            msgText += `\n**Reason:** ${blocked?.reason || 'Violation of rules'}`;
        }
        
        msgText += `\n\nContact ${process.env.SUPPORT_BOT} for appeal.`;
        
        return bot.sendMessage(chatId, msgText, {
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
        return userCommands.handleCustomQuantity(bot, chatId, userId, text);
    }
    
    // Handle recovery input
    if (userState[userId]?.step === 'awaiting_recovery') {
        return userCommands.handleRecovery(bot, msg);
    }
    
    // ==================== MAIN MENU COMMANDS ====================
    switch(text) {
        case '/start': return startCommand(bot, msg);
        case '🛒 Buy Vouchers': return userCommands.buyVouchers(bot, msg);
        case '📦 My Orders': return userCommands.myOrders(bot, msg);
        case '🔁 Recover Vouchers': return userCommands.recoverVouchers(bot, msg);
        case '🆘 Support': return userCommands.support(bot, msg);
        case '📜 Disclaimer': return userCommands.disclaimer(bot, msg);
        case '← Back to Menu':
        case '← Back':
            return startCommand(bot, msg);
        default: return;
    }
}

// ==================== SCREENSHOT HANDLER ====================
async function handleScreenshot(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    console.log('handleScreenshot called with step:', userState[userId]?.step);
    
    // যদি ফটো আসে
    if (msg.photo) {
        console.log('Photo received');
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        
        userState[userId] = {
            ...userState[userId],
            screenshot: fileId,
            step: 'awaiting_utr'
        };
        
        await bot.sendMessage(chatId, '📝 **Enter UTR/Transaction ID**\n\nExample: `UTR123456789`', {
            parse_mode: 'Markdown',
            reply_markup: { force_reply: true }
        });
        return;
    }
    
    // যদি UTR এর জন্য অপেক্ষা করছে
    if (userState[userId]?.step === 'awaiting_utr') {
        console.log('Awaiting UTR, received text:', text);
        const state = userState[userId];
        
        // যদি ইউজার /start দেয়
        if (text === '/start') {
            console.log('User sent /start, clearing state');
            delete userState[userId];
            const { startCommand } = require('../commands/start');
            return startCommand(bot, msg);
        }
        
        // যদি ইউজার ব্যাক বলে
        if (text === '← Back' || text === '← Back to Menu' || text === 'Back' || text === 'back') {
            console.log('User sent back command, clearing state');
            delete userState[userId];
            const { startCommand } = require('../commands/start');
            return startCommand(bot, msg);
        }
        
        // UTR প্রসেস করুন
        const utr = text.trim().toUpperCase();
        
        if (!state || !state.orderId) {
            console.error('No orderId in state:', state);
            delete userState[userId];
            return bot.sendMessage(chatId, '❌ **Error: Order not found!** Please start over.', {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [['← Back to Menu']],
                    resize_keyboard: true
                }
            });
        }
        
        const result = await paymentHandler.processUTR(utr, state.orderId, userId, state.screenshot, bot, chatId, state);
        
        if (!result.success) {
            return bot.sendMessage(chatId, result.message, {
                parse_mode: 'Markdown',
                reply_markup: { force_reply: true }
            });
        }
        
        await bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
        
        await paymentHandler.notifyAdmin(bot, state.orderId, userId, result.utr, state.screenshot);
        
        delete userState[userId];
        
        setTimeout(async () => {
            const { startCommand } = require('../commands/start');
            await startCommand(bot, { chat: { id: chatId }, from: { id: userId } });
        }, 5000);
        
        return;
    }
}

module.exports = { messageHandler };
