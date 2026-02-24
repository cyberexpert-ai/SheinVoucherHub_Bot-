const { query } = require("../../database/database");
const moment = require("moment");

async function recoverVoucher(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const message = await bot.sendMessage(chatId,
        `🔁 *Recover Vouchers*

Send your Order ID

Example: \`SVH-1234567890-ABC123\`

⚠️ *Important:*
• Order ID must match your Telegram ID
• Recovery available for 2 hours after order
• After 2 hours, orders expire automatically`,
        {
            parse_mode: "Markdown",
            reply_markup: {
                force_reply: true
            }
        }
    );

    // Store session for recovery
    if (!global.userSessions) global.userSessions = new Map();
    global.userSessions.set(`recover_${userId}`, {
        step: "waiting_order_id",
        messageId: message.message_id
    });
}

async function processRecovery(bot, chatId, userId, orderId) {
    // Check if order exists and belongs to user
    const order = await query(`
        SELECT * FROM orders 
        WHERE order_id = ? AND user_id = ?
    `, [orderId, userId]);

    if (order.length === 0) {
        // Check if order exists but belongs to someone else
        const otherOrder = await query(
            "SELECT * FROM orders WHERE order_id = ?",
            [orderId]
        );

        if (otherOrder.length > 0) {
            // Order exists but not for this user
            await bot.sendMessage(chatId,
                `⚠️ *Recovery Failed*

This Order ID belongs to another account.

Recovery is only available for the original purchasing account.

If you think this is a mistake, contact support.`,
                { parse_mode: "Markdown" }
            );

            // Flag potential fraud
            await logFraudAttempt(userId, orderId, "WRONG_ACCOUNT_RECOVERY");
        } else {
            // Order doesn't exist
            await bot.sendMessage(chatId,
                `⚠️ *Order not found:* \`${orderId}\`

Please check your Order ID and try again.

Format: SVH-XXXXXXXX-XXXXXX`,
                { parse_mode: "Markdown" }
            );
        }
        return;
    }

    // Check if order is expired
    const orderData = order[0];
    const expiresAt = moment(orderData.expires_at);
    
    if (moment().isAfter(expiresAt)) {
        await bot.sendMessage(chatId,
            `⌛ *Recovery Failed*

Your order \`${orderId}\` has expired.

Orders are only recoverable within 2 hours of purchase.

If you need assistance, please contact support.`,
            { parse_mode: "Markdown" }
        );
        return;
    }

    // Check order status
    if (orderData.status === "pending") {
        await bot.sendMessage(chatId,
            `⏳ *Order Pending*

Your order \`${orderId}\` is still pending admin approval.

Please wait for admin to process your order.

Estimated time: 5-30 minutes`,
            { parse_mode: "Markdown" }
        );
        return;
    }

    if (orderData.status === "rejected") {
        await bot.sendMessage(chatId,
            `❌ *Order Rejected*

Your order \`${orderId}\` was rejected.

Reason: ${orderData.admin_note || "No reason provided"}

If you need assistance, contact support.`,
            { parse_mode: "Markdown" }
        );
        return;
    }

    if (orderData.status === "success") {
        // Resend voucher codes
        await bot.sendMessage(chatId,
            `✅ *Voucher Recovered*

Order ID: \`${orderId}\`
Category: ₹${orderData.category_name} x${orderData.quantity}
Purchase Date: ${moment(orderData.created_at).format('DD/MM/YYYY HH:mm')}

🎫 *Your Voucher Codes:*

\`${orderData.voucher_codes}\`

📋 *Instructions:*
1. Copy the code above
2. Apply at Shein checkout
3. Maximum discount: ₹${orderData.category_name} per item`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📋 Copy Code", callback_data: `copy_${orderId}` }],
                        [{ text: "↩️ Back", callback_data: "back_to_main" }]
                    ]
                }
            }
        );
        return;
    }
}

async function logFraudAttempt(userId, orderId, type) {
    try {
        await query(
            "INSERT INTO fraud_logs (user_id, order_id, fraud_type, created_at) VALUES (?, ?, ?, NOW())",
            [userId, orderId, type]
        );

        // Check for multiple attempts
        const attempts = await query(
            "SELECT COUNT(*) as count FROM fraud_logs WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)",
            [userId]
        );

        if (attempts[0].count >= 3) {
            // Temp block user for fraud
            await query(
                "INSERT INTO temp_block (user_id, reason, blocked_until) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))",
                [userId, "Multiple fraud attempts detected"]
            );

            // Notify admin
            await bot.sendMessage(process.env.ADMIN_ID,
                `🚨 *Fraud Alert*\n\nUser: ${userId}\nType: ${type}\nAttempts: ${attempts[0].count}\nAction: Temp blocked 30 min`,
                { parse_mode: "Markdown" }
            );
        }
    } catch (error) {
        console.error("Fraud logging error:", error);
    }
}

module.exports = { recoverVoucher, processRecovery };
