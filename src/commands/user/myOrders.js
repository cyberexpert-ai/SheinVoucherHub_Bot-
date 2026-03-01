const { Markup } = require('telegraf');
const moment = require('moment');

async function showOrders(ctx) {
  try {
    const userId = ctx.from.id;
    
    const orders = await global.pool.query(`
      SELECT o.*, c.name as category_name, 
             array_agg(v.code) as voucher_codes
      FROM orders o
      LEFT JOIN categories c ON o.category_id = c.id
      LEFT JOIN order_vouchers ov ON o.order_id = ov.order_id
      LEFT JOIN vouchers v ON ov.voucher_id = v.id
      WHERE o.user_id = $1
      GROUP BY o.id, o.order_id, c.name
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [userId]);

    if (orders.rows.length === 0) {
      return ctx.reply(
        "📦 *You don't have any orders yet.*\n\n" +
        "Start buying vouchers now!",
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('🛒 Buy Voucher', 'buy_voucher')],
              [Markup.button.callback('🔙 Back', 'back_to_main')]
            ]
          }
        }
      );
    }

    let message = "📦 *Your Orders*\n\n";
    
    for (const order of orders.rows) {
      const statusEmoji = order.status === 'completed' ? '✅' : 
                         order.status === 'pending' ? '⏳' : '❌';
      
      message += 
        `🧾 *Order ID:* \`${order.order_id}\`\n` +
        `🎟 *Category:* ${order.category_name} | Qty: ${order.quantity}\n` +
        `💰 *Amount:* ₹${order.total_amount} | ${statusEmoji} ${order.status}\n`;
      
      if (order.status === 'completed' && order.voucher_codes && order.voucher_codes[0]) {
        message += `🔑 *Voucher:* \`${order.voucher_codes[0]}\`\n`;
      }
      
      message += `📅 *Date:* ${moment(order.created_at).format('DD/MM/YYYY HH:mm')}\n\n`;
    }

    const buttons = [
      [Markup.button.callback('🔄 Refresh', 'my_orders')],
      [Markup.button.callback('🔙 Back', 'back_to_main')]
    ];

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('Show orders error:', error);
    ctx.reply('An error occurred. Please try again.');
  }
}

module.exports = { showOrders };
