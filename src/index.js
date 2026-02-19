const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { messageHandler } = require('./handlers/messageHandler');
const { callbackHandler } = require('./handlers/callbackHandler');

dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Store bot instance globally
global.bot = bot;

// Admin Mode State
global.adminMode = false;
global.adminChatId = null;

// ==================== Bot Message Handlers ====================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Admin bypass
    if (userId.toString() === process.env.ADMIN_ID) {
        return messageHandler(bot, msg);
    }

    // Check if blocked
    const { authMiddleware } = require('./middlewares/auth');
    const isBlocked = await authMiddleware.checkBlocked(userId);
    if (isBlocked) {
        return bot.sendMessage(chatId, '⛔ You are blocked. Contact @SheinVoucherHub');
    }

    // Check channel membership for non-start commands
    if (text !== '/start') {
        const { channelCheckMiddleware } = require('./middlewares/channelCheck');
        const isMember = await channelCheckMiddleware.checkChannels(bot, userId);
        if (!isMember) {
            return channelCheckMiddleware.sendJoinMessage(bot, chatId);
        }
    }

    messageHandler(bot, msg);
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
    const userId = callbackQuery.from.id;
    
    if (userId.toString() === process.env.ADMIN_ID) {
        return callbackHandler(bot, callbackQuery);
    }

    callbackHandler(bot, callbackQuery);
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
