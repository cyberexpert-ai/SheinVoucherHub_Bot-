const { Telegraf, Markup, session } = require('telegraf');
const express = require('express');
require('dotenv').config();

const db = require('./database/database');
const channelCheck = require('./middlewares/channelCheck');
const auth = require('./middlewares/auth');
const messageHandler = require('./handlers/messageHandler');
const callbackHandler = require('./handlers/callbackHandler');
const paymentHandler = require('./handlers/paymentHandler');

// Import commands
const startCommand = require('./commands/start');
const adminCommand = require('./commands/admin');
const userCommands = require('./commands/user');

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
  res.status(200).send(`
    <h1>🤖 SheinVoucherHub Bot</h1>
    <p>Status: <span style="color: green; font-weight: bold;">RUNNING</span></p>
    <p>Version: 1.0.0</p>
    <p>Last Updated: ${new Date().toLocaleString()}</p>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    bot: 'running'
  });
});

// Database check
app.get('/db-check', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'Database connected' });
  } catch (error) {
    res.status(500).json({ status: 'Database error', error: error.message });
  }
});

// Stats endpoint
app.get('/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to check channel membership for all commands except /start
bot.use(async (ctx, next) => {
  // Skip for /start command and verify callbacks
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
  console.log('Bot Username:', bot.botInfo?.username);
  console.log('Admin ID:', process.env.ADMIN_ID);
  
  // Start cleanup cron jobs
  setInterval(async () => {
    await db.expireOldOrders();
    await db.cleanupExpiredRecoveries();
    console.log('🧹 Cleanup completed at', new Date().toLocaleString());
  }, 5 * 60 * 1000); // Every 5 minutes
});

// Start express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('👋 Bot stopping...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('👋 Bot stopping...');
  bot.stop('SIGTERM');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
