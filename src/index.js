const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const { setupDatabase } = require('./config/database');
const { setupGoogleSheets } = require('./sheets/googleSheets');
const { messageHandler } = require('./handlers/messageHandler');
const { callbackHandler } = require('./handlers/callbackHandler');
const { authMiddleware } = require('./middlewares/auth');
const { channelCheckMiddleware } = require('./middlewares/channelCheck');

dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const app = express();

// Store bot instance globally
global.bot = bot;

// Initialize database and sheets
setupDatabase();
setupGoogleSheets();

// Middleware for all messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Admin bypass for all checks
    if (userId.toString() === process.env.ADMIN_ID) {
        return messageHandler(bot, msg);
    }

    // Check if user is blocked
    const isBlocked = await authMiddleware.checkBlocked(userId);
    if (isBlocked) {
        return bot.sendMessage(chatId, '⛔ You are blocked from using this bot.\nContact @SheinVoucherHub for support.', {
            reply_markup: {
                keyboard: [['🆘 Support']],
                resize_keyboard: true
            }
        });
    }

    // Check channel membership
    const isMember = await channelCheckMiddleware.checkChannels(bot, userId);
    if (!isMember && text !== '/start') {
        return channelCheckMiddleware.sendJoinMessage(bot, chatId);
    }

    // Check captcha verification
    const isVerified = await authMiddleware.checkVerified(userId);
    if (!isVerified && text !== '/start') {
        return authMiddleware.sendCaptcha(bot, chatId, userId);
    }

    messageHandler(bot, msg);
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
    const userId = callbackQuery.from.id;
    
    if (userId.toString() === process.env.ADMIN_ID) {
        return callbackHandler(bot, callbackQuery);
    }

    const isBlocked = await authMiddleware.checkBlocked(userId);
    if (isBlocked) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: 'You are blocked!' });
    }

    const isMember = await channelCheckMiddleware.checkChannels(bot, userId);
    if (!isMember) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: 'Join channels first!' });
    }

    const isVerified = await authMiddleware.checkVerified(userId);
    if (!isVerified) {
        return authMiddleware.sendCaptcha(bot, userId, userId);
    }

    callbackHandler(bot, callbackQuery);
});

// Start express server for Render
app.get('/', (req, res) => {
    res.send('Shein Voucher Hub Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

console.log('Bot started successfully!');
