const express = require("express");
const { Telegraf } = require("telegraf");
const dotenv = require("dotenv");
const { Pool } = require("pg");

// Load environment variables
dotenv.config();

// Import modules
const { initDatabase } = require("./database/database");
const { channelCheck } = require("./middlewares/channelCheck");
const { authMiddleware } = require("./middlewares/auth");
const messageHandler = require("./handlers/messageHandler");
const callbackHandler = require("./handlers/callbackHandler");
const paymentHandler = require("./handlers/paymentHandler");
const logger = require("./utils/logger");
const { deleteOldMessage } = require("./utils/helpers");

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

// Apply middlewares
bot.use(async (ctx, next) => {
  try {
    // Skip for callback queries (handled separately)
    if (ctx.callbackQuery) {
      return next();
    }
    
    // Check if user is blocked
    if (ctx.from) {
      const userCheck = await pool.query(
        'SELECT status, block_reason, block_expiry FROM users WHERE user_id = $1',
        [ctx.from.id]
      );
      
      if (userCheck.rows.length > 0) {
        const user = userCheck.rows[0];
        
        // Check if user is permanently blocked
        if (user.status === 'blocked_permanent') {
          await deleteOldMessage(ctx);
          return ctx.reply(
            "⛔ *Account Blocked*\n\n" +
            "Your account has been permanently blocked.\n" +
            `Reason: ${user.block_reason || "Violation of terms"}\n\n` +
            "Contact support for more information.",
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🆘 Contact Support", url: "https://t.me/SheinSupportRobot" }]
                ]
              }
            }
          );
        }
        
        // Check if user is temporarily blocked
        if (user.status === 'blocked_temp' && user.block_expiry) {
          const now = new Date();
          if (new Date(user.block_expiry) > now) {
            const expiryTime = new Date(user.block_expiry).toLocaleString();
            await deleteOldMessage(ctx);
            return ctx.reply(
              "⏳ *Temporary Restriction*\n\n" +
              `You are temporarily restricted until: ${expiryTime}\n` +
              `Reason: ${user.block_reason || "Suspicious activity"}\n\n` +
              "Contact support if you believe this is a mistake.",
              {
                parse_mode: "Markdown",
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "🆘 Contact Support", url: "https://t.me/SheinSupportRobot" }]
                  ]
                }
              }
            );
          } else {
            // Unblock user if expiry passed
            await pool.query(
              'UPDATE users SET status = $1, block_reason = NULL, block_expiry = NULL WHERE user_id = $2',
              ['active', ctx.from.id]
            );
          }
        }
      }
    }
    
    return next();
  } catch (error) {
    logger.error('Middleware error:', error);
    return next();
  }
});

// Apply channel check middleware (except for callbacks)
bot.use(async (ctx, next) => {
  if (ctx.callbackQuery) return next();
  if (ctx.message?.text?.startsWith('/')) {
    return channelCheck(ctx, next);
  }
  return next();
});

// Delete old message middleware
bot.use(async (ctx, next) => {
  if (ctx.chat && ctx.message) {
    await deleteOldMessage(ctx);
  }
  return next();
});

// Register command handlers
bot.start(async (ctx) => {
  const { startCommand } = require('./commands/start');
  await startCommand(ctx);
});

// Admin commands
const adminCommands = require('./commands/admin');
adminCommands.register(bot);

// User commands
const userCommands = require('./commands/user');
userCommands.register(bot);

// Handle messages
bot.on('text', async (ctx) => {
  await messageHandler(ctx);
});

// Handle callback queries
bot.on('callback_query', async (ctx) => {
  await callbackHandler(ctx);
});

// Handle photo messages (for payment screenshots)
bot.on('photo', async (ctx) => {
  await paymentHandler.handleScreenshot(ctx);
});

// Handle document messages
bot.on('document', async (ctx) => {
  await paymentHandler.handleDocument(ctx);
});

// Error handler
bot.catch((err, ctx) => {
  logger.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later.').catch(e => {});
});

// Initialize database and start bot
async function startBot() {
  try {
    // Initialize database tables
    await initDatabase();
    logger.info('Database initialized successfully');
    
    // Launch bot
    await bot.launch();
    logger.info('Bot started successfully');
    
    // Start express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
    });
    
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

startBot();

// Enable graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  pool.end();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  pool.end();
});

module.exports = { bot, pool };
