const { query } = require("../../database/database");

async function support(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const supportMessage = `🆘 *Support Center*

How can we help you today?

📌 *Common Issues:*
• Voucher not working
• Payment failed
• Order not delivered
• Recovery issues
• Refund request
• Technical support

Please describe your issue in detail.
Include Order ID if applicable.

⏱ *Response Time:* 5-30 minutes

⚠️ *Warning:*
• Fake complaints = Permanent block
• Abusive language = Immediate block
• Multiple fake tickets = Account restriction

For urgent issues, contact:
🤖 @SheinSupportRobot`;

    const keyboard = {
        inline_keyboard: [
            [{ text: "↩️ Leave", callback_data: "leave_support" }]
        ],
        reply_markup: {
            force_reply: true
        }
    };

    const message = await bot.sendMessage(chatId, supportMessage, {
        parse_mode: "Markdown",
        reply_markup: keyboard
    });

    // Store support session
    if (!global.userSessions) global.userSessions = new Map();
    global.userSessions.set(`support_${userId}`, {
        step: "waiting_message",
        messageId: message.message_id
    });
}

async function processSupportMessage(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const messageId = msg.message_id;

    // Check if user is in support session
    const session = global.userSessions?.get(`support_${userId}`);
    if (!session || session.step !== "waiting_message") {
        return false;
    }

    // Save support ticket
    try {
        await query(
            "INSERT INTO support_tickets (user_id, message, status) VALUES (?, ?, 'open')",
            [userId, text]
        );

        // Forward to admin
        const forwardMessage = `🆘 *New Support Ticket*

👤 User: ${userId}
📝 Message: ${text}

⏱ Time: ${new Date().toLocaleString()}`;

        const adminKeyboard = {
            inline_keyboard: [
                [{ text: "✅ Mark Resolved", callback_data: `support_resolve_${userId}` }],
                [{ text: "🚫 Block User", callback_data: `support_block_${userId}` }]
            ]
        };

        await bot.sendMessage(process.env.ADMIN_ID, forwardMessage, {
            parse_mode: "Markdown",
            reply_markup: adminKeyboard
        });

        // Confirm to user
        await bot.sendMessage(chatId,
            `✅ *Support Ticket Submitted*

Ticket ID: #${Date.now().toString().slice(-6)}

Your message has been forwarded to support team.
We'll get back to you shortly.

📌 *Next Steps:*
1. Wait for admin response
2. Check notifications
3. Reply in this chat

Thank you for your patience!`,
            { parse_mode: "Markdown" }
        );

        // Clear session
        global.userSessions.delete(`support_${userId}`);

        return true;
    } catch (error) {
        console.error("Support message error:", error);
        await bot.sendMessage(chatId, "❌ Error submitting ticket. Please try again.");
        return true;
    }
}

async function adminReplyToSupport(bot, userId, reply) {
    try {
        await bot.sendMessage(userId,
            `📨 *Support Reply*

${reply}

If you have further questions, please reply to this message.`,
            { parse_mode: "Markdown" }
        );

        // Update ticket status
        await query(
            "UPDATE support_tickets SET admin_reply = ?, status = 'closed' WHERE user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
            [reply, userId]
        );

        return true;
    } catch (error) {
        console.error("Admin reply error:", error);
        return false;
    }
}

module.exports = { support, processSupportMessage, adminReplyToSupport };
