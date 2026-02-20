const db = require('../database/database');
const buyVoucher = require('../commands/user/buyVoucher');
const recoverVoucher = require('../commands/user/recoverVoucher');
const support = require('../commands/user/support');
const adminCommand = require('../commands/admin');

module.exports = async (ctx) => {
  try {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    
    // Update user activity
    await db.updateUserActivity(userId);
    
    // Check if user is blocked
    const isBlocked = await db.isUserBlocked(userId);
    if (isBlocked) {
      if (text === '🆘 Support') {
        return support(ctx);
      }
      
      const user = await db.getUser(userId);
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
    
    // Admin message handling
    if (userId.toString() === process.env.ADMIN_ID) {
      // Handle admin reply to ticket
      if (ctx.session?.replyingToTicket) {
        const ticketId = ctx.session.replyingToTicket;
        const replied = await support.handleAdminReply(ctx, ticketId, text);
        if (replied) {
          ctx.session = { ...ctx.session, replyingToTicket: null };
          await ctx.reply('✅ Reply sent to user');
        }
        return;
      }
      
      // Handle admin block user
      if (ctx.session?.blockingUser) {
        const targetUserId = ctx.session.blockingUser;
        const parts = text.split(' ');
        const reason = parts.slice(0, -1).join(' ') || 'No reason';
        const minutes = parseInt(parts[parts.length - 1]) || null;
        
        await db.blockUser(targetUserId, reason, minutes);
        ctx.session = { ...ctx.session, blockingUser: null };
        
        await ctx.reply(`✅ User ${targetUserId} blocked\nReason: ${reason}${minutes ? `\nDuration: ${minutes} minutes` : ''}`);
        return;
      }
      
      // Handle admin broadcast
      if (ctx.session?.broadcasting) {
        await adminCommand.handleBroadcastSend(ctx, text);
        return;
      }
    }
    
    // Handle custom quantity input
    const handled = await buyVoucher.handleCustomQuantity(ctx, text);
    if (handled) return;
    
    // Handle recovery order ID
    const recovered = await recoverVoucher.handleOrderId(ctx, text);
    if (recovered) return;
    
    // Handle support message
    const supported = await support.handleMessage(ctx, text);
    if (supported) return;
    
    // If no handler matched, show help message
    await ctx.reply(
      '❓ *Unknown Command*\n\n' +
      'Please use the buttons below to navigate:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '🛒 Buy Voucher' }, { text: '🔁 Recover Vouchers' }],
            [{ text: '📦 My Orders' }, { text: '📜 Disclaimer' }],
            [{ text: '🆘 Support' }]
          ],
          resize_keyboard: true
        }
      }
    );
    
  } catch (error) {
    console.error('Message handler error:', error);
    ctx.reply('An error occurred. Please try again later.').catch(() => {});
  }
};
