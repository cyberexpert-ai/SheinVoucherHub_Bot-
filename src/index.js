const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('cron');

const database = require('./database/database');
const messageHandler = require('./handlers/messageHandler');
const callbackHandler = require('./handlers/callbackHandler');
const logger = require('./utils/logger');

dotenv.config();

const app = express();

// ===== Middleware =====
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Rate Limit =====
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/health', limiter);

// ===== Initialize Bot (NO POLLING) =====
const bot = new TelegramBot(process.env.BOT_TOKEN);

global.bot = bot;
global.db = database;

// ===== Basic Routes =====
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'Shein Voucher Hub Bot is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime()
    });
});

// ===== Webhook Setup =====
const WEBHOOK_URL = process.env.WEBHOOK_URL;

app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// ===== Bot Handlers =====
bot.on('message', async (msg) => {
    try {
        if (msg.chat.type === 'private') {
            await messageHandler.handleMessage(bot, msg);
        }
    } catch (error) {
        logger.error('Message handler error:', error);
    }
});

bot.on('callback_query', async (callbackQuery) => {
    try {
        await callbackHandler.handleCallback(bot, callbackQuery);
    } catch (error) {
        logger.error('Callback handler error:', error);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'An error occurred.',
            show_alert: false
        });
    }
});

// ===== Cron Jobs =====
const cleanupCron = new cron.CronJob('*/30 * * * *', async () => {
    try {
        await database.query(
            "UPDATE orders SET status = 'expired' WHERE recovery_expires < NOW() AND status = 'pending'"
        );

        await database.query(
            "UPDATE users SET is_blocked = FALSE, block_reason = NULL WHERE block_expires < NOW()"
        );

        logger.info('Cleanup completed');
    } catch (error) {
        logger.error('Cleanup error:', error);
    }
});
cleanupCron.start();

// ===== Start Server =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);

    if (WEBHOOK_URL) {
        await bot.setWebHook(`${WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`);
        logger.info('Webhook set successfully');
    } else {
        logger.error('WEBHOOK_URL not defined in environment variables');
    }
});

// ===== Graceful Shutdown =====
process.on('SIGINT', async () => {
    await bot.deleteWebHook();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await bot.deleteWebHook();
    process.exit(0);
});
