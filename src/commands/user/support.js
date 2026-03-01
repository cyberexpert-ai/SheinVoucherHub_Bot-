const { Markup } = require('telegraf');
const { v4: uuidv4 } = require('uuid');

async function start(ctx) {
  const message = 
    "🆘 *Support Center*\n\n" +
    "How can we help you today?\n\n" +
    "• Voucher issues\n" +
    "• Payment problems\n" +
    "• Recovery assistance\n" +
    "• General inquiries\n\n" +
    "Please describe your issue in detail.";

  const buttons = [
    [Markup.button.callback('↩️ Leave', 'leave_support')]
  ];

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons,
      force_reply: true
    }
  });

  // Set user state to expect support message
  ctx.session = ctx.session || {};
  ctx.session.awaitingSupport = true;
}

async function handleSupportMessage(ctx, messageText, photo) {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || 'No username';
    const firstName = ctx.from.first_name;
    
    // Generate ticket ID
    const ticketId = `TKT-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Save ticket to database
    const ticket = await global.pool.query(
      `INSERT INTO support_tickets (ticket_id, user_id, message, photo, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [ticketId, userId, messageText, photo || null, 'open']
    );

    // Forward to admin
    const adminMessage = 
      "🎫 *New Support Ticket*\n\n" +
      `🆔 *Ticket ID:* \`${ticketId}\`\n` +
      `👤 *User:* ${firstName} (@${username})\n` +
      `🆔 *User ID:* \`${userId}\`\n` +
      `📝 *Message:*\n${messageText}\n\n` +
      `📅 *Time:* ${new Date().toLocaleString()}`;

    const adminId = process.env.ADMIN_ID;

    if (photo) {
      await ctx.telegram.sendPhoto(adminId, photo, {
        caption: adminMessage,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback(`✅ Mark Resolved`, `admin_ticket_resolve_${ticketId}`),
              Markup.button.callback(`⛔ Block User`, `admin_ticket_block_${userId}`)
            ],
            [
              Markup.button.callback(`💬 Reply`, `admin_ticket_reply_${ticketId}`)
            ]
          ]
        }
      });
    } else {
      await ctx.telegram.sendMessage(adminId, adminMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback(`✅ Mark Resolved`, `admin_ticket_resolve_${ticketId}`),
              Markup.button.callback(`⛔ Block User`, `admin_ticket_block_${userId}`)
            ],
            [
              Markup.button.callback(`💬 Reply`, `admin_ticket_reply_${ticketId}`)
            ]
          ]
        }
      });
    }

    // Confirm to user
    await ctx.reply(
      "✅ *Support Request Sent*\n\n" +
      `Your ticket ID: \`${ticketId}\`\n\n` +
      "Our support team will respond shortly. Please be patient.\n\n" +
      "⚠️ *Warning:* Fake or timepass messages may result in account restrictions.",
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('🔙 Back', 'back_to_main')]
          ]
        }
      }
    );

    // Log support activity
    await global.pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, $2, $3)`,
      [userId, 'support_ticket_created', { ticket_id: ticketId }]
    );

  } catch (error) {
    console.error('Support message error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
}

module.exports = { start, handleSupportMessage };
