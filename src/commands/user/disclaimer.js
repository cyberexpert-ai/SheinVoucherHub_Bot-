const { Markup } = require('telegraf');

async function show(ctx) {
  const message = 
    "📜 *Disclaimer*\n\n" +
    "• All coupons given are 100% OFF upto voucher amount with NO minimum order amount required.\n\n" +
    "• Contact Support if you're facing any issue with vouchers.\n\n" +
    "• Only replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.\n\n" +
    "• No returns.\n\n" +
    "• Refund will be only given if vouchers are out of stock.\n\n" +
    "• By using this bot, you agree to our terms and conditions.";

  const buttons = [
    [Markup.button.callback('🔙 Back', 'back_to_main')]
  ];

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

module.exports = { show };
