const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const { initDatabase } = require("./database/database");
const { channelCheck } = require("./middlewares/channelCheck");
const messageHandler = require("./handlers/messageHandler");
const callbackHandler = require("./handlers/callbackHandler");
const paymentHandler = require("./handlers/paymentHandler");

dotenv.config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store bot instance globally
global.bot = bot;

// Initialize Database
initDatabase().then(() => {
    console.log("✅ Database connected");
});

// Channel Check Middleware for all messages
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Skip channel check for admin
    if (userId.toString() === process.env.ADMIN_ID) {
        await messageHandler(bot, msg);
        return;
    }

    // Check channel membership
    const isMember = await channelCheck(bot, userId);
    if (!isMember) {
        const joinKeyboard = {
            inline_keyboard: [
                [{ text: "📢 Join Channel 1", url: "https://t.me/SheinVoucherHub" }],
                [{ text: "📢 Join Channel 2", url: "https://t.me/OrdersNotify" }],
                [{ text: "✅ Verify Join", callback_data: "verify_join" }]
            ]
        };
        
        await bot.sendMessage(chatId, 
            "🔒 *Access Restricted*\n\nYou must join both channels to use this bot:\n\n1️⃣ @SheinVoucherHub\n2️⃣ @OrdersNotify\n\nClick Verify after joining.",
            { 
                parse_mode: "Markdown",
                reply_markup: joinKeyboard 
            }
        );
        return;
    }

    await messageHandler(bot, msg);
});

// Callback Query Handler
bot.on("callback_query", async (callbackQuery) => {
    const userId = callbackQuery.from.id;
    
    // Check channel membership for non-admin
    if (userId.toString() !== process.env.ADMIN_ID) {
        const isMember = await channelCheck(bot, userId);
        if (!isMember) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: "❌ Please join both channels first!",
                show_alert: true
            });
            return;
        }
    }
    
    await callbackHandler(bot, callbackQuery);
});

// Payment Handler (for photo messages)
bot.on("photo", async (msg) => {
    await paymentHandler(bot, msg);
});

// Root Route
app.get("/", (req, res) => {
    res.status(200).send("🤖 SheinVoucherHub Bot is running");
});

// Health Route
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});

console.log("🤖 Bot is starting...");
