const buyVoucher = require('./buyVoucher');
const myOrders = require('./myOrders');
const recoverVoucher = require('./recoverVoucher');
const support = require('./support');
const disclaimer = require('./disclaimer');

function register(bot) {
  // Register callback handlers
  bot.action('buy_voucher', async (ctx) => {
    await buyVoucher.showCategories(ctx);
  });
  
  bot.action('my_orders', async (ctx) => {
    await myOrders.showOrders(ctx);
  });
  
  bot.action('recover_vouchers', async (ctx) => {
    await recoverVoucher.start(ctx);
  });
  
  bot.action('support', async (ctx) => {
    await support.start(ctx);
  });
  
  bot.action('disclaimer', async (ctx) => {
    await disclaimer.show(ctx);
  });
  
  // Back button
  bot.action('back_to_main', async (ctx) => {
    const { showMainMenu } = require('../start');
    await showMainMenu(ctx);
  });
  
  // Leave button (for support)
  bot.action('leave_support', async (ctx) => {
    const { showMainMenu } = require('../start');
    await ctx.reply('👋 Thanks for contacting support. We\'ll get back to you soon.');
    await showMainMenu(ctx);
  });
}

module.exports = { register };
