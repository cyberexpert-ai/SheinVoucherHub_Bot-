// src/commands/admin/index.js
const category = require('./category');
const voucher = require('./voucher');
const price = require('./price');
const userManage = require('./userManage');
const orderManage = require('./orderManage');
const broadcast = require('./broadcast');
const discount = require('./discount');
const stats = require('./stats');
const security = require('./security');

// This function registers all admin command handlers
function register(bot) {
  // Admin menu
  bot.command('admin', async (ctx) => {
    const adminId = parseInt(process.env.ADMIN_ID);
    if (ctx.from.id !== adminId) {
      return ctx.reply('⛔ Unauthorized access.');
    }
    
    const message = 
      "👑 *Admin Panel*\n\n" +
      "Select an option:";

    const keyboard = {
      inline_keyboard: [
        [ { text: '📊 Category Management', callback_data: 'admin_category' } ],
        [ { text: '🎟 Voucher Management', callback_data: 'admin_voucher' } ],
        [ { text: '💰 Price Management', callback_data: 'admin_price' } ],
        [ { text: '👥 User Management', callback_data: 'admin_users' } ],
        [ { text: '📦 Order Management', callback_data: 'admin_orders' } ],
        [ { text: '📢 Broadcast', callback_data: 'admin_broadcast' } ],
        [ { text: '🏷 Discount Codes', callback_data: 'admin_discount' } ],
        [ { text: '📈 Statistics', callback_data: 'admin_stats' } ],
        [ { text: '🔒 Security', callback_data: 'admin_security' } ]
      ]
    };

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  });

  // Register all admin callback handlers
  bot.action(/admin_category.*/, async (ctx) => {
    await category.handle(ctx);
  });

  bot.action(/admin_voucher.*/, async (ctx) => {
    await voucher.handle(ctx);
  });

  bot.action(/admin_price.*/, async (ctx) => {
    await price.handle(ctx);
  });

  bot.action(/admin_users.*/, async (ctx) => {
    await userManage.handle(ctx);
  });

  bot.action(/admin_orders.*/, async (ctx) => {
    await orderManage.handle(ctx);
  });

  bot.action(/admin_broadcast.*/, async (ctx) => {
    await broadcast.handle(ctx);
  });

  bot.action(/admin_discount.*/, async (ctx) => {
    await discount.handle(ctx);
  });

  bot.action(/admin_stats.*/, async (ctx) => {
    await stats.show(ctx);
  });

  bot.action(/admin_security.*/, async (ctx) => {
    await security.handle(ctx);
  });

  // Recovery actions
  bot.action(/admin_recovery_accept_(.+)/, async (ctx) => {
    const orderId = ctx.match[1];
    await orderManage.processRecoveryAccept(ctx, orderId);
  });

  bot.action(/admin_recovery_reject_(.+)/, async (ctx) => {
    const orderId = ctx.match[1];
    await orderManage.processRecoveryReject(ctx, orderId);
  });

  // Ticket actions
  bot.action(/admin_ticket_resolve_(.+)/, async (ctx) => {
    const ticketId = ctx.match[1];
    await userManage.resolveTicket(ctx, ticketId);
  });

  bot.action(/admin_ticket_block_(.+)/, async (ctx) => {
    const userId = ctx.match[1];
    await userManage.blockUserFromTicket(ctx, userId);
  });

  bot.action(/admin_ticket_reply_(.+)/, async (ctx) => {
    const ticketId = ctx.match[1];
    await userManage.replyToTicket(ctx, ticketId);
  });
  
  // Admin back button
  bot.action('admin_back', async (ctx) => {
    // Show admin menu again
    ctx.callbackQuery.data = 'admin';
    await ctx.telegram.callbackQueryHandler(ctx);
  });
}

// Make sure to export the register function
module.exports = { register };
