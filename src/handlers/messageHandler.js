const { Markup } = require('telegraf');
const { processRecovery } = require('../commands/user/recoverVoucher');
const { handleSupportMessage } = require('../commands/user/support');
const { handleCustomQuantity, confirmPaid } = require('../commands/user/buyVoucher');
const { blockUser, unblockUser, tempBlockUser, messageUser, replyToTicket } = require('../commands/admin/userManage');
const { rejectOrder, processRecoveryAccept, processRecoveryReject } = require('../commands/admin/orderManage');
const { deleteOldMessage } = require('../utils/helpers');
const { v4: uuidv4 } = require('uuid');

async function messageHandler(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;
    const isAdmin = userId.toString() === process.env.ADMIN_ID;

    // Check if user is blocked
    const userCheck = await global.pool.query(
      'SELECT status FROM users WHERE user_id = $1',
      [userId]
    );

    if (userCheck.rows.length > 0 && userCheck.rows[0].status !== 'active') {
      if (messageText.toLowerCase().includes('support')) {
        // Allow support messages even when blocked
        ctx.session = ctx.session || {};
        ctx.session.awaitingSupport = true;
        await handleSupportMessage(ctx, messageText, null);
      } else {
        await ctx.reply(
          "⛔ Your account is restricted. Only support messages are allowed.",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🆘 Contact Support", callback_data: "support" }]
              ]
            }
          }
        );
      }
      return;
    }

    // Handle admin actions
    if (isAdmin && ctx.session?.adminAction) {
      await handleAdminAction(ctx);
      return;
    }

    // Handle user session states
    if (ctx.session) {
      // Awaiting screenshot for payment
      if (ctx.session.awaitingScreenshot) {
        await ctx.reply(
          "❌ Please send a photo/screenshot, not text.\n" +
          "Click the 'Paid' button again and send the screenshot."
        );
        return;
      }

      // Awaiting custom quantity
      if (ctx.session.awaitingCustomQuantity) {
        const quantity = parseInt(messageText);
        const categoryId = ctx.session.awaitingCustomQuantity;
        
        if (isNaN(quantity) || quantity < 1) {
          return ctx.reply('❌ Please enter a valid number.');
        }

        const { selectQuantity } = require('../commands/user/buyVoucher');
        await selectQuantity(ctx, categoryId, quantity);
        ctx.session.awaitingCustomQuantity = null;
        return;
      }

      // Awaiting recovery order ID
      if (ctx.session.awaitingRecovery) {
        await processRecovery(ctx, messageText);
        ctx.session.awaitingRecovery = false;
        return;
      }

      // Awaiting support message
      if (ctx.session.awaitingSupport) {
        await handleSupportMessage(ctx, messageText, null);
        ctx.session.awaitingSupport = false;
        return;
      }
    }

    // If no session state, show invalid message
    await ctx.reply(
      "❌ *Invalid Command*\n\n" +
      "Please use the buttons or /start to begin.",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🏠 Main Menu", callback_data: "back_to_main" }]
          ]
        }
      }
    );

  } catch (error) {
    console.error('Message handler error:', error);
    ctx.reply('An error occurred. Please try again.');
  }
}

async function handleAdminAction(ctx) {
  const action = ctx.session.adminAction;
  const messageText = ctx.message.text;

  switch (action) {
    case 'add_category':
      // Parse category: Name|Value|Description
      const [catName, catValue, catDesc] = messageText.split('|').map(s => s.trim());
      if (!catName || !catValue) {
        return ctx.reply('❌ Invalid format. Use: Name|Value|Description');
      }

      await global.pool.query(
        'INSERT INTO categories (name, value, description) VALUES ($1, $2, $3)',
        [catName, parseFloat(catValue), catDesc || '']
      );

      await ctx.reply('✅ Category added successfully!');
      break;

    case 'add_voucher':
      // Add single voucher
      await global.pool.query(
        'INSERT INTO vouchers (code, category_id) VALUES ($1, $2)',
        [messageText, ctx.session.categoryId]
      );

      await ctx.reply('✅ Voucher added successfully!');
      break;

    case 'bulk_add_vouchers':
      // Add multiple vouchers
      const codes = messageText.split('\n').map(c => c.trim()).filter(c => c);
      
      for (const code of codes) {
        await global.pool.query(
          'INSERT INTO vouchers (code, category_id) VALUES ($1, $2)',
          [code, ctx.session.categoryId]
        );
      }

      await ctx.reply(`✅ Added ${codes.length} vouchers successfully!`);
      break;

    case 'block_user_permanent':
      await global.pool.query(
        `UPDATE users 
         SET status = 'blocked_permanent', block_reason = $1 
         WHERE user_id = $2`,
        [messageText, ctx.session.targetUserId]
      );

      await ctx.reply('✅ User blocked permanently!');
      break;

    case 'block_user_temp':
      const [minutes, reason] = messageText.split('|').map(s => s.trim());
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + parseInt(minutes));

      await global.pool.query(
        `UPDATE users 
         SET status = 'blocked_temp', block_reason = $1, block_expiry = $2 
         WHERE user_id = $3`,
        [reason || 'Temporary block', expiryTime, ctx.session.targetUserId]
      );

      await ctx.reply(`✅ User blocked for ${minutes} minutes!`);
      break;

    case 'message_user':
      await ctx.telegram.sendMessage(ctx.session.targetUserId, messageText, {
        parse_mode: 'Markdown'
      });
      await ctx.reply('✅ Message sent to user!');
      break;

    case 'reject_order':
      await global.pool.query(
        `UPDATE orders 
         SET status = 'rejected', admin_notes = $1, updated_at = NOW() 
         WHERE order_id = $2`,
        [messageText, ctx.session.orderId]
      );

      // Notify user
      await ctx.telegram.sendMessage(
        (await global.pool.query('SELECT user_id FROM orders WHERE order_id = $1', [ctx.session.orderId])).rows[0].user_id,
        `❌ *Order Rejected*\n\nOrder ID: \`${ctx.session.orderId}\`\nReason: ${messageText}`,
        { parse_mode: 'Markdown' }
      );

      await ctx.reply('✅ Order rejected!');
      break;

    case 'recovery_accept':
      const newCodes = messageText.split('\n').map(c => c.trim()).filter(c => c);
      
      // Add new vouchers and link to order
      for (const code of newCodes) {
        const voucher = await global.pool.query(
          'INSERT INTO vouchers (code, category_id, status) VALUES ($1, $2, $3) RETURNING id',
          [code, (await global.pool.query('SELECT category_id FROM orders WHERE order_id = $1', [ctx.session.orderId])).rows[0].category_id, 'sold']
        );

        await global.pool.query(
          'INSERT INTO order_vouchers (order_id, voucher_id) VALUES ($1, $2)',
          [ctx.session.orderId, voucher.rows[0].id]
        );
      }

      // Notify user
      await ctx.telegram.sendMessage(
        (await global.pool.query('SELECT user_id FROM orders WHERE order_id = $1', [ctx.session.orderId])).rows[0].user_id,
        `✅ *Recovery Successful*\n\nOrder ID: \`${ctx.session.orderId}\`\nNew vouchers have been sent.`,
        { parse_mode: 'Markdown' }
      );

      await ctx.reply('✅ Recovery processed successfully!');
      break;

    case 'recovery_reject':
      await ctx.telegram.sendMessage(
        (await global.pool.query('SELECT user_id FROM orders WHERE order_id = $1', [ctx.session.orderId])).rows[0].user_id,
        `❌ *Recovery Rejected*\n\nOrder ID: \`${ctx.session.orderId}\`\nReason: ${messageText}`,
        { parse_mode: 'Markdown' }
      );

      await ctx.reply('✅ Recovery rejected!');
      break;

    case 'reply_ticket':
      const ticket = await global.pool.query(
        'SELECT user_id FROM support_tickets WHERE ticket_id = $1',
        [ctx.session.ticketId]
      );

      await ctx.telegram.sendMessage(
        ticket.rows[0].user_id,
        `💬 *Support Reply*\n\n${messageText}`,
        { parse_mode: 'Markdown' }
      );

      await global.pool.query(
        `UPDATE support_tickets 
         SET admin_response = $1, status = 'resolved', resolved_at = NOW() 
         WHERE ticket_id = $2`,
        [messageText, ctx.session.ticketId]
      );

      await ctx.reply('✅ Reply sent and ticket resolved!');
      break;

    case 'create_broadcast_step1':
      ctx.session.broadcastMessage = messageText;
      ctx.session.adminAction = 'create_broadcast_step2';
      
      await ctx.reply(
        "📢 *Broadcast Step 2*\n\n" +
        "Do you want to add buttons?\n" +
        "Send button configuration or 'skip' to continue.\n\n" +
        "Format: `button_text|callback_data` (one per line)\n" +
        "Example:\n" +
        "Visit Website|https://example.com\n" +
        "Contact Support|support",
        {
          parse_mode: 'Markdown',
          reply_markup: {
            force_reply: true
          }
        }
      );
      break;

    case 'create_broadcast_step2':
      let buttons = null;
      if (messageText.toLowerCase() !== 'skip') {
        const buttonLines = messageText.split('\n');
        const inlineKeyboard = [];
        
        for (const line of buttonLines) {
          const [text, data] = line.split('|').map(s => s.trim());
          if (text && data) {
            inlineKeyboard.push([{ text, callback_data: data }]);
          }
        }
        
        if (inlineKeyboard.length > 0) {
          buttons = { inline_keyboard: inlineKeyboard };
        }
      }

      ctx.session.broadcastButtons = buttons;
      ctx.session.adminAction = 'create_broadcast_step3';

      await ctx.reply(
        "📢 *Broadcast Step 3*\n\n" +
        "Select target audience:\n" +
        "1. All users\n" +
        "2. Active users only\n" +
        "3. Specific user ID\n\n" +
        "Send option number or user ID:",
        {
          parse_mode: 'Markdown',
          reply_markup: {
            force_reply: true
          }
        }
      );
      break;

    case 'create_broadcast_step3':
      let targetType = 'all';
      let targetValue = null;

      if (messageText === '1') {
        targetType = 'all';
      } else if (messageText === '2') {
        targetType = 'active';
      } else {
        targetType = 'specific';
        targetValue = messageText;
      }

      // Get users based on target
      let usersQuery = 'SELECT user_id FROM users WHERE status = $1';
      let usersParams = ['active'];
      
      if (targetType === 'specific' && targetValue) {
        usersQuery = 'SELECT user_id FROM users WHERE user_id = $1';
        usersParams = [targetValue];
      }

      const users = await global.pool.query(usersQuery, usersParams);

      // Save broadcast
      const broadcast = await global.pool.query(
        `INSERT INTO broadcasts (message, buttons, target_type, target_value, created_by, total_count)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          ctx.session.broadcastMessage,
          ctx.session.broadcastButtons ? JSON.stringify(ctx.session.broadcastButtons) : null,
          targetType,
          targetValue,
          ctx.from.id,
          users.rowCount
        ]
      );

      // Send broadcast
      let sent = 0;
      let failed = 0;

      for (const user of users.rows) {
        try {
          await ctx.telegram.sendMessage(user.user_id, ctx.session.broadcastMessage, {
            parse_mode: 'Markdown',
            ...(ctx.session.broadcastButtons ? { reply_markup: ctx.session.broadcastButtons } : {})
          });
          sent++;
        } catch (error) {
          failed++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Update broadcast status
      await global.pool.query(
        'UPDATE broadcasts SET status = $1, sent_count = $2 WHERE id = $3',
        ['sent', sent, broadcast.rows[0].id]
      );

      await ctx.reply(
        `✅ *Broadcast Complete*\n\n` +
        `Total Users: ${users.rowCount}\n` +
        `✅ Sent: ${sent}\n` +
        `❌ Failed: ${failed}`
      );
      break;
  }

  // Clear admin session
  ctx.session.adminAction = null;
}

module.exports = messageHandler;
