const db = require('../../database/database');
const { Markup } = require('telegraf');

// Store support sessions
const supportSessions = new Map();

module.exports = async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Set waiting for message
    supportSessions.set(userId, { waitingForMessage: true });
    
    await ctx.reply(
      '🆘 *Support*\n\n' +
      'Describe your issue in detail.\n' +
      'You can also send screenshots.\n\n' +
      '⚠️ *Rules:*\n' +
      '• No fake reports\n' +
      '• No timepass\n' +
      '• Illegal messages = Permanent ban\n\n' +
      'We will respond as soon as possible.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{ text: '⬅️ Leave' }]],
          resize_keyboard: true
        }
      }
    );
    
  } catch (error) {
    console.error('Support error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};

// Handle support message
module.exports.handleMessage = async (ctx, text, photo) => {
  try {
    const userId = ctx.from.id;
    const session = supportSessions.get(userId);
    
    if (!session || !session.waitingForMessage) {
      return false;
    }
    
    // Check for inappropriate content (basic filter)
    const bannedWords = ['fake', 'timepass', 'scam', 'illegal', 'abuse'];
    const lowerText = text?.toLowerCase() || '';
    
    if (bannedWords.some(word => lowerText.includes(word))) {
      // Block user temporarily
      await db.blockUser(userId, 'Inappropriate support message', 30);
      
      await ctx.reply('🚫 You have been temporarily blocked for inappropriate message. Try again after 30 minutes.');
      return true;
    }
    
    // Create support ticket
    let fileId = null;
    if (photo) {
      fileId = photo.file_id;
    }
    
    const ticketId = await db.createSupportTicket(userId, text || 'Photo message', fileId);
    
    // Get user info
    const user = await db.getUser(userId);
    
    // Forward to admin
    const adminId = process.env.ADMIN_ID;
    
    let adminMessage = 
      `🆘 *New Support Ticket*\n\n` +
      `Ticket: \`${ticketId}\`\n` +
      `User: ${user.first_name || ''} ${user.last_name || ''}\n` +
      `Username: @${user.username || 'N/A'}\n` +
      `User ID: \`${userId}\`\n\n` +
      `Message: ${text || 'Photo message'}`;
    
    if (photo) {
      await ctx.telegram.sendPhoto(adminId, fileId, {
        caption: adminMessage,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('📝 Reply', `reply_ticket_${ticketId}`)],
          [Markup.button.callback('🔨 Block User', `block_user_${userId}`)],
          [Markup.button.callback('✅ Close', `close_ticket_${ticketId}`)]
        ]).reply_markup
      });
    } else {
      await ctx.telegram.sendMessage(adminId, adminMessage, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('📝 Reply', `reply_ticket_${ticketId}`)],
          [Markup.button.callback('🔨 Block User', `block_user_${userId}`)],
          [Markup.button.callback('✅ Close', `close_ticket_${ticketId}`)]
        ]).reply_markup
      });
    }
    
    await ctx.reply('✅ Your message has been sent to support. We will get back to you soon.', {
      reply_markup: {
        keyboard: [[{ text: '⬅️ Leave' }]],
        resize_keyboard: true
      }
    });
    
    // Clear session
    supportSessions.delete(userId);
    return true;
    
  } catch (error) {
    console.error('Support message error:', error);
    await ctx.reply('An error occurred. Please try again.');
    return true;
  }
};

// Handle admin reply
module.exports.handleAdminReply = async (ctx, ticketId, replyText) => {
  try {
    // Get ticket info
    const tickets = await db.query(
      'SELECT * FROM support_tickets WHERE ticket_id = ?',
      [ticketId]
    );
    
    if (!tickets[0]) return false;
    
    const ticket = tickets[0];
    
    // Update ticket
    await db.replyToTicket(ticketId, replyText, ctx.from.id);
    
    // Send reply to user
    await ctx.telegram.sendMessage(ticket.user_id,
      `📝 *Support Reply*\n\n` +
      `${replyText}\n\n` +
      `If you have more questions, send /start and use Support again.`,
      { parse_mode: 'Markdown' }
    );
    
    return true;
  } catch (error) {
    console.error('Admin reply error:', error);
    return false;
  }
};

module.exports.supportSessions = supportSessions;
