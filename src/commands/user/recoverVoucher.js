const db = require('../../database/database');
const helpers = require('../../utils/helpers');
const constants = require('../../utils/constants');

async function startRecovery(bot, chatId, userId) {
    const msg = await bot.sendMessage(chatId,
        `🔁 Recover Vouchers\n\n` +
        `Send your Order ID\n` +
        `Example: SVH-20260130-54C98D\n\n` +
        `⏰ Recovery available for 2 hours after order.`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'recovery_order_id',
        messageId: msg.message_id
    };
}

async function processRecovery(bot, chatId, userId, orderId) {
    // Validate order ID format
    if (!helpers.validateOrderId(orderId)) {
        await bot.sendMessage(chatId,
            `❌ Invalid order ID format.\n` +
            `Please use format: SVH-YYYYMMDD-XXXXXX`,
            {
                reply_markup: {
                    keyboard: [[constants.BUTTONS.BACK]],
                    resize_keyboard: true
                }
            }
        );
        return;
    }
    
    // Check if user is trying to recover someone else's order
    const order = await db.getOrder(orderId);
    
    if (!order) {
        await bot.sendMessage(chatId,
            helpers.format(constants.ERRORS.ORDER_NOT_FOUND, orderId),
            {
                reply_markup: {
                    keyboard: [[constants.BUTTONS.BACK]],
                    resize_keyboard: true
                }
            }
        );
        
        // Log fake recovery attempt
        await db.query(
            'INSERT INTO user_warnings (user_id, reason, warning_type) VALUES (?, ?, ?)',
            [userId, `Fake recovery attempt: ${orderId}`, 'fake_recovery']
        );
        
        return;
    }
    
    // Check if order belongs to this user
    if (order.user_id != userId) {
        await bot.sendMessage(chatId,
            `❌ This order ID belongs to a different account.\n` +
            `Recovery is only available for your own orders.`,
            {
                reply_markup: {
                    keyboard: [[constants.BUTTONS.BACK]],
                    resize_keyboard: true
                }
            }
        );
        
        // Log unauthorized access attempt
        await db.query(
            'INSERT INTO user_warnings (user_id, reason, warning_type) VALUES (?, ?, ?)',
            [userId, `Unauthorized recovery attempt: ${orderId}`, 'other']
        );
        
        return;
    }
    
    // Check if recovery is still active (within 2 hours)
    const recoveryExpiry = new Date(order.recovery_expires);
    const now = new Date();
    
    if (now > recoveryExpiry) {
        await bot.sendMessage(chatId,
            `⏰ This recovery link has expired.\n` +
            `Orders are recoverable for 2 hours only.\n\n` +
            `Please contact support if you need help.`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🆘 Contact Support', callback_data: 'support' }]
                    ]
                }
            }
        );
        return;
    }
    
    // Check if order is completed
    if (order.status !== 'completed') {
        await bot.sendMessage(chatId,
            `⏳ This order is still ${order.status}.\n` +
            `Recovery is only available for completed orders.`,
            {
                reply_markup: {
                    keyboard: [[constants.BUTTONS.BACK]],
                    resize_keyboard: true
                }
            }
        );
        return;
    }
    
    // Get vouchers for this order
    const vouchers = await db.query(
        'SELECT voucher_code FROM order_vouchers WHERE order_id = ?',
        [orderId]
    );
    
    if (!vouchers.length) {
        await bot.sendMessage(chatId,
            `❌ No vouchers found for this order.\n` +
            `Please contact support.`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🆘 Contact Support', callback_data: 'support' }]
                    ]
                }
            }
        );
        return;
    }
    
    // Send vouchers to user
    let message = `✅ Order Found!\n\n`;
    message += `Order ID: ${orderId}\n`;
    message += `Category: ${order.category_name}\n`;
    message += `Quantity: ${order.quantity}\n`;
    message += `\n📋 Your Voucher Codes:\n\n`;
    
    const codeList = vouchers.map(v => v.voucher_code).join('\n');
    message += codeList;
    
    // Create copy buttons
    const buttons = [];
    for (let i = 0; i < vouchers.length; i++) {
        buttons.push([{
            text: `📋 Copy Code ${i+1}`,
            callback_data: `copy_code_${vouchers[i].voucher_code}`
        }]);
    }
    buttons.push([{ text: constants.BUTTONS.BACK, callback_data: 'back_main' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

module.exports = {
    startRecovery,
    processRecovery
};
