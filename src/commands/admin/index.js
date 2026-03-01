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

function register(bot) {
  // Admin menu command
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
  bot.action('admin_category', async (ctx) => {
    await category.showCategoryMenu(ctx);
  });

  bot.action('admin_voucher', async (ctx) => {
    await voucher.showVoucherMenu(ctx);
  });

  bot.action('admin_price', async (ctx) => {
    await price.showPriceMenu(ctx);
  });

  bot.action('admin_users', async (ctx) => {
    await userManage.showUserMenu(ctx);
  });

  bot.action('admin_orders', async (ctx) => {
    await orderManage.showOrdersMenu(ctx);
  });

  bot.action('admin_broadcast', async (ctx) => {
    await broadcast.showBroadcastMenu(ctx);
  });

  bot.action('admin_discount', async (ctx) => {
    await discount.showDiscountMenu(ctx);
  });

  bot.action('admin_stats', async (ctx) => {
    await stats.show(ctx);
  });

  bot.action('admin_security', async (ctx) => {
    await security.showSecurityMenu(ctx);
  });

  // Category management actions
  bot.action(/admin_category_add/, async (ctx) => {
    await category.addCategory(ctx);
  });

  bot.action(/admin_category_delete_(.+)/, async (ctx) => {
    const categoryId = ctx.match[1];
    await category.deleteCategory(ctx, categoryId);
  });

  bot.action(/admin_category_edit_(.+)/, async (ctx) => {
    const categoryId = ctx.match[1];
    await category.editCategory(ctx, categoryId);
  });

  // Voucher management actions
  bot.action(/admin_voucher_add_(.+)/, async (ctx) => {
    const categoryId = ctx.match[1];
    await voucher.addVoucher(ctx, categoryId);
  });

  bot.action(/admin_voucher_bulk_(.+)/, async (ctx) => {
    const categoryId = ctx.match[1];
    await voucher.bulkAddVouchers(ctx, categoryId);
  });

  bot.action(/admin_voucher_category_(.+)/, async (ctx) => {
    const categoryId = ctx.match[1];
    await voucher.showCategoryVouchers(ctx, categoryId);
  });

  // Order management actions
  bot.action(/admin_order_view_(.+)/, async (ctx) => {
    const orderId = ctx.match[1];
    await orderManage.viewOrder(ctx, orderId);
  });

  bot.action(/admin_order_accept_(.+)/, async (ctx) => {
    const orderId = ctx.match[1];
    await orderManage.acceptOrder(ctx, orderId);
  });

  bot.action(/admin_order_reject_(.+)/, async (ctx) => {
    const orderId = ctx.match[1];
    await orderManage.rejectOrder(ctx, orderId);
  });

  // User management actions
  bot.action(/admin_user_view_(.+)/, async (ctx) => {
    const userId = ctx.match[1];
    await userManage.viewUser(ctx, userId);
  });

  bot.action(/admin_user_block_(.+)/, async (ctx) => {
    const userId = ctx.match[1];
    await userManage.blockUser(ctx, userId);
  });

  bot.action(/admin_user_unblock_(.+)/, async (ctx) => {
    const userId = ctx.match[1];
    await userManage.unblockUser(ctx, userId);
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
    // Show admin menu again by calling the command
    ctx.callbackQuery.data = 'admin';
    // Trigger the admin command
    await bot.telegram.sendMessage(ctx.from.id, "👑 *Admin Panel*\n\nSelect an option:", {
      parse_mode: 'Markdown',
      reply_markup: {
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
      }
    });
  });
}

module.exports = { register };
