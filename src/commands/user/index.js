// src/commands/user/index.js - FINAL WORKING VERSION

// প্রয়োজনীয় modules import করুন
const buyVoucher = require('./buyVoucher');
const myOrders = require('./myOrders');
const recoverVoucher = require('./recoverVoucher');
const support = require('./support');
const disclaimer = require('./disclaimer');

// register function - এটি export করতে হবে
function register(bot) {
  console.log("✅ User commands registered successfully");
  
  // ==================== MAIN MENU ACTIONS ====================
  
  // Buy Voucher
  bot.action('buy_voucher', async (ctx) => {
    try {
      console.log("User clicked buy_voucher");
      if (buyVoucher && typeof buyVoucher.showCategories === 'function') {
        await buyVoucher.showCategories(ctx);
      } else {
        console.error('buyVoucher.showCategories is not a function');
        await ctx.reply('❌ Buy voucher function not available. Please try again later.');
      }
    } catch (error) {
      console.error('Error in buy_voucher:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });
  
  // My Orders
  bot.action('my_orders', async (ctx) => {
    try {
      console.log("User clicked my_orders");
      if (myOrders && typeof myOrders.showOrders === 'function') {
        await myOrders.showOrders(ctx);
      } else {
        console.error('myOrders.showOrders is not a function');
        await ctx.reply('❌ My orders function not available. Please try again later.');
      }
    } catch (error) {
      console.error('Error in my_orders:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });
  
  // Recover Vouchers
  bot.action('recover_vouchers', async (ctx) => {
    try {
      console.log("User clicked recover_vouchers");
      if (recoverVoucher && typeof recoverVoucher.start === 'function') {
        await recoverVoucher.start(ctx);
      } else {
        console.error('recoverVoucher.start is not a function');
        await ctx.reply('❌ Recover function not available. Please try again later.');
      }
    } catch (error) {
      console.error('Error in recover_vouchers:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });
  
  // Support
  bot.action('support', async (ctx) => {
    try {
      console.log("User clicked support");
      if (support && typeof support.start === 'function') {
        await support.start(ctx);
      } else {
        console.error('support.start is not a function');
        await ctx.reply('❌ Support function not available. Please try again later.');
      }
    } catch (error) {
      console.error('Error in support:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });
  
  // Disclaimer
  bot.action('disclaimer', async (ctx) => {
    try {
      console.log("User clicked disclaimer");
      if (disclaimer && typeof disclaimer.show === 'function') {
        await disclaimer.show(ctx);
      } else {
        console.error('disclaimer.show is not a function');
        await ctx.reply('❌ Disclaimer function not available. Please try again later.');
      }
    } catch (error) {
      console.error('Error in disclaimer:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });
  
  // ==================== CATEGORY SELECTION ====================
  
  // Select category
  bot.action(/select_cat_(.+)/, async (ctx) => {
    try {
      const categoryId = ctx.match[1];
      console.log(`User selected category: ${categoryId}`);
      if (buyVoucher && typeof buyVoucher.selectCategory === 'function') {
        await buyVoucher.selectCategory(ctx, categoryId);
      } else {
        await ctx.reply('❌ Category selection not available.');
      }
    } catch (error) {
      console.error('Error in select_cat:', error);
      await ctx.reply('An error occurred.');
    }
  });
  
  // ==================== QUANTITY SELECTION ====================
  
  // Select quantity
  bot.action(/qty_(.+)_(.+)/, async (ctx) => {
    try {
      const categoryId = ctx.match[1];
      const quantity = parseInt(ctx.match[2]);
      console.log(`User selected quantity: ${quantity} for category: ${categoryId}`);
      if (buyVoucher && typeof buyVoucher.selectQuantity === 'function') {
        await buyVoucher.selectQuantity(ctx, categoryId, quantity);
      } else {
        await ctx.reply('❌ Quantity selection not available.');
      }
    } catch (error) {
      console.error('Error in qty:', error);
      await ctx.reply('An error occurred.');
    }
  });
  
  // Custom quantity
  bot.action(/custom_qty_(.+)/, async (ctx) => {
    try {
      const categoryId = ctx.match[1];
      console.log(`User requested custom quantity for category: ${categoryId}`);
      if (buyVoucher && typeof buyVoucher.handleCustomQuantity === 'function') {
        await buyVoucher.handleCustomQuantity(ctx, categoryId);
      } else {
        await ctx.reply('❌ Custom quantity not available.');
      }
    } catch (error) {
      console.error('Error in custom_qty:', error);
      await ctx.reply('An error occurred.');
    }
  });
  
  // ==================== PAYMENT ====================
  
  // Paid confirmation
  bot.action('paid_confirm', async (ctx) => {
    try {
      console.log("User clicked paid_confirm");
      if (buyVoucher && typeof buyVoucher.confirmPaid === 'function') {
        await buyVoucher.confirmPaid(ctx);
      } else {
        await ctx.reply('❌ Payment confirmation not available.');
      }
    } catch (error) {
      console.error('Error in paid_confirm:', error);
      await ctx.reply('An error occurred.');
    }
  });
  
  // ==================== NAVIGATION ====================
  
  // Back to main menu
  bot.action('back_to_main', async (ctx) => {
    try {
      console.log("User clicked back_to_main");
      const { showMainMenu } = require('../start');
      await showMainMenu(ctx);
    } catch (error) {
      console.error('Error in back_to_main:', error);
      await ctx.reply('An error occurred. Please use /start');
    }
  });
  
  // Verify join
  bot.action('verify_join', async (ctx) => {
    try {
      console.log("User clicked verify_join");
      const { handleVerifyJoin } = require('../start');
      await handleVerifyJoin(ctx);
    } catch (error) {
      console.error('Error in verify_join:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });
}

// গুরুত্বপূর্ণ: register function export করুন
module.exports = { register };

// ডিবাগ করার জন্য - console এ দেখাবে
console.log("✅ User index.js loaded, register function exported");
