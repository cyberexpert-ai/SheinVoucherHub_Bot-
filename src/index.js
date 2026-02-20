const { Telegraf, Markup, session } = require('telegraf');
const express = require('express');
require('dotenv').config();

const db = require('./database/database');
const channelCheck = require('./middlewares/channelCheck');
const auth = require('./middlewares/auth');
const messageHandler = require('./handlers/messageHandler');
const callbackHandler = require('./handlers/callbackHandler');
const paymentHandler = require('./handlers/paymentHandler');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Session middleware
bot.use(session());

// Express server for uptime
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.status(200).send('🤖 SheinVoucherHub Bot is running');
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Middleware to check channel membership for all commands except /start
bot.use(async (ctx, next) => {
  if (ctx.message?.text === '/start' || ctx.callbackQuery?.data?.startsWith('verify_')) {
    return next();
  }
  
  // Check if user is blocked
  const isBlocked = await db.isUserBlocked(ctx.from.id);
  if (isBlocked) {
    const user = await db.getUser(ctx.from.id);
    let blockMsg = '🚫 You are blocked from using this bot.\n\n';
    if (user?.block_reason) {
      blockMsg += `Reason: ${user.block_reason}\n`;
    }
    if (user?.block_until) {
      blockMsg += `Until: ${new Date(user.block_until).toLocaleString()}\n`;
    }
    blockMsg += '\nContact support: @SheinSupportRobot';
    
    return ctx.reply(blockMsg, {
      reply_markup: {
        keyboard: [[{ text: '🆘 Support' }]],
        resize_keyboard: true
      }
    });
  }
  
  return channelCheck(ctx, next);
});

// Import command modules
const startCommand = require('./commands/start');
const adminCommand = require('./commands/admin');
const userCommands = require('./commands/user');

// Register commands
bot.start(startCommand);
bot.command('admin', adminCommand);

// Register user command handlers
bot.hears('🛒 Buy Voucher', userCommands.buyVoucher);
bot.hears('🔁 Recover Vouchers', userCommands.recoverVoucher);
bot.hears('📦 My Orders', userCommands.myOrders);
bot.hears('📜 Disclaimer', userCommands.disclaimer);
bot.hears('🆘 Support', userCommands.support);
bot.hears('↩️ Back', userCommands.back);
bot.hears('⬅️ Leave', userCommands.leave);

// Handle callback queries
bot.on('callback_query', callbackHandler);

// Handle photo messages (payment screenshots)
bot.on('photo', paymentHandler.handleScreenshot);

// Handle text messages
bot.on('text', messageHandler);

// Handle errors
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later.').catch(() => {});
});

// Start bot
bot.launch().then(() => {
  console.log('🤖 Bot is running...');
  
  // Start cleanup cron jobs
  setInterval(async () => {
    await db.expireOldOrders();
    await db.cleanupExpiredRecoveries();
  }, 5 * 60 * 1000); // Every 5 minutes
});

// Start express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
