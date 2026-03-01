// src/index.js - FINAL WORKING VERSION

const express = require("express");
const { Telegraf } = require("telegraf");
const dotenv = require("dotenv");
const { Pool } = require("pg");

// Load environment variables
dotenv.config();

// Import modules
const { initDatabase } = require("./database/database");
const { channelCheck } = require("./middlewares/channelCheck");
const messageHandler = require("./handlers/messageHandler");
const callbackHandler = require("./handlers/callbackHandler");
const paymentHandler = require("./handlers/paymentHandler");
const logger = require("./utils/logger");
const { deleteOldMessage, saveUser } = require("./utils/helpers");

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/", (req, res) => {
  res.status(200).send("🤖 Shein Voucher Hub Bot is Running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    bot: "active"
  });
});

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize database
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Make bot and pool available globally
global.bot = bot;
global.pool = pool;
global.logger = logger;

// ============= IMPORT COMMAND MODULES =============
console.log("Loading command modules...");

const startCommand = require('./commands/start');
const adminCommands = require('./commands/admin');
const userCommands = require('./commands/user');

// Debug: Check what was loaded
console.log("=== DEBUG INFO ===");
console.log("startCommand type:", typeof startCommand);
console.log("startCommand keys:", Object.keys(startCommand));
console.log("adminCommands type:", typeof adminCommands);
console.log("adminCommands keys:", Object.keys(adminCommands));
console.log("userCommands type:", typeof userCommands);
console.log("userCommands keys:", Object.keys(userCommands));
console.log("==================");

// ============= MIDDLEWARES =============

// Save user middleware
bot.use(async (ctx, next) => {
  try {
    if (ctx.from) {
      await saveUser(ctx.from.id, ctx.from.username, ctx.from.first_name, ctx.from.last_name);
    }
    return next();
  } catch (error) {
    logger.error('Middleware error:', error);
    return next();
  }
});

// Channel check middleware (except for start command and admin)
bot.use(async (ctx, next) => {
  // Skip channel check for start command
  if (ctx.message?.text?.startsWith('/start')) {
    return next();
  }
  
  // Skip channel check for admin
  if (ctx.from && ctx.from.id.toString() === process.env.ADMIN_ID) {
    return next();
  }
  
  // Skip for callback queries (they will be checked in the handler)
  if (ctx.callbackQuery) {
    return next();
  }
  
  return channelCheck(ctx, next);
});

// Delete old message middleware
bot.use(async (ctx, next) => {
  if (ctx.chat && ctx.message) {
    await deleteOldMessage(ctx);
  }
  return next();
});

// ============= REGISTER COMMANDS =============

// Start command
bot.start(async (ctx) => {
  try {
    console.log("Start command received from user:", ctx.from.id);
    if (startCommand && typeof startCommand.startCommand === 'function') {
      await startCommand.startCommand(ctx);
    } else {
      console.error("startCommand.startCommand is not a function");
      await ctx.reply("Welcome! Please try again later.");
    }
  } catch (error) {
    console.error("Error in start command:", error);
    await ctx.reply("An error occurred. Please try again.");
  }
});

// Register admin commands
if (adminCommands && typeof adminCommands.register === 'function') {
  console.log("✅ Registering admin commands...");
  adminCommands.register(bot);
} else {
  console.error("❌ ERROR: adminCommands.register is not a function!");
  console.error("adminCommands =", adminCommands);
}

// Register user commands
if (userCommands && typeof userCommands.register === 'function') {
  console.log("✅ Registering user commands...");
  userCommands.register(bot);
} else {
  console.error("❌ ERROR: userCommands.register is not a function!");
  console.error("userCommands =", userCommands);
}

// ============= MESSAGE HANDLERS =============

// Handle text messages
bot.on('text', async (ctx) => {
  try {
    await messageHandler(ctx);
  } catch (error) {
    logger.error('Text handler error:', error);
  }
});

// Handle callback queries
bot.on('callback_query', async (ctx) => {
  try {
    await callbackHandler(ctx);
  } catch (error) {
    logger.error('Callback handler error:', error);
  }
});

// Handle photo messages (for payment screenshots)
bot.on('photo', async (ctx) => {
  try {
    await paymentHandler.handleScreenshot(ctx);
  } catch (error) {
    logger.error('Photo handler error:', error);
  }
});

// Error handler
bot.catch((err, ctx) => {
  logger.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later.').catch(e => {});
});

// ============= START BOT AND SERVER =============

async function startBot() {
  try {
    // Initialize database
    await initDatabase();
    logger.info('✅ Database initialized successfully');
    
    // Launch bot
    await bot.launch();
    logger.info('✅ Bot started successfully');
    
    // Start express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`✅ Server started on port ${PORT}`);
    });
    
    console.log("\n🎯 Bot is running successfully!");
    console.log("================================");
    
  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    console.error("Startup error:", error);
    process.exit(1);
  }
}

// Start everything
startBot();

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  pool.end();
  console.log("Bot stopped");
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  pool.end();
  console.log("Bot stopped");
});

module.exports = { bot, pool };
