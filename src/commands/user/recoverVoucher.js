const db = require('../../database/database');
const { Markup } = require('telegraf');

// Store recovery sessions
const recoverySessions = new Map();

module.exports = async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Set waiting for order ID
    recoverySessions.set(userId, { waitingForOrderId: true });
    
    await ctx.reply(
      '🔁 *Recover Vouchers*\n\n' +
      'Send your Order ID\n' +
      'Example: `SVH-1234567890-ABC123`\n\n' +
      '⚠️ Recovery available for 2 hours only after order.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{ text: '↩️ Back' }]],
          resize_keyboard: true
        }
      }
    );
    
  } catch (error) {
    console.error('Recover voucher error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};

// Handle order ID input
module.exports.handleOrderId = async (ctx, orderId) => {
  try {
    const userId = ctx.from.id;
    const session = recoverySessions.get(userId);
    
    if (!session || !session.waitingForOrderId) {
      return false;
    }
    
    // Validate order ID format
    const orderIdRegex = /^SVH-[A-Z0-9]+-[A-Z0-9]+$/;
    if (!orderIdRegex.test(orderId)) {
      await ctx.reply('❌ Invalid Order ID format.\nExample: SVH-1234567890-ABC123');
      return true;
    }
    
    // Get order from database
    const order = await db.getOrder(orderId);
    
    if (!order) {
      await ctx.reply(`⚠️ Order not found: ${orderId}`);
      return true;
    }
    
    // Check if order belongs to this user
    if (order.user_id !== userId) {
      await ctx.reply('❌ This Order ID does not belong to your account.');
      return true;
    }
    
    // Check if order is successful
    if (order.status !== 'success') {
      await ctx.reply('❌ Recovery only available for successful orders.');
      return true;
    }
    
    // Check if within 2 hours
    const orderTime = new Date(order.created_at);
    const now = new Date();
    const hoursDiff = (now - orderTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 2) {
      await ctx.reply('❌ Recovery period expired (2 hours only).');
      return true;
    }
    
    // Check recovery attempts
    if (order.recovery_attempts >= 3) {
      await ctx.reply('❌ Maximum recovery attempts reached. Contact support.');
      return true;
    }
    
    // Increment recovery attempts
    await db.query(
      'UPDATE orders SET recovery_attempts = recovery_attempts + 1 WHERE order_id = ?',
      [orderId]
    );
    
    // Get voucher codes
    const codes = await db.getDeliveredCodes(orderId);
    
    if (!codes || codes.length === 0) {
      await ctx.reply('❌ No codes found for this order. Contact support.');
      return true;
    }
    
    // Send codes
    let message = `✅ *Recovery Successful*\n\nOrder ID: \`${orderId}\`\n\n`;
    codes.forEach((code, index) => {
      message += `🔑 Code ${index + 1}: \`${code}\`\n`;
    });
    
    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[{ text: '↩️ Back' }]],
        resize_keyboard: true
      }
    });
    
    // Clear session
    recoverySessions.delete(userId);
    return true;
    
  } catch (error) {
    console.error('Recovery order ID error:', error);
    await ctx.reply('An error occurred. Please try again.');
    return true;
  }
};

// Handle admin recovery response
module.exports.handleAdminRecovery = async (ctx, orderId, newCode, photo) => {
  try {
    const order = await db.getOrder(orderId);
    if (!order) return false;
    
    // Send new code to user
    if (photo) {
      await ctx.telegram.sendPhoto(order.user_id, photo, {
        caption: `✅ *Recovery Resolved*\n\nOrder: \`${orderId}\`\n\nNew code has been sent.`,
        parse_mode: 'Markdown'
      });
    } else {
      await ctx.telegram.sendMessage(order.user_id,
        `✅ *Recovery Resolved*\n\n` +
        `Order: \`${orderId}\`\n` +
        `New Code: \`${newCode}\`\n\n` +
        `If you face any issues, contact support.`,
        { parse_mode: 'Markdown' }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Admin recovery error:', error);
    return false;
  }
};

// Handle admin recovery rejection
module.exports.handleAdminRejection = async (ctx, orderId, reason) => {
  try {
    const order = await db.getOrder(orderId);
    if (!order) return false;
    
    await ctx.telegram.sendMessage(order.user_id,
      `❌ *Recovery Rejected*\n\n` +
      `Order: \`${orderId}\`\n` +
      `Reason: ${reason}\n\n` +
      `Contact support for more information.`,
      { parse_mode: 'Markdown' }
    );
    
    return true;
  } catch (error) {
    console.error('Admin rejection error:', error);
    return false;
  }
};

module.exports.recoverySessions = recoverySessions;
