const db = require('../database/database');
const buyVoucher = require('../commands/user/buyVoucher');
const adminCommand = require('../commands/admin');

module.exports = async (ctx) => {
  try {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    
    // Verify membership callback
    if (data === 'verify_membership') {
      const channel1 = process.env.CHANNEL_1;
      const channel2 = process.env.CHANNEL_2;
      
      let inChannel1 = false;
      let inChannel2 = false;
      
      try {
        const member1 = await ctx.telegram.getChatMember(channel1, userId);
        inChannel1 = ['member', 'administrator', 'creator'].includes(member1.status);
      } catch (e) {}
      
      try {
        const member2 = await ctx.telegram.getChatMember(channel2, userId);
        inChannel2 = ['member', 'administrator', 'creator'].includes(member2.status);
      } catch (e) {}
      
      if (inChannel1 && inChannel2) {
        await db.query(
          'UPDATE users SET is_verified = TRUE WHERE telegram_id = ?',
          [userId]
        );
        
        await ctx.answerCbQuery('✅ Verification successful!');
        
        const welcomeMessage = await db.getSetting('welcome_message') || 
          '🎯 Welcome to Shein Voucher Hub S!\n\n🚀 Get exclusive Shein vouchers at the best prices!\n\n📌 Choose an option below:';
        
        await ctx.editMessageText(welcomeMessage, {
          reply_markup: {
            keyboard: [
              [{ text: '🛒 Buy Voucher' }, { text: '🔁 Recover Vouchers' }],
              [{ text: '📦 My Orders' }, { text: '📜 Disclaimer' }],
              [{ text: '🆘 Support' }]
            ],
            resize_keyboard: true
          }
        });
      } else {
        await ctx.answerCbQuery('❌ You haven\'t joined both channels yet!', { alert: true });
      }
      return;
    }
    
    // Category selection
    if (data.startsWith('cat_')) {
      const categoryId = data.split('_')[1];
      await buyVoucher.handleCategory(ctx, categoryId);
      return;
    }
    
    // Quantity selection
    if (data.startsWith('qty_')) {
      const parts = data.split('_');
      const categoryId = parts[1];
      const quantity = parts[2];
      await buyVoucher.handleQuantity(ctx, categoryId, quantity);
      return;
    }
    
    // Payment
    if (data.startsWith('paid_')) {
      const parts = data.split('_');
      const categoryId = parts[1];
      const quantity = parts[2];
      const totalPrice = parts[3];
      await buyVoucher.handlePayment(ctx, categoryId, quantity, totalPrice);
      return;
    }
    
    // Back to categories
    if (data === 'back_to_categories') {
      const categories = await db.getCategories();
      const buttons = categories.map(cat => 
        [Markup.button.callback(cat.display_name, `cat_${cat.id}`)]
      );
      buttons.push([Markup.button.callback('↩️ Back', 'back_to_main')]);
      
      await ctx.editMessageText('📌 *Select Voucher Type*', {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      return;
    }
    
    // Back to main
    if (data === 'back_to_main') {
      await ctx.deleteMessage();
      const welcomeMessage = await db.getSetting('welcome_message') || 
        '🎯 Welcome to Shein Voucher Hub S!\n\n🚀 Get exclusive Shein vouchers at the best prices!\n\n📌 Choose an option below:';
      
      await ctx.reply(welcomeMessage, {
        reply_markup: {
          keyboard: [
            [{ text: '🛒 Buy Voucher' }, { text: '🔁 Recover Vouchers' }],
            [{ text: '📦 My Orders' }, { text: '📜 Disclaimer' }],
            [{ text: '🆘 Support' }]
          ],
          resize_keyboard: true
        }
      });
      return;
    }
    
    // Admin callbacks
    if (data.startsWith('admin_')) {
      await adminCommand.handleCallback(ctx);
      return;
    }
    
    // Order acceptance
    if (data.startsWith('accept_order_')) {
      const orderId = data.split('_')[2];
      await adminCommand.handleAcceptOrder(ctx, orderId);
      return;
    }
    
    // Order rejection
    if (data.startsWith('reject_order_')) {
      const orderId = data.split('_')[2];
      await adminCommand.handleRejectOrder(ctx, orderId);
      return;
    }
    
    // Support ticket reply
    if (data.startsWith('reply_ticket_')) {
      const ticketId = data.split('_')[2];
      ctx.session = { ...ctx.session, replyingToTicket: ticketId };
      
      await ctx.editMessageText(
        `✏️ Send your reply for ticket ${ticketId}`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ Cancel', 'cancel_reply')]
          ]).reply_markup
        }
      );
      return;
    }
    
    // Block user
    if (data.startsWith('block_user_')) {
      const userId = data.split('_')[2];
      ctx.session = { ...ctx.session, blockingUser: userId };
      
      await ctx.editMessageText(
        `🔨 Send block reason (and duration in minutes, e.g., "Spam 30"):`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ Cancel', 'cancel_block')]
          ]).reply_markup
       
 }
      );
      return;
    }
    
    // Close ticket
    if (data.startsWith('close_ticket_')) {
      const ticketId = data.split('_')[2];
      await db.closeTicket(ticketId);
      await ctx.answerCbQuery('✅ Ticket closed');
      await ctx.editMessageText('✅ Ticket closed successfully');
      return;
    }
    
    // Cancel operations
    if (data === 'cancel_reply' || data === 'cancel_block') {
      await ctx.deleteMessage();
      return;
    }
    
    // If no handler found
    await ctx.answerCbQuery();
    
  } catch (error) {
    console.error('Callback handler error:', error);
    await ctx.answerCbQuery('❌ An error occurred').catch(() => {});
  }
};
