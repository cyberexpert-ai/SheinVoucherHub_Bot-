module.exports = async (ctx) => {
  try {
    const disclaimer = 
      '📜 *Disclaimer*\n\n' +
      '• All coupons given are 100% OFF upto voucher amount with NO minimum order amount required.\n\n' +
      '• Contact Support if you\'re facing any issue with vouchers.\n\n' +
      '• Only replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.\n\n' +
      '• No returns.\n\n' +
      '• Refund will be only given if vouchers are out of stock.\n\n' +
      '• By using this bot, you agree to these terms.';
    
    await ctx.reply(disclaimer, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[{ text: '↩️ Back' }]],
        resize_keyboard: true
      }
    });
    
  } catch (error) {
    console.error('Disclaimer error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};
