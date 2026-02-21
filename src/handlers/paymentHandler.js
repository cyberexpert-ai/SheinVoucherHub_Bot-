/**
 * Payment Handler for Shein Voucher Bot
 * Location: /src/handlers/paymentHandler.js
 * Handles complete payment flow: QR display, screenshot, UTR, order creation
 */

const db = require('../database/database');
const { Markup } = require('telegraf');
const PricingManager = require('../utils/pricing');

// Store payment sessions
const paymentSessions = new Map();

class PaymentHandler {
  /**
   * Show payment page with QR code
   * @param {Object} ctx - Telegraf context
   * @param {number} userId - User ID
   * @param {number} categoryId - Category ID
   * @param {number} quantity - Quantity
   * @param {number} totalPrice - Total price
   */
  static async showPaymentPage(ctx, userId, categoryId, quantity, totalPrice) {
    try {
      const category = await db.getCategory(categoryId);
      const qrImage = process.env.QR_IMAGE || 'https://i.supaimg.com/00332ad4-8aa7-408f-8705-55dbc91ea737.jpg';
      
      // Get price breakdown
      const breakdown = PricingManager.getPriceBreakdown(category.name, quantity);
      
      // Store payment session
      paymentSessions.set(userId, {
        categoryId,
        quantity,
        totalPrice,
        step: 'payment_page',
        timestamp: Date.now(),
        categoryName: category.display_name
      });
      
      const paymentText = 
        `💳 *PAYMENT DETAILS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📦 *ORDER SUMMARY*\n` +
        `• Category: ${category.display_name}\n` +
        `• Quantity: ${quantity}\n` +
        `• Price per unit: ₹${breakdown.pricePerUnit}\n` +
        `• Base price: ₹${breakdown.originalTotal}\n` +
        `• Discount: ${breakdown.discount}% (₹${breakdown.savedAmount})\n` +
        `• *TOTAL AMOUNT: ₹${totalPrice}*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📱 *PAYMENT INSTRUCTIONS*\n` +
        `1️⃣ Scan the QR code below\n` +
        `2️⃣ Pay exactly *₹${totalPrice}*\n` +
        `3️⃣ Take SCREENSHOT of payment\n` +
        `4️⃣ Click "I HAVE PAID" button\n` +
        `5️⃣ Send the screenshot\n` +
        `6️⃣ Send UTR/Transaction ID\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *IMPORTANT WARNINGS*\n` +
        `• Fake payments = PERMANENT BAN\n` +
        `• Wrong UTR = PERMANENT BAN\n` +
        `• Reusing UTR = PERMANENT BAN\n` +
        `• No refund after delivery\n` +
        `• Screenshot MUST be original\n` +
        `• UTR must match payment\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🆘 *Support:* @SheinSupportRobot\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━`;
      
      // Send QR code with payment instructions
      await ctx.replyWithPhoto(qrImage, {
        caption: paymentText,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('💰 I HAVE PAID', `payment_paid_${categoryId}_${quantity}_${totalPrice}`)],
          [Markup.button.callback('❌ CANCEL PAYMENT', 'payment_cancel')]
        ]).reply_markup
      });
      
      // Update session
      paymentSessions.set(userId, {
        ...paymentSessions.get(userId),
        step: 'awaiting_payment',
        messageId: ctx.message?.message_id
      });
      
      console.log(`💰 Payment page shown to user ${userId} for ₹${totalPrice}`);
      
    } catch (error) {
      console.error('Show payment page error:', error);
      await ctx.reply('❌ Error loading payment page. Please try again or contact support.');
    }
  }

  /**
   * Handle payment button click
   * @param {Object} ctx - Telegraf context
   * @param {number} categoryId - Category ID
   * @param {number} quantity - Quantity
   * @param {number} totalPrice - Total price
   */
  static async handlePaymentButton(ctx, categoryId, quantity, totalPrice) {
    try {
      const userId = ctx.from.id;
      const session = paymentSessions.get(userId);
      
      if (!session || session.step !== 'awaiting_payment') {
        await ctx.answerCbQuery('❌ Session expired. Please start over from Buy Voucher.', { 
          alert: true 
        });
        return;
      }
      
      // Verify stock again
      const stock = await db.getAvailableStock(categoryId);
      if (quantity > stock) {
        await ctx.answerCbQuery(`❌ Only ${stock} codes available now!`, { alert: true });
        paymentSessions.delete(userId);
        return;
      }
      
      // Update session
      paymentSessions.set(userId, {
        ...session,
        step: 'awaiting_screenshot',
        categoryId,
        quantity,
        totalPrice
      });
      
      await ctx.editMessageCaption(
        `📸 *SEND PAYMENT SCREENSHOT*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ Please send the screenshot of your payment.\n\n` +
        `📋 *SCREENSHOT REQUIREMENTS:*\n` +
        `• Clear and readable screenshot\n` +
        `• Shows payment amount: *₹${totalPrice}*\n` +
        `• Shows UTR/Transaction ID clearly\n` +
        `• Original screenshot (NO EDITS)\n` +
        `• Full screenshot (not cropped)\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *FAKE SCREENSHOTS = PERMANENT BAN*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ CANCEL PAYMENT', 'payment_cancel')]
          ]).reply_markup
        }
      );
      
    } catch (error) {
      console.error('Payment button error:', error);
      await ctx.answerCbQuery('❌ Error processing payment', { alert: true });
    }
  }

  /**
   * Handle screenshot upload
   * @param {Object} ctx - Telegraf context
   */
  static async handleScreenshot(ctx) {
    try {
      const userId = ctx.from.id;
      const session = paymentSessions.get(userId);
      
      if (!session || session.step !== 'awaiting_screenshot') {
        await ctx.reply('❌ No pending payment. Please start over from Buy Voucher.');
        return;
      }
      
      // Get the photo (highest resolution)
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileId = photo.file_id;
      
      // Store screenshot
      session.screenshotId = fileId;
      session.step = 'awaiting_utr';
      paymentSessions.set(userId, session);
      
      await ctx.reply(
        `✅ *SCREENSHOT RECEIVED!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📝 *NEXT STEP:*\n` +
        `Please send your UTR / Transaction ID.\n\n` +
        `📋 *UTR FORMAT:*\n` +
        `• 6-20 characters\n` +
        `• Letters and numbers only\n` +
        `• No spaces or special characters\n` +
        `• Example: \`ABC123456789\`\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *WRONG UTR = PERMANENT BAN*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        { parse_mode: 'Markdown' }
      );
      
    } catch (error) {
      console.error('Screenshot handler error:', error);
      await ctx.reply('❌ Error processing screenshot. Please try again.');
    }
  }

  /**
   * Handle UTR input
   * @param {Object} ctx - Telegraf context
   * @param {string} utr - UTR number
   * @returns {boolean} - True if handled
   */
  static async handleUTR(ctx, utr) {
    try {
      const userId = ctx.from.id;
      const session = paymentSessions.get(userId);
      
      if (!session || session.step !== 'awaiting_utr') {
        return false;
      }
      
      // Clean UTR input
      utr = utr.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Validate UTR format
      if (utr.length < 6 || utr.length > 20) {
        await ctx.reply(
          '❌ *INVALID UTR FORMAT*\n\n' +
          'Please send a valid UTR:\n' +
          '• 6-20 characters\n' +
          '• Letters and numbers only\n' +
          '• No spaces or special characters\n\n' +
          'Example: `ABC123456789`',
          { parse_mode: 'Markdown' }
        );
        return true;
      }
      
      // Check if UTR is already used
      const existingOrder = await db.query(
        'SELECT * FROM orders WHERE utr_number = ?',
        [utr]
      );
      
      if (existingOrder.length > 0) {
        // Block user for trying to reuse UTR
        await db.blockUser(userId, 'UTR reuse attempt - Fake payment', 60);
        await ctx.reply(
          '🚫 *PERMANENT ACTION*\n\n' +
          'This UTR has already been used.\n' +
          'You have been temporarily blocked for fake payment attempt.\n\n' +
          'Contact support: @SheinSupportRobot',
          { parse_mode: 'Markdown' }
        );
        paymentSessions.delete(userId);
        return true;
      }
      
      // Check if UTR is blacklisted
      const isBlocked = await db.isUTRBlocked(utr);
      if (isBlocked) {
        await db.blockUser(userId, 'Attempted to use blocked UTR', 120);
        await ctx.reply(
          '🚫 *BLOCKED UTR*\n\n' +
          'This UTR is blacklisted.\n' +
          'You have been temporarily blocked.\n\n' +
          'Contact support: @SheinSupportRobot',
          { parse_mode: 'Markdown' }
        );
        paymentSessions.delete(userId);
        return true;
      }
      
      // Check stock again (double-check)
      const stock = await db.getAvailableStock(session.categoryId);
      if (session.quantity > stock) {
        await ctx.reply(
          '❌ *OUT OF STOCK*\n\n' +
          `Sorry, only ${stock} codes are now available.\n` +
          'Your order cannot be processed.\n\n' +
          'Please try with smaller quantity.',
          { parse_mode: 'Markdown' }
        );
        paymentSessions.delete(userId);
        return true;
      }
      
      // Create order in database
      const category = await db.getCategory(session.categoryId);
      const orderId = await db.createOrder(
        userId,
        session.categoryId,
        category.display_name,
        session.quantity,
        session.totalPrice,
        utr,
        session.screenshotId
      );
      
      // Get user details for notification
      const user = await db.getUser(userId);
      
      // Send order confirmation to user
      await ctx.reply(
        `✅ *ORDER PLACED SUCCESSFULLY!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🎫 *ORDER DETAILS*\n` +
        `• Order ID: \`${orderId}\`\n` +
        `• Category: ${category.display_name}\n` +
        `• Quantity: ${session.quantity}\n` +
        `• Amount: ₹${session.totalPrice}\n` +
        `• UTR: \`${utr}\`\n` +
        `• Status: ⏳ PENDING\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📌 *WHAT'S NEXT?*\n` +
        `1️⃣ Admin will verify your payment\n` +
        `2️⃣ You'll receive vouchers in this chat\n` +
        `3️⃣ Check "My Orders" for status\n` +
        `4️⃣ Use "Recover Vouchers" if needed\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⏱ *RECOVERY WINDOW:* 2 hours after delivery\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🆘 *Support:* @SheinSupportRobot\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━`,
        { parse_mode: 'Markdown' }
      );
      
      // Notify admin
      await this.notifyAdmin(ctx, userId, orderId, session, utr, user);
      
      // Clear session
      paymentSessions.delete(userId);
      
      return true;
      
    } catch (error) {
      console.error('UTR handler error:', error);
      await ctx.reply('❌ Error processing order. Please try again or contact support.');
      return true;
    }
  }

  /**
   * Notify admin about new order
   * @param {Object} ctx - Telegraf context
   * @param {number} userId - User ID
   * @param {string} orderId - Order ID
   * @param {Object} session - Payment session
   * @param {string} utr - UTR number
   * @param {Object} user - User object
   */
  static async notifyAdmin(ctx, userId, orderId, session, utr, user) {
    try {
      const adminId = process.env.ADMIN_ID;
      const category = await db.getCategory(session.categoryId);
      
      const adminMessage = 
        `🛒 *NEW ORDER RECEIVED*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🎫 *ORDER ID:* \`${orderId}\`\n\n` +
        `👤 *USER DETAILS*\n` +
        `• Name: ${user?.first_name || ''} ${user?.last_name || ''}\n` +
        `• Username: @${user?.username || 'N/A'}\n` +
        `• User ID: \`${userId}\`\n` +
        `• Joined: ${user?.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'N/A'}\n\n` +
        `📦 *ORDER DETAILS*\n` +
        `• Category: ${category.display_name}\n` +
        `• Quantity: ${session.quantity}\n` +
        `• Amount: ₹${session.totalPrice}\n` +
        `• UTR: \`${utr}\`\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⏱ *RECEIVED:* ${new Date().toLocaleString()}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━`;
      
      // Send screenshot to admin
      await ctx.telegram.sendPhoto(adminId, session.screenshotId, {
        caption: adminMessage,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ ACCEPT ORDER', `admin_accept_${orderId}`),
            Markup.button.callback('❌ REJECT ORDER', `admin_reject_${orderId}`)
          ],
          [
            Markup.button.callback('👤 VIEW USER', `admin_user_${userId}`),
            Markup.button.callback('🔨 BLOCK UTR', `admin_block_utr_${utr}`)
          ],
          [
            Markup.button.callback('📋 VIEW ORDER', `admin_order_${orderId}`)
          ]
        ]).reply_markup
      });
      
      // Also send to notification channel
      try {
        const channelMessage = 
          `🎯 *NEW ORDER SUBMITTED*\n` +
          `━━━━━━━━━━━•❈•━━━━━━━━━━━\n` +
          `╰➤👤 USER: ${user?.first_name || ''} ${user?.last_name || ''}\n` +
          `╰➤🆔 USER ID: \`${userId}\`\n` +
          `╰➤📡 STATUS: ⏳ Pending\n` +
          `╰➤🔰 CATEGORY: ${category.display_name}\n` +
          `╰➤📦 QUANTITY: ${session.quantity}\n` +
          `╰➤💳 AMOUNT: ₹${session.totalPrice}\n\n` +
          `🤖 BOT: @SheinVoucherHub_Bot\n` +
          `━━━━━━━━━━━•❈•━━━━━━━━━━━`;
        
        await ctx.telegram.sendMessage(process.env.CHANNEL_2_ID, channelMessage, {
          parse_mode: 'Markdown'
        });
      } catch (e) {
        console.error('Channel notification error:', e);
      }
      
      console.log(`📨 Admin notified for order ${orderId}`);
      
    } catch (error) {
      console.error('Admin notification error:', error);
    }
  }

  /**
   * Handle payment cancellation
   * @param {Object} ctx - Telegraf context
   */
  static async handleCancel(ctx) {
    try {
      const userId = ctx.from.id;
      const session = paymentSessions.get(userId);
      
      if (session) {
        // Log cancellation
        console.log(`❌ Payment cancelled by user ${userId}`);
      }
      
      paymentSessions.delete(userId);
      
      await ctx.editMessageCaption(
        '❌ *PAYMENT CANCELLED*\n\n' +
        'Your payment has been cancelled.\n' +
        'You can start over from Buy Voucher.',
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🛒 BUY AGAIN', 'back_to_categories')]
          ]).reply_markup
        }
      );
      
    } catch (error) {
      console.error('Cancel error:', error);
      await ctx.answerCbQuery('❌ Error', { alert: true });
    }
  }

  /**
   * Handle payment timeout
   * @param {Object} ctx - Telegraf context
   * @param {number} userId - User ID
   */
  static async handleTimeout(ctx, userId) {
    try {
      const session = paymentSessions.get(userId);
      
      if (session && (session.step === 'awaiting_screenshot' || session.step === 'awaiting_utr')) {
        paymentSessions.delete(userId);
        
        await ctx.telegram.sendMessage(userId,
          '⏱ *PAYMENT TIMEOUT*\n\n' +
          'Your payment session has expired due to inactivity.\n' +
          'Please start over from Buy Voucher.',
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error) {
      console.error('Timeout error:', error);
    }
  }

  /**
   * Check if user has pending payment
   * @param {number} userId - User ID
   * @returns {boolean} - True if pending payment exists
   */
  static hasPendingPayment(userId) {
    const session = paymentSessions.get(userId);
    return session && (session.step === 'awaiting_screenshot' || session.step === 'awaiting_utr');
  }

  /**
   * Get payment session
   * @param {number} userId - User ID
   * @returns {Object|null} - Payment session or null
   */
  static getSession(userId) {
    return paymentSessions.get(userId) || null;
  }

  /**
   * Clear payment session
   * @param {number} userId - User ID
   */
  static clearSession(userId) {
    paymentSessions.delete(userId);
  }

  /**
   * Get payment session step
   * @param {number} userId - User ID
   * @returns {string|null} - Current step or null
   */
  static getSessionStep(userId) {
    const session = paymentSessions.get(userId);
    return session ? session.step : null;
  }

  /**
   * Update payment session
   * @param {number} userId - User ID
   * @param {Object} data - Session data to update
   */
  static updateSession(userId, data) {
    const session = paymentSessions.get(userId);
    if (session) {
      paymentSessions.set(userId, { ...session, ...data });
    }
  }

  /**
   * Clean up expired sessions (older than 1 hour)
   */
  static cleanupExpiredSessions() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    let cleaned = 0;
    
    for (const [userId, session] of paymentSessions.entries()) {
      if (now - session.timestamp > oneHour) {
        paymentSessions.delete(userId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired payment sessions`);
    }
  }

  /**
   * Get all active sessions count
   * @returns {number} - Number of active sessions
   */
  static getActiveSessionsCount() {
    return paymentSessions.size;
  }

  /**
   * Get session statistics
   * @returns {Object} - Session statistics
   */
  static getSessionStats() {
    const stats = {
      total: paymentSessions.size,
      awaiting_screenshot: 0,
      awaiting_utr: 0,
      awaiting_payment: 0,
      totalValue: 0
    };
    
    for (const session of paymentSessions.values()) {
      stats[session.step] = (stats[session.step] || 0) + 1;
      if (session.totalPrice) {
        stats.totalValue += session.totalPrice;
      }
    }
    
    return stats;
  }
}

// Run cleanup every 30 minutes
setInterval(() => {
  PaymentHandler.cleanupExpiredSessions();
}, 30 * 60 * 1000);

// Also check for timeouts every minute
setInterval(() => {
  const now = Date.now();
  const timeout = 45 * 60 * 1000; // 45 minutes
  
  for (const [userId, session] of paymentSessions.entries()) {
    if (now - session.timestamp > timeout) {
      PaymentHandler.handleTimeout(null, userId);
    }
  }
}, 60 * 1000);

module.exports = PaymentHandler;
