const { Markup } = require('telegraf');
const moment = require('moment');

async function handle(ctx) {
  const action = ctx.callbackQuery.data;
  
  if (action === 'admin_users') {
    await showUserMenu(ctx);
  } else if (action.startsWith('admin_user_view_')) {
    const userId = action.replace('admin_user_view_', '');
    await viewUser(ctx, userId);
  } else if (action.startsWith('admin_user_block_')) {
    const userId = action.replace('admin_user_block_', '');
    await blockUser(ctx, userId);
  } else if (action.startsWith('admin_user_unblock_')) {
    const userId = action.replace('admin_user_unblock_', '');
    await unblockUser(ctx, userId);
  } else if (action.startsWith('admin_user_tempblock_')) {
    const userId = action.replace('admin_user_tempblock_', '');
    await tempBlockUser(ctx, userId);
  } else if (action.startsWith('admin_user_message_')) {
    const userId = action.replace('admin_user_message_', '');
    await messageUser(ctx, userId);
  } else if (action.startsWith('admin_user_orders_')) {
    const userId = action.replace('admin_user_orders_', '');
    await viewUserOrders(ctx, userId);
  }
}

async function showUserMenu(ctx) {
  // Get user statistics
  const stats = await global.pool.query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE status = 'active') as active_users,
      COUNT(*) FILTER (WHERE status = 'blocked_permanent') as blocked_permanent,
      COUNT(*) FILTER (WHERE status = 'blocked_temp') as blocked_temp,
      COUNT(*) FILTER (WHERE joined_at > NOW() - INTERVAL '24 hours') as joined_today
    FROM users
  `);

  const recentUsers = await global.pool.query(`
    SELECT user_id, username, first_name, status, joined_at
    FROM users
    ORDER BY joined_at DESC
    LIMIT 5
  `);

  let message = "👥 *User Management*\n\n";
  message += `📊 *Statistics*\n`;
  message += `├ Total Users: ${stats.rows[0].total_users}\n`;
  message += `├ Active: ${stats.rows[0].active_users}\n`;
  message += `├ Blocked (Permanent): ${stats.rows[0].blocked_permanent}\n`;
  message += `├ Blocked (Temporary): ${stats.rows[0].blocked_temp}\n`;
  message += `└ Joined Today: ${stats.rows[0].joined_today}\n\n`;

  message += "*Recent Users:*\n";
  recentUsers.rows.forEach(user => {
    const statusEmoji = user.status === 'active' ? '🟢' : '🔴';
    message += `${statusEmoji} ${user.first_name} (@${user.username || 'No username'}) - ${moment(user.joined_at).fromNow()}\n`;
  });

  const buttons = [
    [
      { text: '🔍 Search User', callback_data: 'admin_user_search' },
      { text: '📋 List All', callback_data: 'admin_user_list' }
    ],
    [
      { text: '⛔ Blocked Users', callback_data: 'admin_user_blocked' }
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

async function viewUser(ctx, userId) {
  const user = await global.pool.query(`
    SELECT u.*, 
           COUNT(o.id) as total_orders,
           COALESCE(SUM(o.total_amount), 0) as total_spent,
           COUNT(DISTINCT s.id) as support_tickets
    FROM users u
    LEFT JOIN orders o ON u.user_id = o.user_id
    LEFT JOIN support_tickets s ON u.user_id = s.user_id
    WHERE u.user_id = $1
    GROUP BY u.user_id
  `, [userId]);

  if (user.rows.length === 0) {
    return ctx.reply('User not found.');
  }

  const u = user.rows[0];
  
  const statusEmoji = u.status === 'active' ? '🟢' : '🔴';
  const blockInfo = u.status !== 'active' ? 
    `\nBlock Reason: ${u.block_reason || 'N/A'}` +
    (u.block_expiry ? `\nBlock Expiry: ${moment(u.block_expiry).format('DD/MM/YYYY HH:mm')}` : '') : '';

  const message = 
    `👤 *User Details*\n\n` +
    `🆔 *User ID:* \`${u.user_id}\`\n` +
    `👤 *Name:* ${u.first_name} ${u.last_name || ''}\n` +
    `📱 *Username:* @${u.username || 'N/A'}\n` +
    `📊 *Status:* ${statusEmoji} ${u.status}\n` +
    `${blockInfo}\n` +
    `📅 *Joined:* ${moment(u.joined_at).format('DD/MM/YYYY HH:mm')}\n` +
    `🕐 *Last Active:* ${moment(u.last_active).fromNow()}\n\n` +
    `📦 *Orders:* ${u.total_orders}\n` +
    `💰 *Total Spent:* ₹${parseFloat(u.total_spent).toFixed(2)}\n` +
    `🎫 *Support Tickets:* ${u.support_tickets || 0}`;

  const buttons = [];

  if (u.status === 'active') {
    buttons.push([
      { text: '⛔ Block Permanent', callback_data: `admin_user_block_${u.user_id}` },
      { text: '⏳ Block Temporary', callback_data: `admin_user_tempblock_${u.user_id}` }
    ]);
  } else {
    buttons.push([
      { text: '✅ Unblock', callback_data: `admin_user_unblock_${u.user_id}` }
    ]);
  }

  buttons.push(
    [
      { text: '📦 View Orders', callback_data: `admin_user_orders_${u.user_id}` },
      { text: '💬 Send Message', callback_data: `admin_user_message_${u.user_id}` }
    ],
    [{ text: '🔙 Back', callback_data: 'admin_users' }]
  );

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function blockUser(ctx, userId) {
  await ctx.reply(
    "⛔ *Block User Permanently*\n\n" +
    "Enter reason for blocking:",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'block_user_permanent';
  ctx.session.targetUserId = userId;
}

async function tempBlockUser(ctx, userId) {
  await ctx.reply(
    "⏳ *Temporary Block User*\n\n" +
    "Enter duration in minutes and reason.\n\n" +
    "Format: `minutes|reason`\n" +
    "Example: `30|Suspicious activity`",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'block_user_temp';
  ctx.session.targetUserId = userId;
}

async function unblockUser(ctx, userId) {
  await global.pool.query(
    `UPDATE users 
     SET status = 'active', block_reason = NULL, block_expiry = NULL 
     WHERE user_id = $1`,
    [userId]
  );

  await ctx.answerCbQuery('✅ User unblocked successfully!');
  await viewUser(ctx, userId);
}

async function messageUser(ctx, userId) {
  await ctx.reply(
    "💬 *Send Message to User*\n\n" +
    "Enter your message (can include text and photo):",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'message_user';
  ctx.session.targetUserId = userId;
}

async function viewUserOrders(ctx, userId) {
  const orders = await global.pool.query(`
    SELECT o.*, c.name as category_name
    FROM orders o
    LEFT JOIN categories c ON o.category_id = c.id
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC
    LIMIT 10
  `, [userId]);

  if (orders.rows.length === 0) {
    return ctx.reply('📦 No orders found for this user.');
  }

  let message = `📦 *Orders for User ${userId}*\n\n`;
  
  orders.rows.forEach((order, i) => {
    const statusEmoji = order.status === 'completed' ? '✅' : 
                       order.status === 'pending' ? '⏳' : '❌';
    message += 
      `${i+1}. *${order.order_id}*\n` +
      `   ${order.category_name} x${order.quantity}\n` +
      `   ₹${order.total_amount} ${statusEmoji}\n` +
      `   ${moment(order.created_at).format('DD/MM/YYYY')}\n\n`;
  });

  const buttons = [
    [{ text: '🔙 Back', callback_data: `admin_user_view_${userId}` }]
  ];

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function resolveTicket(ctx, ticketId) {
  await global.pool.query(
    `UPDATE support_tickets 
     SET status = 'resolved', resolved_at = NOW() 
     WHERE ticket_id = $1`,
    [ticketId]
  );

  await ctx.answerCbQuery('✅ Ticket marked as resolved!');
}

async function blockUserFromTicket(ctx, userId) {
  await global.pool.query(
    `UPDATE users 
     SET status = 'blocked_permanent', 
         block_reason = 'Blocked from support ticket' 
     WHERE user_id = $1`,
    [userId]
  );

  await ctx.answerCbQuery('⛔ User blocked permanently!');
}

async function replyToTicket(ctx, ticketId) {
  await ctx.reply(
    "💬 *Reply to Support Ticket*\n\n" +
    "Enter your reply:",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'reply_ticket';
  ctx.session.ticketId = ticketId;
}

module.exports = { 
  handle, 
  viewUser, 
  blockUser, 
  unblockUser, 
  tempBlockUser, 
  messageUser,
  viewUserOrders,
  resolveTicket,
  blockUserFromTicket,
  replyToTicket
};
