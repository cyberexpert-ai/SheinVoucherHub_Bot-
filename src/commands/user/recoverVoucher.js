const { Markup } = require('telegraf');
const moment = require('moment');

async function start(ctx) {
  const message = 
    "🔁 *Recover Vouchers*\n\n" +
    "Send your Order ID to recover vouchers.\n\n" +
    "📝 *Example:* `SVH-1234567890-ABC123`\n\n" +
    "⚠️ *Note:* Recovery is only available within 2 hours of purchase.";

  const buttons = [
    [Markup.button.callback('🔙 Back', 'back_to_main')]
  ];

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons,
      force_reply: true
    }
  });

  // Set user state to expect order ID
  ctx.session = ctx.session || {};
  ctx.session.awaitingRecovery = true;
}

async function processRecovery(ctx, orderId) {
  try {
    const userId = ctx.from.id;

    // Validate order ID format
    const orderIdRegex = /^SVH-\d{8}-[A-Z0-9]{6}$/;
    if (!orderIdRegex.test(orderId)) {
      return ctx.reply(
        "❌ *Invalid Order ID Format*\n\n" +
        "Please use format: `SVH-YYYYMMDD-XXXXXX`\n" +
        "Example: `SVH-20260130-54C98D`",
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('🔁 Try Again', 'recover_vouchers')],
              [Markup.button.callback('🔙 Back', 'back_to_main')]
            ]
          }
        }
      );
    }

    // Check if order exists and belongs to user
    const order = await global.pool.query(`
      SELECT o.*, c.name as category_name,
             array_agg(v.code) as voucher_codes
      FROM orders o
      LEFT JOIN categories c ON o.category_id = c.id
      LEFT JOIN order_vouchers ov ON o.order_id = ov.order_id
      LEFT JOIN vouchers v ON ov.voucher_id = v.id
      WHERE o.order_id = $1
      GROUP BY o.id, o.order_id, c.name
    `, [orderId]);

    if (order.rows.length === 0) {
      return ctx.reply(
        `⚠️ *Order not found:* \`${orderId}\`\n\n` +
        "Please check your Order ID and try again.",
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('🔁 Try Again', 'recover_vouchers')],
              [Markup.button.callback('🔙 Back', 'back_to_main')]
            ]
          }
        }
      );
    }

    const orderData = order.rows[0];

    // Check if order belongs to this user
    if (orderData.user_id.toString() !== userId.toString()) {
      return ctx.reply(
        "⚠️ *This Order ID belongs to another account.*\n\n" +
        "Recovery is only available for the original purchaser.",
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('🔁 Try Again', 'recover_vouchers')],
              [Markup.button.callback('🔙 Back', 'back_to_main')]
            ]
          }
        }
      );
    }

    // Check if recovery is still available (within 2 hours)
    const orderTime = moment(orderData.created_at);
    const now = moment();
    const hoursDiff = now.diff(orderTime, 'hours');

    if (hoursDiff > 2) {
      return ctx.reply(
        "⏰ *Recovery Period Expired*\n\n" +
        "Orders can only be recovered within 2 hours of purchase.\n" +
        "Please contact support for assistance.",
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('🆘 Contact Support', 'support')],
              [Markup.button.callback('🔙 Back', 'back_to_main')]
            ]
          }
        }
      );
    }

    // Check if order is completed and has vouchers
    if (orderData.status === 'completed' && orderData.voucher_codes && orderData.voucher_codes[0]) {
      const vouchers = orderData.voucher_codes.filter(v => v !== null);
      
      let voucherMessage = 
        "✅ *Order Found - Recovery Successful*\n\n" +
        `📦 *Order ID:* \`${orderData.order_id}\`\n` +
        `🎟 *Category:* ${orderData.category_name}\n` +
        `🔢 *Quantity:* ${orderData.quantity}\n` +
        `💰 *Amount:* ₹${orderData.total_amount}\n\n` +
        "🔑 *Your Voucher Codes:*\n\n";

      vouchers.forEach((voucher, index) => {
        voucherMessage += `${index + 1}. \`${voucher}\`\n`;
      });

      voucherMessage += "\n📋 Tap on code to copy";

      await ctx.reply(voucherMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('📦 View Orders', 'my_orders')],
            [Markup.button.callback('🔙 Back', 'back_to_main')]
          ]
        }
      });

      // Log recovery activity
      await global.pool.query(
        `INSERT INTO activity_logs (user_id, action, details) 
         VALUES ($1, $2, $3)`,
        [userId, 'recovery_success', { order_id: orderId }]
      );

    } else {
      // Order exists but not completed - forward to admin
      await forwardToAdmin(ctx, orderData);
    }

  } catch (error) {
    console.error('Recovery error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
}

async function forwardToAdmin(ctx, orderData) {
  const adminId = process.env.ADMIN_ID;
  
  const message = 
    "🔄 *Recovery Request*\n\n" +
    `👤 *User:* ${ctx.from.first_name} ${ctx.from.last_name || ''}\n` +
    `🆔 *User ID:* \`${ctx.from.id}\`\n` +
    `🧾 *Order ID:* \`${orderData.order_id}\`\n` +
    `📦 *Category:* ${orderData.category_name}\n` +
    `🔢 *Quantity:* ${orderData.quantity}\n` +
    `💰 *Amount:* ₹${orderData.total_amount}\n` +
    `📅 *Order Date:* ${moment(orderData.created_at).format('DD/MM/YYYY HH:mm')}\n` +
    `📊 *Current Status:* ${orderData.status}\n\n` +
    "Please process this recovery request:";

  await ctx.telegram.sendMessage(adminId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          Markup.button.callback(`✅ Accept Recovery`, `admin_recovery_accept_${orderData.order_id}`),
          Markup.button.callback(`❌ Reject Recovery`, `admin_recovery_reject_${orderData.order_id}`)
        ]
      ]
    }
  });

  await ctx.reply(
    "✅ *Recovery request sent to admin*\n\n" +
    "Our team will process your request shortly. You'll be notified once resolved.",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('🔙 Back', 'back_to_main')]
        ]
      }
    }
  );
}

module.exports = { start, processRecovery };
