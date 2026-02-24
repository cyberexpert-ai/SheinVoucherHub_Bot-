const { query } = require("../database/database");
const moment = require("moment");

async function paymentHandler(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const photo = msg.photo;
    const caption = msg.caption;

    // Check if user is in payment session
    const session = global.userSessions?.get(`payment_${userId}`);
    if (!session) {
        return;
    }

    if (session.step === "waiting_screenshot") {
        // Store screenshot and ask for UTR
        const fileId = photo[photo.length - 1].file_id;

        await bot.sendMessage(chatId, 
            "✅ *Screenshot received!*\n\nPlease enter your UTR/Transaction ID now:",
            { parse_mode: "Markdown" }
        );

        // Update session
        session.step = "waiting_utr";
        session.screenshotFileId = fileId;
        global.userSessions.set(`payment_${userId}`, session);

    } else if (session.step === "waiting_utr") {
        // Process UTR
        const utr = msg.text;

        // Check if UTR is already used
        const usedUtr = await query(
            "SELECT * FROM used_utr WHERE utr_number = ?",
            [utr]
        );

        if (usedUtr.length > 0) {
            // Fraud detection
            await bot.sendMessage(chatId, 
                "⚠️ *Duplicate UTR Detected!*\n\nThis UTR has already been used.\n\nPossible fraud attempt detected.\nYour account has been flagged for review.",
                { parse_mode: "Markdown" }
            );

            // Flag for admin
            await bot.sendMessage(process.env.ADMIN_ID,
                `🚨 *Fraud Alert!*\n\nUser: ${userId}\nAction: Duplicate UTR\nUTR: ${utr}\nOriginal User: ${usedUtr[0].user_id}`,
                { parse_mode: "Markdown" }
            );

            // Temp block user
            await query(
                "INSERT INTO temp_block (user_id, reason, blocked_until) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))",
                [userId, "Duplicate UTR attempt"]
            );

            global.userSessions.delete(`payment_${userId}`);
            return;
        }

        // Generate order ID
        const dateStr = moment().format('YYYYMMDD');
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderId = `SVH-${dateStr}-${randomStr}`;

        // Save order
        await query(`
            INSERT INTO orders 
            (order_id, user_id, category_name, quantity, total_price, utr_number, screenshot_file_id, status, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL ? HOUR))
        `, [
            orderId, 
            userId, 
            session.category, 
            session.quantity, 
            session.totalPrice, 
            utr,
            session.screenshotFileId,
            parseInt(process.env.ORDER_EXPIRE_HOURS || 2)
        ]);

        // Save UTR to used list
        await query(
            "INSERT INTO used_utr (utr_number, user_id, order_id) VALUES (?, ?, ?)",
            [utr, userId, orderId]
        );

        // Thank you message
        const thankYouMessage = `✅ *Order Submitted Successfully!*

Order ID: \`${orderId}\`
Date: ${moment().format('DD/MM/YYYY HH:mm')}
Category: ₹${session.category}
Quantity: ${session.quantity}
Total: ₹${session.totalPrice}
Status: ⏳ Pending Approval

📌 *What's Next?*
• Admin will verify your payment
• You'll receive vouchers within 5-30 minutes
• Check /myorders for status updates

🔔 *Note:*
• Keep this Order ID for recovery
• Recovery available for 2 hours only
• Contact support if delayed

Thank you for your purchase! 🎉`;

        await bot.sendMessage(chatId, thankYouMessage, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📦 My Orders", callback_data: "my_orders" }],
                    [{ text: "🆘 Support", callback_data: "support" }]
                ]
            }
        });

        // Notify admin
        const adminMessage = `🆕 *New Order Received!*

Order ID: \`${orderId}\`
User: ${userId}
Category: ₹${session.category} x${session.quantity}
Amount: ₹${session.totalPrice}
UTR: ${utr}

⏱ Time: ${moment().format('DD/MM/YYYY HH:mm')}`;

        const adminKeyboard = {
            inline_keyboard: [
                [{ text: "✅ Accept", callback_data: `admin_accept_${orderId}` }],
                [{ text: "❌ Reject", callback_data: `admin_reject_${orderId}` }]
            ]
        };

        await bot.sendMessage(process.env.ADMIN_ID, adminMessage, {
            parse_mode: "Markdown",
            reply_markup: adminKeyboard
        });

        // Send screenshot to admin
        if (session.screenshotFileId) {
            await bot.sendPhoto(process.env.ADMIN_ID, session.screenshotFileId, {
                caption: `📸 Payment screenshot for order ${orderId}`
            });
        }

        // Clear session
        global.userSessions.delete(`payment_${userId}`);
    }
}

module.exports = paymentHandler;
