/**
 * Payment Page Display Utilities
 * Location: /src/utils/paymentPage.js
 * Helper functions for payment page display and formatting
 */

class PaymentPageUtils {
  /**
   * Generate payment page text
   * @param {Object} category - Category object
   * @param {number} quantity - Quantity
   * @param {number} totalPrice - Total price
   * @param {Object} breakdown - Price breakdown
   * @returns {string} Formatted payment text
   */
  static generatePaymentText(category, quantity, totalPrice, breakdown) {
    return (
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
      `━━━━━━━━━━━━━━━━━━━━━━━━`
    );
  }

  /**
   * Generate screenshot request text
   * @param {number} totalPrice - Total price
   * @returns {string} Formatted screenshot request
   */
  static generateScreenshotRequest(totalPrice) {
    return (
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
      `━━━━━━━━━━━━━━━━━━━━━━━━`
    );
  }

  /**
   * Generate UTR request text
   * @returns {string} Formatted UTR request
   */
  static generateUTRRequest() {
    return (
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
      `━━━━━━━━━━━━━━━━━━━━━━━━`
    );
  }

  /**
   * Generate order confirmation text
   * @param {string} orderId - Order ID
   * @param {Object} category - Category object
   * @param {number} quantity - Quantity
   * @param {number} totalPrice - Total price
   * @param {string} utr - UTR number
   * @returns {string} Formatted confirmation
   */
  static generateOrderConfirmation(orderId, category, quantity, totalPrice, utr) {
    return (
      `✅ *ORDER PLACED SUCCESSFULLY!*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🎫 *ORDER DETAILS*\n` +
      `• Order ID: \`${orderId}\`\n` +
      `• Category: ${category.display_name}\n` +
      `• Quantity: ${quantity}\n` +
      `• Amount: ₹${totalPrice}\n` +
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
      `━━━━━━━━━━━━━━━━━━━━━━━━`
    );
  }

  /**
   * Generate admin notification text
   * @param {string} orderId - Order ID
   * @param {Object} user - User object
   * @param {number} userId - User ID
   * @param {Object} category - Category object
   * @param {number} quantity - Quantity
   * @param {number} totalPrice - Total price
   * @param {string} utr - UTR number
   * @returns {string} Formatted admin notification
   */
  static generateAdminNotification(orderId, user, userId, category, quantity, totalPrice, utr) {
    return (
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
      `• Quantity: ${quantity}\n` +
      `• Amount: ₹${totalPrice}\n` +
      `• UTR: \`${utr}\`\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⏱ *RECEIVED:* ${new Date().toLocaleString()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━`
    );
  }

  /**
   * Generate channel notification text
   * @param {Object} user - User object
   * @param {number} userId - User ID
   * @param {Object} category - Category object
   * @param {number} quantity - Quantity
   * @param {number} totalPrice - Total price
   * @returns {string} Formatted channel notification
   */
  static generateChannelNotification(user, userId, category, quantity, totalPrice) {
    return (
      `🎯 *NEW ORDER SUBMITTED*\n` +
      `━━━━━━━━━━━•❈•━━━━━━━━━━━\n` +
      `╰➤👤 USER: ${user?.first_name || ''} ${user?.last_name || ''}\n` +
      `╰➤🆔 USER ID: \`${userId}\`\n` +
      `╰➤📡 STATUS: ⏳ Pending\n` +
      `╰➤🔰 CATEGORY: ${category.display_name}\n` +
      `╰➤📦 QUANTITY: ${quantity}\n` +
      `╰➤💳 AMOUNT: ₹${totalPrice}\n\n` +
      `🤖 BOT: @SheinVoucherHub_Bot\n` +
      `━━━━━━━━━━━•❈•━━━━━━━━━━━`
    );
  }

  /**
   * Generate cancellation text
   * @returns {string} Formatted cancellation
   */
  static generateCancellationText() {
    return (
      '❌ *PAYMENT CANCELLED*\n\n' +
      'Your payment has been cancelled.\n' +
      'You can start over from Buy Voucher.'
    );
  }

  /**
   * Generate timeout text
   * @returns {string} Formatted timeout
   */
  static generateTimeoutText() {
    return (
      '⏱ *PAYMENT TIMEOUT*\n\n' +
      'Your payment session has expired due to inactivity.\n' +
      'Please start over from Buy Voucher.'
    );
  }

  /**
   * Validate UTR format
   * @param {string} utr - UTR to validate
   * @returns {boolean} - True if valid
   */
  static validateUTR(utr) {
    const utrRegex = /^[A-Za-z0-9]{6,20}$/;
    return utrRegex.test(utr);
  }

  /**
   * Clean UTR input
   * @param {string} utr - Raw UTR input
   * @returns {string} Cleaned UTR
   */
  static cleanUTR(utr) {
    return utr.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  /**
   * Format price
   * @param {number} price - Price in rupees
   * @returns {string} Formatted price
   */
  static formatPrice(price) {
    return `₹${price}`;
  }

  /**
   * Generate error text
   * @param {string} error - Error message
   * @returns {string} Formatted error
   */
  static generateErrorText(error) {
    return `❌ *ERROR*\n\n${error}\n\nPlease try again or contact support.`;
  }
}

module.exports = PaymentPageUtils;
