const { Markup } = require('telegraf');

async function handle(ctx) {
  const action = ctx.callbackQuery.data;
  
  if (action === 'admin_broadcast') {
    await showBroadcastMenu(ctx);
  } else if (action === 'admin_broadcast_new') {
    await newBroadcast(ctx);
  } else if (action === 'admin_broadcast_history') {
    await showBroadcastHistory(ctx);
  } else if (action.startsWith('admin_broadcast_delete_')) {
    const broadcastId = action.replace('admin_broadcast_delete_', '');
    await deleteBroadcast(ctx, broadcastId);
  } else if (action.startsWith('admin_broadcast_resend_')) {
    const broadcastId = action.replace('admin_broadcast_resend_', '');
    await resendBroadcast(ctx, broadcastId);
  }
}

async function showBroadcastMenu(ctx) {
  const stats = await global.pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'failed') as failed
    FROM broadcasts
  `);

  const message = 
    "📢 *Broadcast Management*\n\n" +
    `📊 *Statistics*\n` +
    `├ Total Broadcasts: ${stats.rows[0].total}\n` +
    `├ Pending: ${stats.rows[0].pending}\n` +
    `├ Sent: ${stats.rows[0].sent}\n` +
    `└ Failed: ${stats.rows[0].failed}\n`;

  const buttons = [
    [
      { text: '📢 New Broadcast', callback_data: 'admin_broadcast_new' },
      { text: '📋 History', callback_data: 'admin_broadcast_history' }
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

async function newBroadcast(ctx) {
  await ctx.reply(
    "📢 *Create New Broadcast*\n\n" +
    "Send the message you want to broadcast.\n\n" +
    "You can include:\n" +
    "• Text with markdown\n" +
    "• Photo (as caption)\n" +
    "• Buttons (specify in next step)\n\n" +
    "Send your message:",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'create_broadcast_step1';
}

async function showBroadcastHistory(ctx) {
  const broadcasts = await global.pool.query(`
    SELECT * FROM broadcasts 
    ORDER BY created_at DESC 
    LIMIT 10
  `);

  if (broadcasts.rows.length === 0) {
    return ctx.reply('No broadcasts found.');
  }

  let message = "📋 *Broadcast History*\n\n";
  const buttons = [];

  broadcasts.rows.forEach((b, i) => {
    const statusEmoji = b.status === 'sent' ? '✅' : 
                       b.status === 'pending' ? '⏳' : '❌';
    message += `${i+1}. ${statusEmoji} ${new Date(b.created_at).toLocaleDateString()}\n`;
    message += `   Sent: ${b.sent_count}/${b.total_count}\n`;
    message += `   Target: ${b.target_type || 'all'}\n\n`;
    
    buttons.push([
      { text: `📢 View #${i+1}`, callback_data: `admin_broadcast_view_${b.id}` },
      { text: `🗑 Delete`, callback_data: `admin_broadcast_delete_${b.id}` }
    ]);
  });

  buttons.push([{ text: '🔙 Back', callback_data: 'admin_broadcast' }]);

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function deleteBroadcast(ctx, broadcastId) {
  await global.pool.query('DELETE FROM broadcasts WHERE id = $1', [broadcastId]);
  await ctx.answerCbQuery('✅ Broadcast deleted!');
}

async function resendBroadcast(ctx, broadcastId) {
  const broadcast = await global.pool.query(
    'SELECT * FROM broadcasts WHERE id = $1',
    [broadcastId]
  );

  if (broadcast.rows.length === 0) {
    return ctx.reply('Broadcast not found.');
  }

  const b = broadcast.rows[0];

  // Get all active users
  const users = await global.pool.query(
    'SELECT user_id FROM users WHERE status = $1',
    ['active']
  );

  let sent = 0;
  let failed = 0;

  for (const user of users.rows) {
    try {
      await ctx.telegram.sendMessage(user.user_id, b.message, {
        parse_mode: 'Markdown',
        ...(b.buttons ? { reply_markup: b.buttons } : {})
      });
      sent++;
    } catch (error) {
      failed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  await global.pool.query(
    `UPDATE broadcasts 
     SET status = 'sent', sent_count = $1, total_count = $2 
     WHERE id = $3`,
    [sent, users.rowCount, broadcastId]
  );

  await ctx.reply(
    `✅ *Broadcast Resent*\n\n` +
    `Total Users: ${users.rowCount}\n` +
    `✅ Sent: ${sent}\n` +
    `❌ Failed: ${failed}`
  );
}

module.exports = { handle };
