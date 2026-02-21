/**
 * Back Command Handler
 * Location: /src/commands/user/back.js
 * Returns user to main menu
 */

const db = require('../../database/database');

module.exports = async (ctx) => {
  try {
    console.log('🔙 Executing back command for user:', ctx.from.id);
    
    // Clear any active sessions
    const userId = ctx.from.id;
    
    // Clear from various session maps
    const buyVoucher = require('./buyVoucher');
    const recoverVoucher = require('./recoverVoucher');
    const support = require('./support');
    const paymentHandler = require('../../handlers/paymentHandler');
    
    if (buyVoucher.userSessions) {
      buyVoucher.userSessions.delete(userId);
      console.log('✅ Cleared buy voucher session');
    }
    
    if (recoverVoucher.recoverySessions) {
      recoverVoucher.recoverySessions.delete(userId);
      console.log('✅ Cleared recovery session');
    }
    
    if (support.supportSessions) {
      support.supportSessions.delete(userId);
      console.log('✅ Cleared support session');
    }
    
    if (paymentHandler.clearSession) {
      paymentHandler.clearSession(userId);
      console.log('✅ Cleared payment session');
    }
    
    // Get welcome message from settings
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
    
    console.log('✅ Back to main menu for user:', userId);
    
  } catch (error) {
    console.error('Back command error:', error);
    
    // Fallback main menu
    try {
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
    } catch (e) {
      console.error('Fallback menu error:', e);
    }
  }
};
