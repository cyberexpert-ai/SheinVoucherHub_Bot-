const db = require('../../database/database');

module.exports = async (ctx) => {
  try {
    // Clear any active sessions
    const userId = ctx.from.id;
    
    // Clear from various session maps
    const buyVoucher = require('./buyVoucher');
    const recoverVoucher = require('./recoverVoucher');
    const support = require('./support');
    
    if (buyVoucher.userSessions) buyVoucher.userSessions.delete(userId);
    if (recoverVoucher.recoverySessions) recoverVoucher.recoverySessions.delete(userId);
    if (support.supportSessions) support.supportSessions.delete(userId);
    
    // Show main menu
    const welcomeMessage = await db.getSetting('welcome_message') || 
      '🎯 Welcome to Shein Voucher Hub S!\n\n🚀 Get exclusive Shein vouchers at the best prices!\n\n📌 Choose an option below:';
    
    await ctx.reply(welcomeMessage, {
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
    ctx.reply('An error occurred. Please try again later.');
  }
};
