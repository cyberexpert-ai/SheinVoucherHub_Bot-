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
const paymentHandler = require('./handlers/paymentHandler');
const logger = require('./utils/logger');
const channelCheck = require('./middlewares/channelCheck');
const auth = require('./middlewares/auth');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/health', limiter);

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { 
    polling: true,
    filepath: false,
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

// Make bot accessible globally
global.bot = bot;
global.db = database;

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online',
        message: 'Shein Voucher Hub Bot is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Stats route (protected)
app.get('/stats', async (req, res) => {
    try {
        const stats = {
            users: await database.query('SELECT COUNT(*) as count FROM users'),
            orders: await database.query('SELECT COUNT(*) as count FROM orders'),
            pending: await database.query('SELECT COUNT(*) as count FROM orders WHERE status = "pending"'),
            revenue: await database.query('SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status = "completed"')
        };
        
        res.json({
            users: stats.users[0].count,
            orders: stats.orders[0].count,
            pending: stats.pending[0].count,
            revenue: stats.revenue[0].total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bot event handlers
bot.on('message', async (msg) => {
    try {
        // Auto delete old messages
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
            text: 'An error occurred. Please try again.',
            show_alert: false
        });
    }
});

bot.on('polling_error', (error) => {
    logger.error('Polling error:', error);
});

bot.on('webhook_error', (error) => {
    logger.error('Webhook error:', error);
});

// Start cron jobs
const statsCron = new cron.CronJob('0 0 * * *', async () => {
    // Daily at midnight
    try {
        await database.updateDailyStats();
        logger.info('Daily stats updated');
    } catch (error) {
        logger.error('Stats update error:', error);
    }
});
statsCron.start();

const cleanupCron = new cron.CronJob('*/30 * * * *', async () => {
    // Every 30 minutes
    try {
        // Clean up expired orders
        await database.query(
            'UPDATE orders SET status = "expired" WHERE recovery_expires < NOW() AND status = "pending"'
        );
        
        // Clean up expired blocks
        await database.query(
            'UPDATE users SET is_blocked = FALSE, block_reason = NULL WHERE block_expires < NOW()'
        );
        
        logger.info('Cleanup completed');
    } catch (error) {
        logger.error('Cleanup error:', error);
    }
});
cleanupCron.start();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
    logger.info('Shein Voucher Hub Bot is running');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT. Shutting down gracefully...');
    await bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM. Shutting down gracefully...');
    await bot.stopPolling();
    process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { bot, app };
