// src/commands/admin/index.js - FINAL WORKING VERSION

// প্রয়োজনীয় modules import করুন
const category = require('./category');
const voucher = require('./voucher');
const userManage = require('./userManage');
const orderManage = require('./orderManage');
const broadcast = require('./broadcast');
const stats = require('./stats');

// register function - এটি export করতে হবে
function register(bot) {
  console.log("✅ Admin commands registered successfully");
  
  // Admin command - /admin
  bot.command('admin', async (ctx) => {
    const adminId = parseInt(process.env.ADMIN_ID);
    if (ctx.from.id !== adminId) {
      return ctx.reply('⛔ Unauthorized access.');
    }
    
    const message = "👑 *Admin Panel*\n\nSelect an option:";
    const keyboard = {
      inline_keyboard: [
        [{ text: '📊 Category Management', callback_data: 'admin_category' }],
        [{ text: '🎟 Voucher Management', callback_data: 'admin_voucher' }],
        [{ text: '👥 User Management', callback_data: 'admin_users' }],
        [{ text: '📦 Order Management', callback_data: 'admin_orders' }],
        [{ text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
        [{ text: '📈 Statistics', callback_data: 'admin_stats' }]
      ]
    };
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  });

  // ==================== CATEGORY MANAGEMENT ====================
  bot.action('admin_category', async (ctx) => {
    try {
      if (category && typeof category.showCategories === 'function') {
        await category.showCategories(ctx);
      } else {
        await ctx.reply('❌ Category function not available');
        console.error('category.showCategories is not a function');
      }
    } catch (error) {
      console.error('Error in admin_category:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action('admin_category_add', async (ctx) => {
    try {
      if (category && typeof category.addCategory === 'function') {
        await category.addCategory(ctx);
      } else {
        await ctx.reply('❌ Category function not available');
      }
    } catch (error) {
      console.error('Error in admin_category_add:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action(/admin_category_delete_(.+)/, async (ctx) => {
    try {
      const categoryId = ctx.match[1];
      if (category && typeof category.deleteCategory === 'function') {
        await category.deleteCategory(ctx, categoryId);
      } else {
        await ctx.reply('❌ Category function not available');
      }
    } catch (error) {
      console.error('Error in admin_category_delete:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action(/admin_category_edit_(.+)/, async (ctx) => {
    try {
      const categoryId = ctx.match[1];
      if (category && typeof category.editCategory === 'function') {
        await category.editCategory(ctx, categoryId);
      } else {
        await ctx.reply('❌ Category function not available');
      }
    } catch (error) {
      console.error('Error in admin_category_edit:', error);
      await ctx.reply('An error occurred');
    }
  });

  // ==================== VOUCHER MANAGEMENT ====================
  bot.action('admin_voucher', async (ctx) => {
    try {
      if (voucher && typeof voucher.showVoucherMenu === 'function') {
        await voucher.showVoucherMenu(ctx);
      } else {
        await ctx.reply('❌ Voucher function not available');
        console.error('voucher.showVoucherMenu is not a function');
      }
    } catch (error) {
      console.error('Error in admin_voucher:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action(/admin_voucher_add_(.+)/, async (ctx) => {
    try {
      const categoryId = ctx.match[1];
      if (voucher && typeof voucher.addVoucher === 'function') {
        await voucher.addVoucher(ctx, categoryId);
      } else {
        await ctx.reply('❌ Voucher function not available');
      }
    } catch (error) {
      console.error('Error in admin_voucher_add:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action(/admin_voucher_bulk_(.+)/, async (ctx) => {
    try {
      const categoryId = ctx.match[1];
      if (voucher && typeof voucher.bulkAddVouchers === 'function') {
        await voucher.bulkAddVouchers(ctx, categoryId);
      } else {
        await ctx.reply('❌ Voucher function not available');
      }
    } catch (error) {
      console.error('Error in admin_voucher_bulk:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action(/admin_voucher_category_(.+)/, async (ctx) => {
    try {
      const categoryId = ctx.match[1];
      if (voucher && typeof voucher.showCategoryVouchers === 'function') {
        await voucher.showCategoryVouchers(ctx, categoryId);
      } else {
        await ctx.reply('❌ Voucher function not available');
      }
    } catch (error) {
      console.error('Error in admin_voucher_category:', error);
      await ctx.reply('An error occurred');
    }
  });

  // ==================== USER MANAGEMENT ====================
  bot.action('admin_users', async (ctx) => {
    try {
      if (userManage && typeof userManage.showUserMenu === 'function') {
        await userManage.showUserMenu(ctx);
      } else {
        await ctx.reply('❌ User management function not available');
        console.error('userManage.showUserMenu is not a function');
      }
    } catch (error) {
      console.error('Error in admin_users:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action(/admin_user_view_(.+)/, async (ctx) => {
    try {
      const userId = ctx.match[1];
      if (userManage && typeof userManage.viewUser === 'function') {
        await userManage.viewUser(ctx, userId);
      } else {
        await ctx.reply('❌ User function not available');
      }
    } catch (error) {
      console.error('Error in admin_user_view:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action(/admin_user_block_(.+)/, async (ctx) => {
    try {
      const userId = ctx.match[1];
      if (userManage && typeof userManage.blockUser === 'function') {
        await userManage.blockUser(ctx, userId);
      } else {
        await ctx.reply('❌ User function not available');
      }
    } catch (error) {
      console.error('Error in admin_user_block:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action(/admin_user_unblock_(.+)/, async (ctx) => {
    try {
      const userId = ctx.match[1];
      if (userManage && typeof userManage.unblockUser === 'function') {
        await userManage.unblockUser(ctx, userId);
      } else {
        await ctx.reply('❌ User function not available');
      }
    } catch (error) {
      console.error('Error in admin_user_unblock:', error);
      await ctx.reply('An error occurred');
    }
  });

  // ==================== ORDER MANAGEMENT ====================
  bot.action('admin_orders', async (ctx) => {
    try {
      if (orderManage && typeof orderManage.showOrders === 'function') {
        await orderManage.showOrders(ctx);
      } else {
        await ctx.reply('❌ Order management function not available');
        console.error('orderManage.showOrders is not a function');
      }
    } catch (error) {
      console.error('Error in admin_orders:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action(/admin_order_accept_(.+)/, async (ctx) => {
    try {
      const orderId = ctx.match[1];
      if (orderManage && typeof orderManage.acceptOrder === 'function') {
        await orderManage.acceptOrder(ctx, orderId);
      } else {
        await ctx.reply('❌ Order function not available');
      }
    } catch (error) {
      console.error('Error in admin_order_accept:', error);
      await ctx.reply('An error occurred');
    }
  });
  
  bot.action(/admin_order_reject_(.+)/, async (ctx) => {
    try {
      const orderId = ctx.match[1];
      if (orderManage && typeof orderManage.rejectOrder === 'function') {
        await orderManage.rejectOrder(ctx, orderId);
      } else {
        await ctx.reply('❌ Order function not available');
      }
    } catch (error) {
      console.error('Error in admin_order_reject:', error);
      await ctx.reply('An error occurred');
    }
  });

  // ==================== BROADCAST ====================
  bot.action('admin_broadcast', async (ctx) => {
    try {
      if (broadcast && typeof broadcast.startBroadcast === 'function') {
        await broadcast.startBroadcast(ctx);
      } else {
        await ctx.reply('❌ Broadcast function not available');
        console.error('broadcast.startBroadcast is not a function');
      }
    } catch (error) {
      console.error('Error in admin_broadcast:', error);
      await ctx.reply('An error occurred');
    }
  });

  // ==================== STATISTICS ====================
  bot.action('admin_stats', async (ctx) => {
    try {
      if (stats && typeof stats.showStats === 'function') {
        await stats.showStats(ctx);
      } else {
        await ctx.reply('❌ Statistics function not available');
        console.error('stats.showStats is not a function');
      }
    } catch (error) {
      console.error('Error in admin_stats:', error);
      await ctx.reply('An error occurred');
    }
  });

  // ==================== BACK BUTTON ====================
  bot.action('admin_back', async (ctx) => {
    try {
      // Trigger admin command again
      ctx.callbackQuery.data = 'admin';
      await ctx.telegram.callbackQueryHandler(ctx);
    } catch (error) {
      console.error('Error in admin_back:', error);
      await ctx.reply('An error occurred');
    }
  });
}

// গুরুত্বপূর্ণ: register function export করুন
module.exports = { register };

// ডিবাগ করার জন্য - console এ দেখাবে
console.log("✅ Admin index.js loaded, register function exported");
