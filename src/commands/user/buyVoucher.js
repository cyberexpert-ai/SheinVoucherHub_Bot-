const db = require('../../database/database');
const helpers = require('../../utils/helpers');
const constants = require('../../utils/constants');

async function showCategories(bot, chatId, userId, edit = false) {
    const categories = await db.getCategories(true);
    
    if (!categories.length) {
        const msg = '❌ No categories available at the moment.';
        if (edit) {
            await bot.editMessageText(msg, {
                chat_id: chatId,
                message_id: global.lastMessages[userId]
            });
        } else {
            const sent = await bot.sendMessage(chatId, msg);
            global.lastMessages[userId] = sent.message_id;
        }
        return;
    }
    
    const buttons = categories.map(c => [{
        text: `${c.display_name || c.name} (Stock: ${c.stock || 0})`,
        callback_data: `buy_cat_${c.id}`
    }]);
    
    buttons.push([{ text: constants.BUTTONS.BACK, callback_data: 'back_main' }]);
    
    const message = '🛒 Select voucher category:';
    
    if (edit) {
        await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: global.lastMessages[userId],
            reply_markup: { inline_keyboard: buttons }
        });
    } else {
        const sent = await bot.sendMessage(chatId, message, {
            reply_markup: { inline_keyboard: buttons }
        });
        global.lastMessages[userId] = sent.message_id;
    }
}

async function showQuantityOptions(bot, chatId, userId, categoryId, edit = false) {
    const category = await db.getCategory(categoryId);
    const availableStock = await db.getVoucherCount(categoryId, false);
    
    if (availableStock === 0) {
        const msg = `❌ Sorry, ${category.display_name} is out of stock.`;
        if (edit) {
            await bot.editMessageText(msg, {
                chat_id: chatId,
                message_id: global.lastMessages[userId],
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '↩️ Back to Categories', callback_data: 'buy_back_categories' }]
                    ]
                }
            });
        } else {
            const sent = await bot.sendMessage(chatId, msg, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '↩️ Back to Categories', callback_data: 'buy_back_categories' }]
                    ]
                }
            });
            global.lastMessages[userId] = sent.message_id;
        }
        return;
    }
    
    // Get price for common quantities
    const quantities = [1, 5, 10, 20, 50, 100].filter(q => q <= availableStock);
    
    const priceButtons = [];
    for (const qty of quantities) {
        const price = await db.getPriceTier(categoryId, qty) || helpers.calculateTotalPrice(category, qty, []);
        priceButtons.push([{
            text: `${qty} code${qty > 1 ? 's' : ''} - ₹${price}`,
            callback_data: `buy_qty_${categoryId}_${qty}`
        }]);
    }
    
    // Custom quantity option
    priceButtons.push([{
        text: '✏️ Custom Quantity',
        callback_data: `buy_custom_${categoryId}`
    }]);
    
    priceButtons.push([
        { text: '↩️ Back', callback_data: 'buy_back_categories' },
        { text: '🏠 Home', callback_data: 'back_main' }
    ]);
    
    const message = `${category.display_name}\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `📦 Available Stock: ${availableStock} codes\n` +
                    `💰 Select quantity:\n`;
    
    if (edit) {
        await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: global.lastMessages[userId],
            reply_markup: { inline_keyboard: priceButtons }
        });
    } else {
        const sent = await bot.sendMessage(chatId, message, {
            reply_markup: { inline_keyboard: priceButtons }
        });
        global.lastMessages[userId] = sent.message_id;
    }
}

async function showPayment(bot, chatId, userId, categoryId, quantity) {
    const category = await db.getCategory(categoryId);
    const price = await db.getPriceTier(categoryId, quantity) || 
                  helpers.calculateTotalPrice(category, quantity, []);
    
    global.tempOrder = global.tempOrder || {};
    global.tempOrder[userId] = {
        categoryId,
        quantity,
        price,
        step: 'payment'
    };
    
    const message = `💳 Payment Details\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `Category: ${category.display_name}\n` +
                    `Quantity: ${quantity}\n` +
                    `Total: ₹${price}\n\n` +
                    `📱 Scan QR code to pay:\n` +
                    `⬇️ After payment, tap "I have paid"`;
    
    const sent = await bot.sendPhoto(chatId, constants.PAYMENT_QR, {
        caption: message,
        reply_markup: {
            inline_keyboard: [
                [{ text: '💰 I have paid', callback_data: `payment_done_${userId}` }],
                [{ text: '↩️ Back', callback_data: `buy_back_qty_${categoryId}` }]
            ]
        }
    });
    
    global.lastMessages[userId] = sent.message_id;
}

async function requestScreenshot(bot, chatId, userId) {
    const msg = await bot.sendMessage(chatId, 
        `📸 Please send your payment screenshot.\n\n` +
        `⚠️ Fake screenshots will result in permanent ban.`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'screenshot',
        messageId: msg.message_id
    };
}

async function requestUtr(bot, chatId, userId, screenshotId) {
    global.tempOrder[userId].screenshotId = screenshotId;
    global.tempOrder[userId].step = 'utr';
    
    const msg = await bot.sendMessage(chatId,
        `📝 Please send your UTR/Transaction ID.\n\n` +
        `⚠️ Fake UTR will result in permanent ban.`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor[userId] = {
        type: 'utr',
        messageId: msg.message_id
    };
}

async function submitOrder(bot, chatId, userId, utr) {
    const orderData = global.tempOrder[userId];
    
    // Check if UTR already used
    const utrExists = await db.checkUtrExists(utr);
    if (utrExists) {
        // Warning for fake UTR
        await db.query(
            'INSERT INTO user_warnings (user_id, reason, warning_type) VALUES (?, ?, ?)',
            [userId, 'Duplicate/Fake UTR', 'fake_utr']
        );
        
        // Check warning count
        const warnings = await db.query(
            'SELECT COUNT(*) as count FROM user_warnings WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
            [userId]
        );
        
        if (warnings[0].count >= 3) {
            // Temporary block
            await db.blockUser(userId, 'Multiple fake UTR attempts', 30);
            await bot.sendMessage(chatId, '⛔️ You have been temporarily blocked for 30 minutes due to multiple fake UTR attempts.');
            delete global.tempOrder[userId];
            return;
        }
        
        await bot.sendMessage(chatId, constants.ERRORS.UTR_EXISTS, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '↩️ Try Again', callback_data: `buy_back_qty_${orderData.categoryId}` }]
                ]
            }
        });
        return;
    }
    
    // Generate order ID
    const orderId = helpers.generateOrderId();
    
    // Create order in database
    await db.createOrder({
        order_id: orderId,
        user_id: userId,
        category_id: orderData.categoryId,
        quantity: orderData.quantity,
        total_price: orderData.price,
        utr_number: utr,
        screenshot_id: orderData.screenshotId
    });
    
    // Log UTR for fraud detection
    await db.query(
        'INSERT INTO fraud_detection (utr_number, order_id, user_id, reason) VALUES (?, ?, ?, ?)',
        [utr, orderId, userId, 'order_submitted']
    );
    
    // Get user info for notification
    const user = await db.getUser(userId);
    const category = await db.getCategory(orderData.categoryId);
    
    // Send notification to admin
    const notification = `🆕 New Order Received\n\n` +
                        `Order ID: ${orderId}\n` +
                        `User: ${user.first_name} (@${user.username || 'N/A'})\n` +
                        `User ID: ${userId}\n` +
                        `Category: ${category.display_name}\n` +
                        `Quantity: ${orderData.quantity}\n` +
                        `Total: ₹${orderData.price}\n` +
                        `UTR: ${utr}`;
    
    await bot.sendMessage(process.env.ADMIN_ID, notification, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Accept', callback_data: `admin_accept_${orderId}` },
                    { text: '❌ Reject', callback_data: `admin_reject_${orderId}` }
                ]
            ]
        }
    });
    
    // Send notification to channel
    const channelMsg = helpers.format(constants.ORDER_NOTIFICATION,
        user.first_name || 'N/A',
        userId,
        orderData.quantity,
        `₹${orderData.price}`
    );
    
    try {
        await bot.sendMessage(process.env.CHANNEL_2_ID, channelMsg);
    } catch (error) {
        console.error('Channel notification error:', error);
    }
    
    // Thank user
    const thankMsg = await bot.sendMessage(chatId,
        `✅ Order Submitted Successfully!\n\n` +
        `Order ID: ${orderId}\n` +
        `Date: ${helpers.formatDate(new Date())}\n` +
        `Category: ${category.display_name}\n` +
        `Quantity: ${orderData.quantity}\n` +
        `Total: ₹${orderData.price}\n\n` +
        `📌 Your order is being processed. You will receive vouchers shortly after admin approval.`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📦 Check Order Status', callback_data: 'my_orders' }],
                    [{ text: '🏠 Main Menu', callback_data: 'back_main' }]
                ]
            }
        }
    );
    
    global.lastMessages[userId] = thankMsg.message_id;
    delete global.tempOrder[userId];
    delete global.waitingFor[userId];
}

module.exports = {
    showCategories,
    showQuantityOptions,
    showPayment,
    requestScreenshot,
    requestUtr,
    submitOrder
};
