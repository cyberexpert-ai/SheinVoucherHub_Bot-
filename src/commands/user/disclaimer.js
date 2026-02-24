async function disclaimer(bot, msg) {
    const chatId = msg.chat.id;

    const disclaimerMessage = `📜 *Disclaimer*

━━━━━━━━━━━━━━━━━━━━━

🎯 *Voucher Information*
• All coupons are 100% OFF up to voucher amount
• No minimum order amount required
• Valid for selected items only
• Subject to Shein terms & conditions

🔄 *Replacement Policy*
• Report issues within 1-2 hours of delivery
• Replacement only for invalid vouchers
• Screenshot proof required
• No replacement for wrong usage

💰 *Refund Policy*
• Refund only if vouchers are out of stock
• No refund after voucher delivery
• Refund processed within 24-48 hours
• Refund to original payment method

⚠️ *Important Notes*
• No returns on digital items
• Chargeback = Permanent ban
• Fraud attempts = Legal action
• We reserve right to refuse service

📞 *Support*
• Contact: @SheinSupportRobot
• Response time: 5-30 minutes
• Working hours: 24/7

✅ *By using this bot, you agree to all terms above.*

━━━━━━━━━━━━━━━━━━━━━`;

    const keyboard = {
        inline_keyboard: [
            [{ text: "↩️ Back", callback_data: "back_to_main" }]
        ]
    };

    await bot.sendMessage(chatId, disclaimerMessage, {
        parse_mode: "Markdown",
        reply_markup: keyboard
    });
}

module.exports = { disclaimer };
