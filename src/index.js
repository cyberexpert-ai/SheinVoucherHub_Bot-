const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { messageHandler } = require('./handlers/messageHandler');
const { callbackHandler } = require('./handlers/callbackHandler');
const { initDatabase } = require('./database/database');

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

// Scheduled tasks
cron.schedule('*/30 * * * *', () => {
    console.log('Running cleanup tasks...');
});

// Message handler
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Admin bypass
    if (userId.toString() === process.env.ADMIN_ID) {
        return messageHandler(bot, msg);
    }

    // Check if blocked
    const { isUserBlocked } = require('./database/database');
    if (isUserBlocked(userId)) {
        return bot.sendMessage(chatId, '⛔ You are blocked. Contact @SheinVoucherHub');
    }

    messageHandler(bot, msg);
});

// Callback handler
bot.on('callback_query', async (callbackQuery) => {
    const userId = callbackQuery.from.id;
    
    if (userId.toString() === process.env.ADMIN_ID) {
        return callbackHandler(bot, callbackQuery);
    }

    callbackHandler(bot, callbackQuery);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

console.log('Bot started successfully!');
