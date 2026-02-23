require('dotenv').config();
const express = require("express");
const TelegramBot = require('node-telegram-bot-api');
const db = require('./database/db');
const { handleMessage } = require('./handlers/messageHandler');
const { handleCallback } = require('./handlers/callbackHandler');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Routes (Render/UptimeRobot)
app.get("/", (req, res) => res.status(200).send("Bot is running"));
app.get("/health", (req, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));

// Initialize Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Auto Initialize Database Tables
db.initDatabase();

// Route all incoming text/photos
bot.on('message', async (msg) => {
    await handleMessage(bot, msg);
});

// Route all button clicks
bot.on('callback_query', async (query) => {
    await handleCallback(bot, query);
});

console.log("🤖 SheinVoucherHub Bot is Online!");
