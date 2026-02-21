/**
 * My Orders Handler
 */

const db = require('../../database/database');

module.exports = async (ctx) => {
  try {
    const userId = ctx.from.id;
    const orders = await db.getUserOrders(userId, 10);
    
    if (!orders || orders.length === 0) {
      return ctx.reply('📦 You don\'t have any orders yet.', {
        reply_markup: {
          keyboard: [[{ text: '↩️ Back' }]],
          resize_keyboard: true
        }
      });
    }
    
    let message = '📦 *Your Orders*\n\n';
    
    for (const order of orders) {
      const statusEmoji = {
        'pending': '⏳',
        'success': '✅',
        'rejected': '❌',
        'expired': '⌛'
      }[order.status] || '📦';
      
      message += 
        `${statusEmoji} *${order.order_id}*\n` +
        `🎟 ${order.category_name} | Qty ${order.quantity}\n` +
        `💰 ₹${order.total_price} | ${order.status.toUpperCase()}\n\n`;
    }
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[{ text: '↩️ Back' }]],
        resize_keyboard: true
      }
    });
    
  } catch (error) {
    console.error('My orders error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};
