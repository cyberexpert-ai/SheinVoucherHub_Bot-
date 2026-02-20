const { deletePreviousMessage } = require('../../utils/helpers');

async function disclaimer(bot, msg) {
    const chatId = msg.chat.id;
    
    await deletePreviousMessage(bot, chatId);
    
    const message = `📜 **Disclaimer**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n• All coupons given are 100% OFF upto voucher amount with NO minimum order amount required.
    \n• Contact Support if you're facing any issue with vouchers.
    
    \n• Only replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.
   
    \n• No returns.
    
    \n• Refund will be only given if vouchers are out of stock.
    
    \n• Fake payment attempts will result in permanent ban.`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['← Back to Menu']],
            resize_keyboard: true
        }
    });
}

module.exports = { disclaimer };
