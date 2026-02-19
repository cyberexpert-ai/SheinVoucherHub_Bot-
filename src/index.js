const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { messageHandler } = require('./handlers/messageHandler');
const { callbackHandler } = require('./handlers/callbackHandler');
const { initDatabase, cleanupExpiredOrders } = require('./database/database');

dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Global variables
global.bot = bot;
global.adminMode = false;
global.adminChatId = null;

// Initialize database
initDatabase();

// Scheduled tasks - প্রতি ৬ ঘন্টা পর পুরনো অর্ডার ক্লিনআপ
cron.schedule('0 */6 * * *', () => {
    console.log('Running cleanup tasks...');
    const cleaned = cleanupExpiredOrders();
    console.log(`Cleaned ${cleaned} expired orders`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// ==================== Bot Message Handlers ====================

bot.on('message', async (msg) => {
    try {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const text = msg.text;

        // Admin bypass
        if (userId.toString() === process.env.ADMIN_ID) {
            return messageHandler(bot, msg);
        }

        // Check if blocked
        const { checkBlocked } = require('./middlewares/auth');
        if (checkBlocked(userId)) {
            const { getBlockedUsers } = require('./database/database');
            const blocked = getBlockedUsers().find(b => b.id === userId);
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

        messageHandler(bot, msg);
    } catch (error) {
        console.error('Error in message handler:', error);
    }
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
    try {
        const userId = callbackQuery.from.id;
        
        if (userId.toString() === process.env.ADMIN_ID) {
            return callbackHandler(bot, callbackQuery);
        }

        callbackHandler(bot, callbackQuery);
    } catch (error) {
        console.error('Error in callback handler:', error);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: Date.now(),
        uptime: process.uptime(),
        adminMode: global.adminMode
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

console.log('Bot started successfully!');
