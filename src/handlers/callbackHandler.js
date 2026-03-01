const { startCommand, handleVerifyJoin } = require('../commands/start');
const { selectCategory, selectQuantity, handleCustomQuantity, confirmPaid } = require('../commands/user/buyVoucher');
const { showOrders } = require('../commands/user/myOrders');
const { start: startRecovery } = require('../commands/user/recoverVoucher');
const { start: startSupport } = require('../commands/user/support');
const { show: showDisclaimer } = require('../commands/user/disclaimer');
const { deleteOldMessage } = require('../utils/helpers');

async function callbackHandler(ctx) {
  try {
    const data = ctx.callbackQuery.data;
    
    // Handle verify join
    if (data === 'verify_join') {
      await handleVerifyJoin(ctx);
      await ctx.answerCbQuery();
      return;
    }

    // Handle category selection
    if (data.startsWith('select_cat_')) {
      const categoryId = data.replace('select_cat_', '');
      await selectCategory(ctx, categoryId);
      await ctx.answerCbQuery();
      return;
    }

    // Handle quantity selection
    if (data.startsWith('qty_')) {
      const parts = data.split('_');
      const categoryId = parts[1];
      const quantity = parseInt(parts[2]);
      await selectQuantity(ctx, categoryId, quantity);
      await ctx.answerCbQuery();
      return;
    }

    // Handle custom quantity
    if (data.startsWith('custom_qty_')) {
      const categoryId = data.replace('custom_qty_', '');
      await handleCustomQuantity(ctx, categoryId);
      await ctx.answerCbQuery();
      return;
    }

    // Handle paid confirmation
    if (data === 'paid_confirm') {
      await confirmPaid(ctx);
      await ctx.answerCbQuery();
      return;
    }

    // Handle back button
    if (data === 'back_to_main') {
      await deleteOldMessage(ctx);
      await startCommand(ctx);
      await ctx.answerCbQuery();
      return;
    }

    // Handle other callbacks
    switch (data) {
      case 'buy_voucher':
        const { showCategories } = require('../commands/user/buyVoucher');
        await showCategories(ctx);
        break;
        
      case 'my_orders':
        await showOrders(ctx);
        break;
        
      case 'recover_vouchers':
        await startRecovery(ctx);
        break;
        
      case 'support':
        await startSupport(ctx);
        break;
        
      case 'disclaimer':
        await showDisclaimer(ctx);
        break;
        
      case 'leave_support':
        await ctx.reply('👋 Thanks for contacting support. We\'ll get back to you soon.');
        await startCommand(ctx);
        break;
        
      default:
        // Handle admin callbacks
        if (data.startsWith('admin_')) {
          // Admin callbacks are handled in admin command files
          // Just pass through
        } else {
          await ctx.answerCbQuery('Unknown command');
        }
    }
    
    await ctx.answerCbQuery();
    
  } catch (error) {
    console.error('Callback handler error:', error);
    await ctx.answerCbQuery('An error occurred').catch(e => {});
  }
}

module.exports = callbackHandler;
