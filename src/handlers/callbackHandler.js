const db = require('../database/database');
const { checkChannelMembership } = require('../middlewares/channelCheck');
const { isAdmin } = require('../middlewares/auth');
const startCommand = require('../commands/start');
const { showCategories, showQuantityOptions, showPayment } = require('../commands/user/buyVoucher');
const { showOrders } = require('../commands/user/myOrders');
const { startRecovery } = require('../commands/user/recoverVoucher');
const { startSupport } = require('../commands/user/support');
const { showDisclaimer } = require('../commands/user/disclaimer');
const helpers = require('../utils/helpers');
const constants = require('../utils/constants');

async function handleCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    
    // Verify channel membership for all callbacks except verify_channels
    if (data !== 'verify_channels') {
        const membership = await checkChannelMembership(bot, userId);
        if (!membership.joined) {
            await bot.editMessageText(constants.JOIN_MESSAGE, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Verify', callback_data: 'verify_channels' }]
                    ]
                }
            });
            return;
        }
    }
    
    // Handle callback data
    if (data === 'verify_channels') {
        const membership = await checkChannelMembership(bot, userId);
        if (membership.joined) {
            await startCommand(bot, { chat: { id: chatId }, from: { id: userId } });
        } else {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: `Please join ${membership.channel || 'the channel'} first!`,
                show_alert: true
            });
        }
        return;
    }
    
    if (data === 'back_main') {
        await startCommand(bot, { chat: { id: chatId }, from: { id: userId } });
        return;
    }
    
    if (data === 'buy_back_categories') {
        await showCategories(bot, chatId, userId, true);
        return;
    }
    
    if (data === 'my_orders') {
        await showOrders(bot, chatId, userId);
        return;
    }
    
    if (data === 'support') {
        await startSupport(bot, chatId, userId);
        return;
    }
    
    // Handle category selection
    if (data.startsWith('buy_cat_')) {
        const categoryId = data.split('_')[2];
        await showQuantityOptions(bot, chatId, userId, categoryId, true);
        return;
    }
    
    // Handle quantity selection
    if (data.startsWith('buy_qty_')) {
        const parts = data.split('_');
        const categoryId = parts[2];
        const quantity = parseInt(parts[3]);
        await showPayment(bot, chatId, userId, categoryId, quantity);
        return;
    }
    
    // Handle custom quantity
    if (data.startsWith('buy_custom_')) {
        const categoryId = data.split('_')[2];
        const availableStock = await db.getVoucherCount(categoryId, false);
        
        const msg = await bot.sendMessage(chatId,
            `✏️ Enter quantity (1-${availableStock}):`,
            {
                reply_markup: {
                    force_reply: true,
                    selective: true
                }
            }
        );
        
        global.waitingFor = global.waitingFor || {};
        global.waitingFor[userId] = {
            type: 'custom_quantity',
            categoryId: categoryId,
            messageId: msg.message_id
        };
        return;
    }
    
    // Handle back to quantity
    if (data.startsWith('buy_back_qty_')) {
        const categoryId = data.split('_')[3];
        await showQuantityOptions(bot, chatId, userId, categoryId, true);
        return;
    }
    
    // Handle payment done
    if (data.startsWith('payment_done_')) {
        const paymentUserId = parseInt(data.split('_')[2]);
        if (paymentUserId !== userId) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: 'This payment is for another user!',
                show_alert: true
            });
            return;
        }
        
        await require('../commands/user/buyVoucher').requestScreenshot(bot, chatId, userId);
        return;
    }
    
    // Handle copy code
    if (data.startsWith('copy_code_')) {
        const code = data.substring(10);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: `Code copied: ${code}`,
            show_alert: false
        });
        
        // Send code as message for easy copying
        await bot.sendMessage(chatId, `📋 Code: \`${code}\``, {
            parse_mode: 'Markdown'
        });
        return;
    }
    
    // Admin callbacks
    if (await isAdmin(userId)) {
        if (data.startsWith('admin_accept_')) {
            const orderId = data.split('_')[2];
            await handleAdminAccept(bot, chatId, userId, orderId, callbackQuery);
            return;
        }
        
        if (data.startsWith('admin_reject_')) {
            const orderId = data.split('_')[2];
            await handleAdminReject(bot, chatId, userId, orderId, callbackQuery);
            return;
        }
    }
}

async function handleAdminAccept(bot, chatId, adminId, orderId, callbackQuery) {
    const order = await db.getOrder(orderId);
    
    if (!order) {
        await bot.editMessageText('❌ Order not found.', {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
        });
        return;
    }
    
    // Get available vouchers
    const vouchers = await db.getAvailableVouchers(order.category_id, order.quantity);
    
    if (vouchers.length < order.quantity) {
        await bot.editMessageText('❌ Not enough vouchers in stock!', {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
        });
        
        // Notify user
        await bot.sendMessage(order.user_id,
            `❌ Your order ${orderId} cannot be fulfilled due to insufficient stock.\n` +
            `Admin has been notified. Refund will be processed.`
        );
        return;
    }
    
    // Assign vouchers to order
    await db.assignVouchersToOrder(orderId, vouchers);
    
    // Mark vouchers as used
    for (const voucher of vouchers) {
        await db.markVoucherAsUsed(voucher.id, order.user_id, orderId);
    }
    
    // Update order status
    await db.updateOrderStatus(orderId, 'completed');
    
    // Update user stats
    await db.query(
        'UPDATE users SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE telegram_id = ?',
        [order.total_price, order.user_id]
    );
    
    // Send vouchers to user
    const voucherList = vouchers.map(v => v.code).join('\n');
    await bot.sendMessage(order.user_id,
        `✅ Order Completed!\n\n` +
        `Order ID: ${orderId}\n` +
        `Category: ${order.category_name}\n` +
        `Quantity: ${order.quantity}\n\n` +
        `📋 Your Voucher Codes:\n${voucherList}`,
        {
            reply_markup: {
                inline_keyboard: vouchers.map(v => [{
                    text: `📋 Copy Code`,
                    callback_data: `copy_code_${v.code}`
                }])
            }
        }
    );
    
    // Update admin message
    await bot.editMessageText(`✅ Order ${orderId} approved and delivered.`, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id
    });
}

async function handleAdminReject(bot, chatId, adminId, orderId, callbackQuery) {
    // Ask for rejection reason
    const msg = await bot.sendMessage(chatId,
        `❌ Rejecting order: ${orderId}\n\nPlease enter rejection reason:`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[adminId] = {
        type: 'admin_reject_reason',
        orderId: orderId,
        messageId: msg.message_id,
        originalMsgId: callbackQuery.message.message_id
    };
}

module.exports = {
    handleCallback
};
