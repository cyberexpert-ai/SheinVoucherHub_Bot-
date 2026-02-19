const { sendMainMenu } = require('../commands/start');
const { handleAdminCallback } = require('../commands/admin');
const { 
    selectCategory, selectQuantity, uploadScreenshot,
    myOrders, viewOrder
} = require('../commands/user');
const db = require('../database/database');
const { checkChannels } = require('../middlewares/channelCheck');

let adminState = {};

async function callbackHandler(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    await bot.deleteMessage(chatId, messageId).catch(() => {});
    
    // ==================== ADMIN CALLBACKS ====================
    if (data.startsWith('admin_')) {
        return handleAdminCallback(bot, callbackQuery);
    }
    
    // ==================== CHANNEL VERIFICATION ====================
    if (data === 'verify_channels') {
        const isMember = await checkChannels(bot, userId);
        if (isMember) {
            await bot.sendMessage(chatId, '✅ **Verification Successful!**', {
                parse_mode: 'Markdown'
            });
            await sendMainMenu(bot, chatId);
        } else {
            await bot.sendMessage(chatId, '❌ **Please join both channels first!**', {
                parse_mode: 'Markdown'
            });
        }
        return;
    }
    
    // ==================== ORDER APPROVAL ====================
    if (data.startsWith('approve_')) {
        if (userId.toString() === process.env.ADMIN_ID) {
            const orderId = data.replace('approve_', '');
            await processOrderApproval(bot, chatId, orderId);
        }
        return;
    }
    
    if (data.startsWith('reject_')) {
        if (userId.toString() === process.env.ADMIN_ID) {
            const orderId = data.replace('reject_', '');
            await processOrderRejection(bot, chatId, orderId);
        }
        return;
    }
    
    if (data.startsWith('recover_')) {
        if (userId.toString() === process.env.ADMIN_ID) {
            const orderId = data.replace('recover_', '');
            adminState[chatId] = { action: 'recovery_code', orderId };
            await bot.sendMessage(chatId, '📝 Send new voucher code for recovery:');
        }
        return;
    }
    
    if (data.startsWith('norecover_')) {
        if (userId.toString() === process.env.ADMIN_ID) {
            const orderId = data.replace('norecover_', '');
            const order = db.getOrder(orderId);
            if (order) {
                await bot.sendMessage(order.userId, 
                    `❌ **Recovery Failed**\n\nOrder ID: \`${orderId}\`\n\nCannot recover vouchers at this time.`,
                    { parse_mode: 'Markdown' }
                );
                await bot.sendMessage(chatId, '✅ User notified about recovery failure.');
            }
        }
        return;
    }
    
    // ==================== USER CALLBACKS ====================
    
    if (data === 'back_to_main') {
        return sendMainMenu(bot, chatId);
    }
    
    if (data.startsWith('select_cat_')) {
        const id = data.split('_')[2];
        return selectCategory(bot, chatId, userId, id);
    }
    
    if (data.startsWith('qty_')) {
        const qty = data.split('_')[1];
        return selectQuantity(bot, chatId, userId, qty);
    }
    
    if (data.startsWith('upload_ss_')) {
        const orderId = data.replace('upload_ss_', '');
        return uploadScreenshot(bot, chatId, userId, orderId);
    }
    
    if (data.startsWith('view_order_')) {
        const orderId = data.replace('view_order_', '');
        return viewOrder(bot, chatId, orderId);
    }
    
    if (data === 'back_to_categories') {
        const { buyVouchers } = require('../commands/user');
        return buyVouchers(bot, { chat: { id: chatId }, from: { id: userId } });
    }
    
    if (data === 'back_to_orders') {
        return myOrders(bot, { chat: { id: chatId }, from: { id: userId } });
    }
}

async function processOrderApproval(bot, chatId, orderId) {
    const order = db.getOrder(orderId);
    if (!order) return;
    
    // Get available vouchers
    const vouchers = db.getAvailableVouchers(order.categoryId);
    
    if (vouchers.length < order.quantity) {
        return bot.sendMessage(chatId, 
            `❌ **Insufficient Stock!**\nAvailable: ${vouchers.length}\nRequired: ${order.quantity}`,
            { parse_mode: 'Markdown' }
        );
    }
    
    // Assign vouchers
    const assignedCodes = [];
    for (let i = 0; i < order.quantity; i++) {
        const voucher = vouchers[i];
        db.assignVoucher(voucher.id, order.userId, orderId);
        assignedCodes.push(voucher.code);
    }
    
    // Update order status
    db.updateOrderStatus(orderId, 'delivered');
    
    // Send vouchers to user
    const voucherMsg = `✅ **Payment Approved! Vouchers Delivered**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`
**Category:** ${order.categoryName}
**Quantity:** ${order.quantity}
**Price per code:** ₹${order.pricePerCode}
**Total:** ₹${order.totalPrice}

**Your Vouchers:**
${assignedCodes.map((c, i) => `${i+1}. \`${c}\``).join('\n')}

Thank you for shopping with us! 🎉`;

    await bot.sendMessage(order.userId, voucherMsg, { parse_mode: 'Markdown' });
    
    // Return to main menu for user
    setTimeout(async () => {
        const { sendMainMenu } = require('../commands/start');
        await sendMainMenu(bot, order.userId);
    }, 2000);
    
    // Send notification to channel (using channel ID)
    const user = db.getUser(order.userId);
    const channelId = db.getChannel2Id();
    
    const notificationMsg = `🎯 **New Order Delivered**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╰➤👤 **User:** ${user?.firstName || 'N/A'} (@${user?.username || 'N/A'})
╰➤🆔 **User ID:** \`${order.userId}\`
╰➤📡 **Status:** ✅ Success
╰➤📦 **Category:** ${order.categoryName}
╰➤🔢 **Quantity:** ${order.quantity}
╰➤💰 **Amount:** ₹${order.totalPrice}

🤖 **Bot:** @SheinVoucherHub_Bot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    try {
        await bot.sendMessage(channelId, notificationMsg, { parse_mode: 'Markdown' });
        console.log(`Notification sent to channel ${channelId}`);
    } catch (error) {
        console.error('Error sending to channel:', error);
        // Try sending to username as fallback
        try {
            await bot.sendMessage(process.env.CHANNEL_2_USERNAME, notificationMsg, { parse_mode: 'Markdown' });
        } catch (e) {
            console.error('Error sending to channel username:', e);
        }
    }
    
    await bot.sendMessage(chatId, `✅ Order ${orderId} approved! Vouchers sent.`);
}

async function processOrderRejection(bot, chatId, orderId) {
    const order = db.getOrder(orderId);
    if (!order) return;
    
    db.updateOrderStatus(orderId, 'rejected', 'Payment verification failed');
    
    await bot.sendMessage(order.userId,
        `❌ **Payment Rejected**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`

Your payment could not be verified.
Please contact ${process.env.SUPPORT_BOT} if you think this is a mistake.`,
        { parse_mode: 'Markdown' }
    );
    
    // Return to main menu for user
    setTimeout(async () => {
        const { sendMainMenu } = require('../commands/start');
        await sendMainMenu(bot, order.userId);
    }, 2000);
    
    await bot.sendMessage(chatId, `✅ Order ${orderId} rejected. User notified.`);
}

module.exports = { callbackHandler };
