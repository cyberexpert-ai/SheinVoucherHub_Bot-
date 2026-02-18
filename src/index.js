const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const { setupGoogleSheets } = require('./sheets/googleSheets');
const { messageHandler } = require('./handlers/messageHandler');
const { callbackHandler } = require('./handlers/callbackHandler');
const { paymentHandler } = require('./handlers/paymentHandler');
const { adminHandler } = require('./handlers/adminHandler');

dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

global.bot = bot;
global.razorpay = razorpay;

// Initialize Google Sheets
setupGoogleSheets();

// API Routes
app.post('/api/verify-payment', async (req, res) => {
    const { orderId, paymentId, signature } = req.body;
    // Payment verification logic
    res.json({ success: true });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Bot message handlers
bot.on('message', async (msg) => {
    await messageHandler(bot, msg);
});

bot.on('callback_query', async (callbackQuery) => {
    await callbackHandler(bot, callbackQuery);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

console.log('Bot started successfully!');
