const { Markup } = require('telegraf');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

async function handle(ctx) {
  const action = ctx.callbackQuery.data;
  
  if (action === 'admin_orders') {
    await showOrdersMenu(ctx);
  } else if (action.startsWith('admin_order_view_')) {
    const orderId = action.replace('admin_order_view_', '');
    await viewOrder(ctx, orderId);
  } else if (action.startsWith('admin_order_accept_')) {
    const orderId = action.replace('admin_order_accept_', '');
    await acceptOrder(ctx, orderId);
  } else if (action.startsWith('admin_order_reject_')) {
    const orderId = action.replace('admin_order_reject_', '');
    await rejectOrder(ctx, orderId);
  } else if (action.startsWith('admin_order_deliver_')) {
    const orderId = action.replace('admin_order_deliver_', '');
    await deliverOrder(ctx, orderId);
  } else if (action.startsWith('admin_order_cancel_')) {
    const orderId = action.replace('admin_order_cancel_', '');
    await cancelOrder(ctx, orderId);
  }
}

async function showOrdersMenu(ctx) {
  // Get order statistics
  const stats = await global.pool.query(`
    SELECT 
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected_orders,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
      COALESCE(SUM(total_amount), 0) as total_amount
    FROM orders
  `);

  // Get recent orders
  const recentOrders = await global.pool.query(`
    SELECT o.*, u.username, u.first_name, c.name as category_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    LEFT JOIN categories c ON o.category_id = c.id
    ORDER BY o.created_at DESC
    LIMIT 5
  `);

  let message = "📦 *Order Management*\n\n";
  message += `📊 *Statistics*\n`;
  message += `├ Total Orders: ${stats.rows[0].total_orders}\n`;
  message += `├ Pending: ${stats.rows[0].pending_orders}\n`;
  message += `├ Completed: ${stats.rows[0].completed_orders}\n`;
  message += `├ Rejected: ${stats.rows[0].rejected_orders}\n`;
  message += `├ Total Revenue: ₹${parseFloat(stats.rows[0].total_revenue).toFixed(2)}\n`;
  message += `└ Total Amount: ₹${parseFloat(stats.rows[0].total_amount).toFixed(2)}\n\n`;

  if (recentOrders.rows.length > 0) {
    message += "*Recent Orders:*\n";
    recentOrders.rows.forEach(order => {
      const statusEmoji = order.status === 'completed' ? '✅' : 
                         order.status === 'pending' ? '⏳' : '❌';
      message += `${statusEmoji} ${order.order_id} - ${order.first_name} - ₹${order.total_amount}\n`;
    });
  }

  const buttons = [
    [
      { text: '⏳ Pending Orders', callback_data: 'admin_orders_pending' },
      { text: '✅ Completed', callback_data: 'admin_orders_completed' }
    ],
    [
      { text: '🔍 Search Order', callback_data: 'admin_orders_search' },
      { text: '📊 Revenue Report', callback_data: 'admin_orders_revenue' }
    ],
    [{ text: '🔙 Back to Admin', callback_data: 'admin_back' }]
  ];

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function viewOrder(ctx, orderId) {
  const order = await global.pool.query(`
    SELECT o.*, u.username, u.first_name, u.user_id, c.name as category_name,
           array_agg(v.code) as voucher_codes
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    LEFT JOIN categories c ON o.category_id = c.id
    LEFT JOIN order_vouchers ov ON o.order_id = ov.order_id
    LEFT JOIN vouchers v ON ov.voucher_id = v.id
    WHERE o.order_id = $1
    GROUP BY o.id, o.order_id, u.username, u.first_name, u.user_id, c.name
  `, [orderId]);

  if (order.rows.length === 0) {
    return ctx.reply('Order not found.');
  }

  const o = order.rows[0];
  
  const statusEmoji = o.status === 'completed' ? '✅' : 
                     o.status === 'pending' ? '⏳' : '❌';

  let message = 
    `📦 *Order Details*\n\n` +
    `🧾 *Order ID:* \`${o.order_id}\`\n` +
    `👤 *User:* ${o.first_name} (@${o.username || 'N/A'})\n` +
    `🆔 *User ID:* \`${o.user_id}\`\n` +
    `📦 *Category:* ${o.category_name}\n` +
    `🔢 *Quantity:* ${o.quantity}\n` +
    `💰 *Amount:* ₹${o.total_amount}\n` +
    `📊 *Status:* ${statusEmoji} ${o.status}\n` +
    `💳 *UTR:* ${o.utr_number || 'N/A'}\n` +
    `📅 *Date:* ${moment(o.created_at).format('DD/MM/YYYY HH:mm')}\n`;

  if (o.voucher_codes && o.voucher_codes[0]) {
    message += `\n🔑 *Voucher Codes:*\n`;
    o.voucher_codes.forEach((code, i) => {
      if (code) message += `${i+1}. \`${code}\`\n`;
    });
  }

  const buttons = [];

  if (o.status === 'pending') {
    buttons.push([
      { text: '✅ Accept', callback_data: `admin_order_accept_${o.order_id}` },
      { text: '❌ Reject', callback_data: `admin_order_reject_${o.order_id}` }
    ]);
  } else if (o.status === 'completed') {
    buttons.push([
      { text: '🔄 Resend Codes', callback_data: `admin_order_resend_${o.order_id}` }
    ]);
  }

  buttons.push([{ text: '🔙 Back', callback_data: 'admin_orders' }]);

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function acceptOrder(ctx, orderId) {
  try {
    // Start transaction
    await global.pool.query('BEGIN');

    // Get order details
    const order = await global.pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [orderId]
    );

    if (order.rows.length === 0) {
      await global.pool.query('ROLLBACK');
      return ctx.reply('Order not found.');
    }

    const o = order.rows[0];

    // Get available vouchers
    const vouchers = await global.pool.query(`
      SELECT id, code FROM vouchers 
      WHERE category_id = $1 AND status = 'available'
      LIMIT $2
      FOR UPDATE
    `, [o.category_id, o.quantity]);

    if (vouchers.rows.length < o.quantity) {
      await global.pool.query('ROLLBACK');
      return ctx.reply(`❌ Insufficient stock. Only ${vouchers.rows.length} available.`);
    }

    // Update order status
    await global.pool.query(
      `UPDATE orders SET status = 'completed', updated_at = NOW() 
       WHERE order_id = $1`,
      [orderId]
    );

    // Update vouchers status
    const voucherIds = vouchers.rows.map(v => v.id);
    await global.pool.query(
      `UPDATE vouchers 
       SET status = 'sold', purchased_by = $1, purchased_at = NOW(), order_id = $2
       WHERE id = ANY($3::int[])`,
      [o.user_id, orderId, voucherIds]
    );

    // Create order_vouchers entries
    for (const voucherId of voucherIds) {
      await global.pool.query(
        'INSERT INTO order_vouchers (order_id, voucher_id) VALUES ($1, $2)',
        [orderId, voucherId]
      );
    }

    // Update user stats
    await global.pool.query(
      `UPDATE users 
       SET total_orders = total_orders + 1, 
           total_spent = total_spent + $1
       WHERE user_id = $2`,
      [o.total_amount, o.user_id]
    );

    await global.pool.query('COMMIT');

    // Send vouchers to user
    const voucherCodes = vouchers.rows.map(v => v.code);
    let voucherMessage = 
      "✅ *Order Accepted!*\n\n" +
      `🧾 *Order ID:* \`${orderId}\`\n` +
      `🎟 *Category:* ${o.category_id}\n` +
      `🔢 *Quantity:* ${o.quantity}\n\n` +
      "🔑 *Your Voucher Codes:*\n\n";

    voucherCodes.forEach((code, index) => {
      voucherMessage += `${index + 1}. \`${code}\`\n`;
    });

    voucherMessage += "\n📋 Tap on code to copy\n\nThank you for your purchase! 🎉";

    await ctx.telegram.sendMessage(o.user_id, voucherMessage, {
      parse_mode: 'Markdown'
    });

    // Send notification to channel
    await sendOrderNotification(ctx, o, voucherCodes);

    await ctx.answerCbQuery('✅ Order accepted and vouchers sent!');
    await viewOrder(ctx, orderId);

  } catch (error) {
    await global.pool.query('ROLLBACK');
    console.error('Accept order error:', error);
    ctx.reply('An error occurred while processing the order.');
  }
}

async function sendOrderNotification(ctx, order, voucherCodes) {
  const channelId = process.env.CHANNEL_2_ID;
  
  const message = 
    "🎯 *𝗡𝗲𝘄 𝗢𝗿𝗱𝗲𝗿 𝗦𝘂𝗯𝗺𝗶𝘁𝘁𝗲𝗱*\n" +
    "━━━━━━━━━━━•❈•━━━━━━━━━━━\n" +
    `╰➤👤 𝗨𝗦𝗘𝗥 𝗡𝗔𝗠𝗘 : ${order.first_name}\n` +
    `╰➤🆔 𝗨𝗦𝗘𝗥 𝗜𝗗 : \`${order.user_id}\`\n` +
    `╰➤📡 𝗦𝗧𝗔𝗧𝗨𝗦: ✅ Success\n` +
    `╰➤🔰𝗤𝗨𝗔𝗟𝗜𝗧𝗬: High 📶\n` +
    `╰➤📦𝗧𝗢𝗧𝗔𝗟 𝗤𝗨𝗔𝗡𝗧𝗜𝗧𝗬 : ${order.quantity}\n` +
    `╰➤💳𝗖𝗢𝗦𝗧 : ₹${order.total_amount}\n\n` +
    `🤖𝗕𝗢𝗧 𝗡𝗔𝗠𝗘 : @SheinVoucherHub_Bot\n` +
    "━━━━━━━━━━━•❈•━━━━━━━━━━━";

  try {
    await ctx.telegram.sendMessage(channelId, message, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Channel notification error:', error);
  }
}

async function rejectOrder(ctx, orderId) {
  await ctx.reply(
    "❌ *Reject Order*\n\n" +
    "Enter reason for rejection:",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'reject_order';
  ctx.session.orderId = orderId;
}

async function deliverOrder(ctx, orderId) {
  // Similar to accept order but for manual delivery
  await acceptOrder(ctx, orderId);
}

async function cancelOrder(ctx, orderId) {
  await global.pool.query(
    `UPDATE orders SET status = 'cancelled', updated_at = NOW() 
     WHERE order_id = $1`,
    [orderId]
  );

  await ctx.answerCbQuery('✅ Order cancelled!');
  await showOrdersMenu(ctx);
}

async function processRecoveryAccept(ctx, orderId) {
  // Similar to accept order but for recovery
  await ctx.reply(
    "🔄 *Process Recovery*\n\n" +
    "Enter new voucher codes (one per line):",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'recovery_accept';
  ctx.session.orderId = orderId;
}

async function processRecoveryReject(ctx, orderId) {
  await ctx.reply(
    "❌ *Reject Recovery*\n\n" +
    "Enter reason for rejection:",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'recovery_reject';
  ctx.session.orderId = orderId;
}

module.exports = { 
  handle, 
  acceptOrder, 
  rejectOrder, 
  deliverOrder, 
  cancelOrder,
  processRecoveryAccept,
  processRecoveryReject
};
