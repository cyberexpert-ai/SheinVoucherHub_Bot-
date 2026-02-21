/**
 * Back Command Handler
 * Returns user to main menu
 */

const db = require('../../database/database');

module.exports = async (ctx) => {
  try {
    console.log('🔙 Back button pressed by user:', ctx.from.id);
    
    // Clear any active sessions
    const userId = ctx.from.id;
    
    // Try to clear sessions if they exist
    try {
      const buyVoucher = require('./buyVoucher');
      if (buyVoucher.userSessions) buyVoucher.userSessions.delete(userId);
    } catch (e) {}
    
    try {
      const recoverVoucher = require('./recoverVoucher');
      if (recoverVoucher.recoverySessions) recoverVoucher.recoverySessions.delete(userId);
    } catch (e) {}
    
    try {
      const support = require('./support');
      if (support.supportSessions) support.supportSessions.delete(userId);
    } catch (e) {}
    
    try {
      const paymentHandler = require('../../handlers/paymentHandler');
      if (paymentHandler.clearSession) paymentHandler.clearSession(userId);
    } catch (e) {}
    
    // Get welcome message
    const welcomeMessage = await db.getSetting('welcome_message') || 
      '🎯 *Welcome to Shein Voucher Hub!*\n\n' +
      '🚀 Get exclusive Shein vouchers at the best prices!\n\n' +
      '📌 Choose an option below:';
    
    // Show main menu
    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: '🛒 Buy Voucher' }, { text: '🔁 Recover Vouchers' }],
          [{ text: '📦 My Orders' }, { text: '📜 Disclaimer' }],
          [{ text: '🆘 Support' }]
        ],
        resize_keyboard: true
      }
    });
    
  } catch (error) {
    console.error('Back command error:', error);
    
    // Fallback main menu
    await ctx.reply(
      '📌 *Main Menu*',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '🛒 Buy Voucher' }, { text: '🔁 Recover Vouchers' }],
            [{ text: '📦 My Orders' }, { text: '📜 Disclaimer' }],
            [{ text: '🆘 Support' }]
          ],
          resize_keyboard: true
        }
      }
    );
  }
};
