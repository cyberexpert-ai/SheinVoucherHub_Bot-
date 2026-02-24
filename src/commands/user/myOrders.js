const { query } = require("../../database/database");
const moment = require("moment");

async function myOrders(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Get user's orders
    const orders = await query(`
        SELECT * FROM orders 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 20
    `, [userId]);

    if (orders.length === 0) {
        const message = await bot.sendMessage(chatId, 
            "📦 *You don't have any orders yet.*\n\nStart buying vouchers with /start",
            { parse_mode: "Markdown" }
        );
        
        // Add back button
        await addBackButton(bot, chatId, message.message_id);
        return;
    }

    // Send each order
    for (const order of orders) {
        let statusEmoji = "⏳";
        let statusText = "Pending";
        
        if (order.status === "success") {
            statusEmoji = "✅";
            statusText = "Success";
        } else if (order.status === "rejected") {
            statusEmoji = "❌";
            statusText = "Rejected";
        } else if (order.status === "expired") {
            statusEmoji = "⌛";
            statusText = "Expired";
        }

        const orderMessage = `📦 *Your Orders*

🧾 Order ID: \`${order.order_id}\`
🎟 Category: ₹${order.category_name}
🔢 Quantity: ${order.quantity}
💰 Amount: ₹${order.total_price}
${statusEmoji} Status: ${statusText}
📅 Date: ${moment(order.created_at).format('DD/MM/YYYY HH:mm')}

${order.status === 'success' ? `🎫 Voucher Codes:\n\`${order.voucher_codes}\`` : ''}`;

        const keyboard = {
            inline_keyboard: []
        };

        if (order.status === 'success') {
            keyboard.inline_keyboard.push([
                { text: "📋 Copy Code", callback_data: `copy_${order.order_id}` }
            ]);
        }

        if (order.status === 'pending') {
            keyboard.inline_keyboard.push([
                { text: "❌ Cancel Order", callback_data: `cancel_${order.order_id}` }
            ]);
        }

        keyboard.inline_keyboard.push([
            { text: "↩️ Back", callback_data: "back_to_main" }
        ]);

        await bot.sendMessage(chatId, orderMessage, {
            parse_mode: "Markdown",
            reply_markup: keyboard
        });
    }
}

async function addBackButton(bot, chatId, messageId) {
    const keyboard = {
        inline_keyboard: [
            [{ text: "↩️ Back", callback_data: "back_to_main" }]
        ]
    };

    await bot.editMessageReplyMarkup(keyboard, {
        chat_id: chatId,
        message_id: messageId
    });
}

module.exports = { myOrders };
