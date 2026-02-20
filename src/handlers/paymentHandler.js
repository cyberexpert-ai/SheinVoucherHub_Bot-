const db = require('../database/database');
const buyVoucher = require('../commands/user/buyVoucher');
const { Markup } = require('telegraf');

// Store payment sessions
const paymentSessions = new Map();

module.exports = {
  // Handle screenshot
  async handleScreenshot(ctx) {
    try {
      const userId = ctx.from.id;
      const session = buyVoucher.userSessions?.get(userId);
      
      if (!session?.paymentData?.waitingForScreenshot) {
        return ctx.reply('❌ No pending payment. Please start over from Buy Voucher.');
      }
      
      // Get the photo
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileId = photo.file_id;
      
      // Store screenshot
      session.paymentData.screenshotId = fileId;
      session.paymentData.waitingForScreenshot = false;
      session.paymentData.waitingForUTR = true;
      buyVoucher.userSessions.set(userId, session);
      
      await ctx.reply(
        '✅ Screenshot received!\n\n' +
        'Now send your UTR / Transaction ID:\n' +
        'Example: `ABC123456789`',
        { parse_mode: 'Markdown' }
      );
      
    } catch (error) {
      console.error('Screenshot handler error:', error);
      ctx.reply('An error occurred. Please try again.');
    }
  },
  
  // Handle UTR
  async handleUTR(ctx, text) {
    try {
      const userId = ctx.from.id;
      const session = buyVoucher.userSessions?.get(userId);
      
      if (!session?.paymentData?.waitingForUTR) {
        return false;
      }
      
      const utr = text.trim();
      
      // Validate UTR format (alphanumeric, 6-20 chars)
      const utrRegex = /^[A-Za-z0-9]{6,20}$/;
      if (!utrRegex.test(utr)) {
        await ctx.reply('❌ Invalid UTR format. Please send a valid UTR (6-20 alphanumeric characters).');
        return true;
      }
      
      // Check if UTR is already used or blocked
      const existingOrder = await db.query(
        'SELECT * FROM orders WHERE utr_number = ?',
        [utr]
      );
      
      if (existingOrder.length > 0) {
        // Block user for trying to reuse UTR
        await db.blockUser(userId, 'UTR reuse attempt', 30);
        await ctx.reply('🚫 This UTR has already been used. You are temporarily blocked.');
        return true;
      }
      
      const isBlocked = await db.isUTRBlocked(utr);
      if (isBlocked) {
        await db.blockUser(userId, 'Blocked UTR used', 60);
        await ctx.reply('🚫 This UTR is blacklisted. You are temporarily blocked.');
        return true;
      }
      
      // Create order
      const { categoryId, quantity, totalPrice, screenshotId } = session.paymentData;
      const category = await db.getCategory(categoryId);
      
      const orderId = await db.createOrder(
        userId,
        categoryId,
        category.display_name,
        quantity,
        totalPrice,
        utr,
        screenshotId
      );
      
      // Clear payment session
      session.paymentData = null;
      buyVoucher.userSessions.set(userId, session);
      
      // Thank user
      await ctx.reply(
        `✅ *Order Submitted Successfully!*\n\n` +
        `Order ID: \`${orderId}\`\n` +
        `Category: ${category.display_name}\n` +
        `Quantity: ${quantity}\n` +
        `Amount: ₹${totalPrice}\n\n` +
        `Your order will be processed shortly. You will receive vouchers here once approved.\n\n` +
        `Use "Recover Vouchers" if you need codes again within 2 hours.`,
        { parse_mode: 'Markdown' }
      );
      
      // Notify admin
      const adminId = process.env.ADMIN_ID;
      const user = await db.getUser(userId);
      
      const adminMessage = 
        `🛒 *New Order Received*\n\n` +
        `Order ID: \`${orderId}\`\n` +
        `User: ${user.first_name || ''} ${user.last_name || ''}\n` +
        `Username: @${user.username || 'N/A'}\n` +
        `User ID: \`${userId}\`\n` +
        `Category: ${category.display_name}\n` +
        `Quantity: ${quantity}\n` +
        `Amount: ₹${totalPrice}\n` +
        `UTR: \`${utr}\``;
      
      // Send screenshot to admin
      await ctx.telegram.sendPhoto(adminId, screenshotId, {
        caption: adminMessage,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('✅ Accept', `accept_order_${orderId}`)],
          [Markup.button.callback('❌ Reject', `reject_order_${orderId}`)],
          [Markup.button.callback('🔨 Block UTR', `block_utr_${utr}`)]
        ]).reply_markup
      });
      
      return true;
      
    } catch (error) {
      if (error.message === 'UTR_BLOCKED') {
        await ctx.reply('🚫 This UTR is blacklisted. Order rejected.');
        await db.blockUser(userId, 'Attempted to use blocked UTR', 60);
      } else {
        console.error('UTR handler error:', error);
        await ctx.reply('An error occurred. Please try again.');
      }
      return true;
    }
  }
};
