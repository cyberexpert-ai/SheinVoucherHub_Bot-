const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { initDatabase } = require('./database/database');
const logger = require('./utils/logger');
const { handleMessage } = require('./handlers/messageHandler');
const { handleCallback } = require('./handlers/callbackHandler');
const { handlePayment } = require('./handlers/paymentHandler');

// Initialize Express app for health checks
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/', (req, res) => {
  res.status(200).send('🤖 Shein Voucher Hub Bot is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { 
  polling: true,
  filepath: false
});

// Store bot instance globally
global.bot = bot;

// Initialize Database
initDatabase().then(() => {
  logger.info('Database initialized successfully');
}).catch(err => {
  logger.error('Database initialization failed:', err);
  process.exit(1);
});

// Middleware for logging
bot.on('message', (msg) => {
  logger.info(`Received message from ${msg.from.id}: ${msg.text}`);
});

// Message handler
bot.on('message', async (msg) => {
  try {
    await handleMessage(msg);
  } catch (error) {
    logger.error('Error in message handler:', error);
    await bot.sendMessage(msg.chat.id, '❌ An error occurred. Please try again later.');
  }
});

// Callback query handler
bot.on('callback_query', async (callbackQuery) => {
  try {
    await handleCallback(callbackQuery);
  } catch (error) {
    logger.error('Error in callback handler:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ An error occurred',
      show_alert: true
    });
  }
});

// Payment handler (for photos/documents)
bot.on('photo', async (msg) => {
  try {
    await handlePayment(msg);
  } catch (error) {
    logger.error('Error in payment handler:', error);
    await bot.sendMessage(msg.chat.id, '❌ Error processing payment. Please try again.');
  }
});

// Error handling
bot.on('polling_error', (error) => {
  logger.error('Polling error:', error);
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});

logger.info('🤖 Shein Voucher Hub Bot is running...');
