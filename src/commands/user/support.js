const { deletePreviousMessage } = require('../../utils/helpers');

async function support(bot, msg) {
    const chatId = msg.chat.id;
    
    await deletePreviousMessage(bot, chatId);
    
    const message = `🆘 **Support**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nFor any issues, please contact our support robot:\n\n👉 **${process.env.SUPPORT_BOT}**\n\nThey will assist you within 24 hours.\n\nThank you for using Shein Voucher Hub!`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📢 Contact Support', url: `https://t.me/${process.env.SUPPORT_BOT.replace('@', '')}` }]
            ],
            keyboard: [['← Back to Menu']],
            resize_keyboard: true
        }
    });
}

module.exports = { support };
