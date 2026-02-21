/**
 * Recover Voucher Handler
 * Location: /src/commands/user/recoverVoucher.js
 */

const db = require('../../database/database');
const { Markup } = require('telegraf');
const moment = require('moment');

// Store recovery sessions
const recoverySessions = new Map();

module.exports = async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Clear any existing session
    recoverySessions.delete(userId);
    
    // Set waiting for order ID
    recoverySessions.set(userId, { 
      waitingForOrderId: true,
      timestamp: Date.now()
    });
    
    await ctx.reply(
      '🔁 *RECOVER VOUCHERS*\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      'Send your Order ID to recover your vouchers.\n\n' +
      '📋 *Order ID Format:*\n' +
      '`SVH-XXXXXXX-XXXXXX`\n\n' +
      'Example: `SVH-1234567890-ABC123`\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '⚠️ *Important:*\n' +
      '• Recovery available for 2 hours only\n' +
      '• Must be your own order\n' +
      '• Maximum 3 recovery attempts\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━',
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
    ctx.reply('❌ An error occurred. Please try again later.');
  }
};

/**
 * Handle order ID input
 * @param {Object} ctx - Telegraf context
 * @param {string} orderId - Order ID from user
 * @returns {boolean} - True if handled
 */
module.exports.handleOrderId = async (ctx, orderId) => {
  try {
    const userId = ctx.from.id;
    const session = recoverySessions.get(userId);
    
    if (!session || !session.waitingForOrderId) {
      return false;
    }
    
    // Clean order ID
    orderId = orderId.trim().toUpperCase();
    
    // Validate order ID format
    const orderIdRegex = /^SVH-[A-Z0-9]+-[A-Z0-9]+$/;
    if (!orderIdRegex.test(orderId)) {
      await ctx.reply(
        '❌ *INVALID ORDER ID*\n\n' +
        'Please send a valid Order ID.\n\n' +
        'Format: `SVH-XXXXXXX-XXXXXX`\n' +
        'Example: `SVH-1234567890-ABC123`',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '↩️ Back' }]],
            resize_keyboard: true
          }
        }
      );
      return true;
    }
    
    // Get order from database
    const order = await db.getOrder(orderId);
    
    if (!order) {
      await ctx.reply(
        `⚠️ *ORDER NOT FOUND*\n\n` +
        `\`${orderId}\`\n\n` +
        'This Order ID does not exist in our system.\n\n' +
        'Please check and try again.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '↩️ Back' }]],
            resize_keyboard: true
          }
        }
      );
      return true;
    }
    
    // Check if order belongs to this user
    if (order.user_id !== userId) {
      await ctx.reply(
        '❌ *UNAUTHORIZED ACCESS*\n\n' +
        'This Order ID does not belong to your account.\n\n' +
        'You can only recover your own orders.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '↩️ Back' }]],
            resize_keyboard: true
          }
        }
      );
      return true;
    }
    
    // Check if order is successful
    if (order.status !== 'success') {
      const statusEmoji = {
        'pending': '⏳',
        'rejected': '❌',
        'expired': '⌛'
      }[order.status] || '📦';
      
      await ctx.reply(
        `${statusEmoji} *ORDER NOT AVAILABLE FOR RECOVERY*\n\n` +
        `Order ID: \`${orderId}\`\n` +
        `Status: ${order.status.toUpperCase()}\n\n` +
        `Recovery is only available for successful orders.`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '↩️ Back' }]],
            resize_keyboard: true
          }
        }
      );
      return true;
    }
    
    // Check if within 2 hours
    const orderTime = new Date(order.created_at);
    const now = new Date();
    const hoursDiff = (now - orderTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 2) {
      await ctx.reply(
        '⌛ *RECOVERY EXPIRED*\n\n' +
        `Order ID: \`${orderId}\`\n` +
        `Order Date: ${moment(orderTime).format('DD/MM/YYYY HH:mm')}\n\n` +
        `Recovery period is only 2 hours after delivery.\n` +
        `This order is now expired.`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '↩️ Back' }]],
            resize_keyboard: true
          }
        }
      );
      return true;
    }
    
    // Check recovery attempts
    if (order.recovery_attempts >= 3) {
      await ctx.reply(
        '⚠️ *MAXIMUM ATTEMPTS REACHED*\n\n' +
        `Order ID: \`${orderId}\`\n\n` +
        `You have used all 3 recovery attempts for this order.\n` +
        `Please contact support for assistance.`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '↩️ Back' }, { text: '🆘 Support' }]],
            resize_keyboard: true
          }
        }
      );
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
      await ctx.reply(
        '❌ *NO CODES FOUND*\n\n' +
        `Order ID: \`${orderId}\`\n\n` +
        'No voucher codes found for this order.\n' +
        'Please contact support immediately.',
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{ text: '↩️ Back' }, { text: '🆘 Support' }]],
            resize_keyboard: true
          }
        }
      );
      return true;
    }
    
    // Format codes for display
    let codesText = '';
    codes.forEach((code, index) => {
      codesText += `${index + 1}. \`${code}\`\n`;
    });
    
    // Send codes
    await ctx.reply(
      `✅ *RECOVERY SUCCESSFUL!*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📋 *Order ID:* \`${orderId}\`\n` +
      `📦 *Category:* ${order.category_name}\n` +
      `🔢 *Quantity:* ${order.quantity}\n` +
      `💰 *Amount:* ₹${order.total_price}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🔑 *YOUR VOUCHER CODES:*\n` +
      `${codesText}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📌 *Instructions:*\n` +
      `• Tap on code to copy\n` +
      `• Use at Shein checkout\n` +
      `• Valid for 100% OFF\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{ text: '↩️ Back' }, { text: '📦 My Orders' }]],
          resize_keyboard: true
        }
      }
    );
    
    // Clear session
    recoverySessions.delete(userId);
    return true;
    
  } catch (error) {
    console.error('Recovery order ID error:', error);
    await ctx.reply(
      '❌ *ERROR*\n\nAn error occurred during recovery.\nPlease try again or contact support.',
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{ text: '↩️ Back' }, { text: '🆘 Support' }]],
          resize_keyboard: true
        }
      }
    );
    return true;
  }
};

/**
 * Handle back button
 * @param {Object} ctx - Telegraf context
 */
module.exports.handleBack = async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Clear recovery session
    recoverySessions.delete(userId);
    
    // Import main menu
    const backCommand = require('./back');
    await backCommand(ctx);
    
  } catch (error) {
    console.error('Recovery back error:', error);
    ctx.reply('❌ Error returning to main menu.');
  }
};

/**
 * Handle admin recovery response
 * @param {Object} ctx - Telegraf context
 * @param {string} orderId - Order ID
 * @param {string} newCode - New voucher code
 * @param {string} photo - Photo file ID (optional)
 * @returns {boolean} - Success status
 */
module.exports.handleAdminRecovery = async (ctx, orderId, newCode, photo) => {
  try {
    const order = await db.getOrder(orderId);
    if (!order) return false;
    
    if (photo) {
      await ctx.telegram.sendPhoto(order.user_id, photo, {
        caption: `✅ *RECOVERY RESOLVED*\n\n` +
                 `Order: \`${orderId}\`\n\n` +
                 `New voucher code has been sent by admin.\n` +
                 `If you face any issues, contact support.`,
        parse_mode: 'Markdown'
      });
    } else {
      await ctx.telegram.sendMessage(order.user_id,
        `✅ *RECOVERY RESOLVED*\n\n` +
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

/**
 * Handle admin recovery rejection
 * @param {Object} ctx - Telegraf context
 * @param {string} orderId - Order ID
 * @param {string} reason - Rejection reason
 * @returns {boolean} - Success status
 */
module.exports.handleAdminRejection = async (ctx, orderId, reason) => {
  try {
    const order = await db.getOrder(orderId);
    if (!order) return false;
    
    await ctx.telegram.sendMessage(order.user_id,
      `❌ *RECOVERY REJECTED*\n\n` +
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

/**
 * Clean up expired recovery sessions
 */
module.exports.cleanupSessions = () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  let cleaned = 0;
  
  for (const [userId, session] of recoverySessions.entries()) {
    if (now - session.timestamp > oneHour) {
      recoverySessions.delete(userId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired recovery sessions`);
  }
};

// Export sessions for other handlers
module.exports.recoverySessions = recoverySessions;

// Run cleanup every 30 minutes
setInterval(() => {
  module.exports.cleanupSessions();
}, 30 * 60 * 1000);
