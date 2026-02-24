const { query } = require("../database/database");
const { selectCategory, selectQuantity, handleCustomQuantity } = require("../commands/user/buyVoucher");
const { showWelcomeMessage } = require("../commands/start");
const moment = require("moment");

async function callbackHandler(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    await bot.answerCallbackQuery(callbackQuery.id);

    // Handle verify join
    if (data === "verify_join") {
        const { channelCheck } = require("../middlewares/channelCheck");
        const isMember = await channelCheck(bot, userId);
        
        if (isMember) {
            await bot.deleteMessage(chatId, messageId);
            await showWelcomeMessage(bot, chatId, userId);
        } else {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: "❌ You haven't joined both channels yet!",
                show_alert: true
            });
        }
        return;
    }

    // Handle back to main
    if (data === "back_to_main") {
        await bot.deleteMessage(chatId, messageId);
        await showWelcomeMessage(bot, chatId, userId);
        return;
    }

    // Handle back to categories
    if (data === "back_to_categories") {
        await bot.deleteMessage(chatId, messageId);
        const { buyVoucher } = require("../commands/user/buyVoucher");
        await buyVoucher(bot, { chat: { id: chatId }, from: { id: userId } });
        return;
    }

    // Handle category selection
    if (data.startsWith("buy_cat_")) {
        const category = data.replace("buy_cat_", "");
        await bot.deleteMessage(chatId, messageId);
        await selectCategory(bot, chatId, userId, category);
        return;
    }

    // Handle quantity selection
    if (data.startsWith("buy_qty_")) {
        const parts = data.replace("buy_qty_", "").split("_");
        const category = parts[0];
        const quantity = parseInt(parts[1]);
        await bot.deleteMessage(chatId, messageId);
        await selectQuantity(bot, chatId, userId, category, quantity);
        return;
    }

    // Handle custom quantity
    if (data.startsWith("buy_custom_")) {
        const category = data.replace("buy_custom_", "");
        await bot.deleteMessage(chatId, messageId);
        await handleCustomQuantity(bot, chatId, userId, category);
        return;
    }

    // Handle back to quantity
    if (data.startsWith("back_to_qty_")) {
        const category = data.replace("back_to_qty_", "");
        await bot.deleteMessage(chatId, messageId);
        await selectCategory(bot, chatId, userId, category);
        return;
    }

    // Handle payment
    if (data.startsWith("pay_")) {
        const parts = data.replace("pay_", "").split("_");
        const category = parts[0];
        const quantity = parseInt(parts[1]);
        const totalPrice = parseInt(parts[2]);

        const paymentMessage = `💳 *Payment Instructions*

Selected: ₹${category} x${quantity}
Total: ₹${totalPrice}

Please send the payment screenshot now.

After sending screenshot, you'll be asked for UTR number.`;

        await bot.sendMessage(chatId, paymentMessage, {
            parse_mode: "Markdown"
        });

        // Store payment session
        if (!global.userSessions) global.userSessions = new Map();
        global.userSessions.set(`payment_${userId}`, {
            step: "waiting_screenshot",
            category: category,
            quantity: quantity,
            totalPrice: totalPrice,
            messageId: messageId
        });

        return;
    }

    // Handle admin accept order
    if (data.startsWith("admin_accept_")) {
        const orderId = data.replace("admin_accept_", "");
        await acceptOrder(bot, chatId, orderId, userId);
        return;
    }

    // Handle admin reject order
    if (data.startsWith("admin_reject_")) {
        const orderId = data.replace("admin_reject_", "");
        await bot.sendMessage(chatId, 
            `Please enter reason for rejecting order ${orderId}:`,
            { reply_markup: { force_reply: true } }
        );
        
        // Store rejection session
        global.adminSession = {
            step: "reject_reason",
            orderId: orderId
        };
        return;
    }

    // Handle copy order
    if (data.startsWith("copy_")) {
        const orderId = data.replace("copy_", "");
        const order = await query("SELECT voucher_codes FROM orders WHERE order_id = ?", [orderId]);
        
        if (order.length > 0) {
            await bot.sendMessage(chatId, 
                `📋 *Voucher Code*\n\n\`${order[0].voucher_codes}\``,
                { parse_mode: "Markdown" }
            );
        }
        return;
    }

    // Handle cancel order
    if (data.startsWith("cancel_")) {
        const orderId = data.replace("cancel_", "");
        await query("UPDATE orders SET status = 'expired' WHERE order_id = ? AND user_id = ?", 
            [orderId, userId]);
        
        await bot.sendMessage(chatId, "✅ Order cancelled successfully!");
        return;
    }

    // Handle leave support
    if (data === "leave_support") {
        await bot.deleteMessage(chatId, messageId);
        await showWelcomeMessage(bot, chatId, userId);
        return;
    }
}

async function acceptOrder(bot, chatId, orderId, adminId) {
    try {
        // Get order details
        const order = await query(`
            SELECT o.*, u.user_id 
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?
        `, [orderId]);

        if (order.length === 0) {
            await bot.sendMessage(chatId, "❌ Order not found!");
            return;
        }

        const orderData = order[0];

        // Get available vouchers
        const vouchers = await query(`
            SELECT code FROM vouchers 
            WHERE category_name = ? AND is_used = FALSE 
            LIMIT ?
        `, [orderData.category_name, orderData.quantity]);

        if (vouchers.length < orderData.quantity) {
            await bot.sendMessage(chatId, 
                `❌ Insufficient vouchers! Available: ${vouchers.length}, Required: ${orderData.quantity}`);
            return;
        }

        // Prepare voucher codes
        const voucherCodes = vouchers.map(v => v.code).join('\n');

        // Update order
        await query(`
            UPDATE orders 
            SET status = 'success', voucher_codes = ?, updated_at = NOW() 
            WHERE order_id = ?
        `, [voucherCodes, orderId]);

        // Mark vouchers as used
        for (const voucher of vouchers) {
            await query(`
                UPDATE vouchers 
                SET is_used = TRUE, used_by = ?, used_at = NOW(), order_id = ? 
                WHERE code = ?
            `, [orderData.user_id, orderId, voucher.code]);
        }

        // Send vouchers to user
        const userMessage = `✅ *Order Successful!*

Order ID: \`${orderId}\`
Category: ₹${orderData.category_name} x${orderData.quantity}
Total: ₹${orderData.totalPrice}

🎫 *Your Voucher Codes:*

\`${voucherCodes}\`

📋 *Instructions:*
1. Copy code above
2. Apply at Shein checkout
3. Maximum discount: ₹${orderData.category_name} per item

Thank you for your purchase! 🎉`;

        await bot.sendMessage(orderData.user_id, userMessage, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📋 Copy Code", callback_data: `copy_${orderId}` }]
                ]
            }
        });

        // Send notification to channel
        const channelMessage = `🎯 𝗡𝗲𝘄 𝗢𝗿𝗱𝗲𝗿 𝗦𝘂𝗯𝗺𝗶𝘁𝘁𝗲𝗱
━━━━━━━━━━━•❈•━━━━━━━━━━━
╰➤👤 𝗨𝗦𝗘𝗥 𝗡𝗔𝗠𝗘 : ${orderData.first_name || 'N/A'}
╰➤🆔 𝗨𝗦𝗘𝗥 𝗜𝗗 : ${orderData.user_id}
╰➤📡 𝗦𝗧𝗔𝗧𝗨𝗦: ✅ Success
╰➤ 🔰𝗤𝗨𝗔𝗟𝗜𝗧𝗬: High 📶
╰➤ 📦𝗧𝗢𝗧𝗔𝗟 𝗤𝗨𝗔𝗡𝗧𝗜𝗧𝗬 : ${orderData.quantity}
╰➤ 💳𝗖𝗢𝗦𝗧 : ₹${orderData.totalPrice}

🤖𝗕𝗢𝗧 𝗡𝗔𝗠𝗘 : @SheinVoucherHub_Bot
━━━━━━━━━━━•❈•━━━━━━━━━━━`;

        await bot.sendMessage(process.env.CHANNEL_2_ID, channelMessage);

        // Confirm to admin
        await bot.sendMessage(chatId, `✅ Order ${orderId} accepted and delivered!`);

    } catch (error) {
        console.error("Accept order error:", error);
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

module.exports = callbackHandler;
