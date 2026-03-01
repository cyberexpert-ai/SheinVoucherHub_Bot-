const { Markup } = require('telegraf');

async function handle(ctx) {
  const action = ctx.callbackQuery.data;
  
  if (action === 'admin_security') {
    await showSecurityMenu(ctx);
  } else if (action === 'admin_security_utr') {
    await showBlockedUTRs(ctx);
  } else if (action === 'admin_security_orderids') {
    await showUsedOrderIDs(ctx);
  } else if (action === 'admin_security_logs') {
    await showActivityLogs(ctx);
  } else if (action === 'admin_security_fraud') {
    await showFraudDetection(ctx);
  }
}

async function showSecurityMenu(ctx) {
  const stats = await global.pool.query(`
    SELECT
      (SELECT COUNT(*) FROM blocked_utrs) as blocked_utrs,
      (SELECT COUNT(*) FROM used_order_ids) as used_order_ids,
      (SELECT COUNT(*) FROM activity_logs WHERE created_at > NOW() - INTERVAL '24 hours') as recent_activities,
      (SELECT COUNT(*) FROM users WHERE status != 'active') as blocked_users
  `);

  const message = 
    "🔒 *Security Center*\n\n" +
    `📊 *Statistics*\n` +
    `├ Blocked UTRs: ${stats.rows[0].blocked_utrs}\n` +
    `├ Used Order IDs: ${stats.rows[0].used_order_ids}\n` +
    `├ Recent Activities: ${stats.rows[0].recent_activities}\n` +
    `└ Blocked Users: ${stats.rows[0].blocked_users}\n`;

  const buttons = [
    [
      { text: '🚫 Blocked UTRs', callback_data: 'admin_security_utr' },
      { text: '🆔 Used Order IDs', callback_data: 'admin_security_orderids' }
    ],
    [
      { text: '📋 Activity Logs', callback_data: 'admin_security_logs' },
      { text: '🕵️ Fraud Detection', callback_data: 'admin_security_fraud' }
    ],
    [
      { text: '⚙️ Security Settings', callback_data: 'admin_security_settings' }
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

async function showBlockedUTRs(ctx) {
  const utrs = await global.pool.query(`
    SELECT * FROM blocked_utrs 
    ORDER BY blocked_at DESC 
    LIMIT 20
  `);

  if (utrs.rows.length === 0) {
    return ctx.reply('No blocked UTRs found.');
  }

  let message = "🚫 *Blocked UTR Numbers*\n\n";
  
  utrs.rows.forEach((utr, i) => {
    message += `${i+1}. \`${utr.utr_number}\`\n`;
    message += `   Reason: ${utr.reason || 'N/A'}\n`;
    message += `   Blocked: ${new Date(utr.blocked_at).toLocaleString()}\n\n`;
  });

  const buttons = [
    [{ text: '🔙 Back', callback_data: 'admin_security' }]
  ];

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function showUsedOrderIDs(ctx) {
  const orderIds = await global.pool.query(`
    SELECT * FROM used_order_ids 
    ORDER BY used_at DESC 
    LIMIT 20
  `);

  if (orderIds.rows.length === 0) {
    return ctx.reply('No used Order IDs found.');
  }

  let message = "🆔 *Used Order IDs*\n\n";
  
  orderIds.rows.forEach((order, i) => {
    message += `${i+1}. \`${order.order_id}\`\n`;
    message += `   User ID: \`${order.user_id}\`\n`;
    message += `   Used: ${new Date(order.used_at).toLocaleString()}\n\n`;
  });

  const buttons = [
    [{ text: '🔙 Back', callback_data: 'admin_security' }]
  ];

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function showActivityLogs(ctx) {
  const logs = await global.pool.query(`
    SELECT al.*, u.username, u.first_name
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.user_id
    ORDER BY al.created_at DESC
    LIMIT 20
  `);

  if (logs.rows.length === 0) {
    return ctx.reply('No activity logs found.');
  }

  let message = "📋 *Recent Activity Logs*\n\n";
  
  logs.rows.forEach((log, i) => {
    message += `${i+1}. ${log.first_name} (@${log.username || 'N/A'})\n`;
    message += `   Action: ${log.action}\n`;
    message += `   Time: ${new Date(log.created_at).toLocaleString()}\n`;
    if (log.details) {
      message += `   Details: \`${JSON.stringify(log.details)}\`\n`;
    }
    message += '\n';
  });

  const buttons = [
    [{ text: '🔙 Back', callback_data: 'admin_security' }]
  ];

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function showFraudDetection(ctx) {
  // Detect suspicious patterns
  const suspicious = await global.pool.query(`
    SELECT 
      u.user_id,
      u.first_name,
      u.username,
      COUNT(DISTINCT o.utr_number) as unique_utrs,
      COUNT(o.id) as total_orders,
      SUM(o.total_amount) as total_spent,
      COUNT(DISTINCT date(o.created_at)) as active_days
    FROM users u
    LEFT JOIN orders o ON u.user_id = o.user_id
    WHERE o.status = 'pending' OR o.status = 'rejected'
    GROUP BY u.user_id
    HAVING COUNT(o.id) > 5 OR COUNT(DISTINCT o.utr_number) > 3
    ORDER BY total_orders DESC
    LIMIT 10
  `);

  if (suspicious.rows.length === 0) {
    return ctx.reply('No suspicious activity detected.');
  }

  let message = "🕵️ *Fraud Detection*\n\n";
  message += "*Suspicious Users:*\n\n";

  suspicious.rows.forEach((user, i) => {
    message += `${i+1}. ${user.first_name} (@${user.username || 'N/A'})\n`;
    message += `   User ID: \`${user.user_id}\`\n`;
    message += `   Orders: ${user.total_orders}\n`;
    message += `   Unique UTRs: ${user.unique_utrs}\n`;
    message += `   Total Spent: ₹${parseFloat(user.total_spent || 0).toFixed(2)}\n\n`;
  });

  const buttons = [
    [{ text: '🔙 Back', callback_data: 'admin_security' }]
  ];

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

module.exports = { handle };
