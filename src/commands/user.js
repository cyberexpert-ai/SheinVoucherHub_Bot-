const { 
    getCategories, getAvailableVouchers, createOrder,
    getUserOrders, getOrder, updateOrderStatus,
    assignVoucherToOrder
} = require('../sheets/googleSheets');
const { v4: uuidv4 } = require('uuid');

let userState = {};

async function buyVoucher(bot, msg) {
    const chatId = msg.chat.id;
    const categories = await getCategories();
    
    const keyboard = categories.map(cat => [
        { text: `💰 ${cat.name} - ₹${cat.price_per_code} (${cat.stock} left)`, callback_data: `select_cat_${cat.category_id}` }
    ]);
    
    keyboard.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);
    
    await bot.sendMessage(chatId, '🛒 Select voucher category:', {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function selectCategory(bot, chatId, userId, categoryId) {
    const categories = await getCategories();
    const category = categories.find(c => c.category_id === categoryId);
    
    if (!category || parseInt(category.stock) <= 0) {
        return bot.sendMessage(chatId, '❌ This category is out of stock!');
    }
    
    userState[userId] = { category: categoryId, price: category.price_per_code };
    
    const quantityKeyboard = {
        inline_keyboard: [
            [
                { text: '1', callback_data: `qty_1` },
                { text: '2', callback_data: `qty_2` },
                { text: '3', callback_data: `qty_3` }
            ],
            [
                { text: '4', callback_data: `qty_4` },
                { text: '5', callback_data: `qty_5` },
                { text: 'Custom', callback_data: `qty_custom` }
            ],
            [{ text: '🔙 Back', callback_data: 'back_to_categories' }]
        ]
    };
    
    await bot.sendMessage(chatId, `📦 Selected: ${category.name}\n💰 Price per code: ₹${category.price_per_code}\n📊 Available: ${category.stock}\n\nSelect quantity:`, {
        reply_markup: quantityKeyboard
    });
}

async function selectQuantity(bot, chatId, userId, quantity) {
    if (quantity === 'custom') {
        userState[userId].awaitingQty = true;
        return bot.sendMessage(chatId, '📝 Enter quantity (max available):');
    }
    
    const state = userState[userId];
    const categories = await getCategories();
    const category = categories.find(c => c.category_id === state.category);
    
    if (parseInt(quantity) > parseInt(category.stock)) {
        return bot.sendMessage(chatId, `❌ Only ${category.stock} codes available!`);
    }
    
    state.quantity = quantity;
    const totalPrice = parseInt(quantity) * parseInt(state.price);
    
    // Send payment photo
    await bot.sendPhoto(chatId, 'https://i.supaimg.com/00332ad4-8aa7-408f-8705-55dbc91ea737.jpg', {
        caption: `💳 Payment Details
━━━━━━━━━━━━━━━━━━━━━

📦 Category: ${category.name}
🔢 Quantity: ${quantity}
💰 Total: ₹${totalPrice}

⚠️ Please send payment screenshot and UTR number
❌ Fake payments will result in permanent ban!`
    });
    
    userState[userId].awaitingPayment = true;
    userState[userId].totalPrice = totalPrice;
}

async function processPayment(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    if (msg.photo) {
        // User sent screenshot
        const photo = msg.photo[msg.photo.length - 1].file_id;
        userState[userId].screenshot = photo;
        
        await bot.sendMessage(chatId, '📝 Please enter your transaction ID/UTR number:');
        userState[userId].awaitingUtr = true;
        
    } else if (userState[userId]?.awaitingUtr) {
        // User sent UTR
        const state = userState[userId];
        
        // Create order
        const orderId = await createOrder(
            userId,
            state.category,
            state.quantity,
            state.totalPrice,
            'manual'
        );
        
        await updateOrderPayment(orderId, text, state.screenshot);
        
        // Send to admin for approval
        await bot.sendMessage(process.env.ADMIN_ID, 
            `🆕 New Payment Pending
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
User: ${msg.from.first_name} (@${msg.from.username})
User ID: ${userId}
Amount: ₹${state.totalPrice}
UTR: ${text}

Approve to send vouchers:`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Approve', callback_data: `approve_${orderId}` },
                            { text: '❌ Reject', callback_data: `reject_${orderId}` }
                        ]
                    ]
                }
            }
        );
        
        // Forward screenshot
        await bot.forwardMessage(process.env.ADMIN_ID, chatId, msg.message_id - 1);
        
        await bot.sendMessage(chatId, `✅ Payment received! Order ID: ${orderId}\nAdmin will verify and deliver vouchers soon.`);
        
        delete userState[userId];
    }
}

async function recoverVoucher(bot, msg) {
    const chatId = msg.chat.id;
    
    const message = `🔁 Recover Vouchers

Send your Order ID
Example: SVH-1234567890-ABC123

⚠️ Recovery available within 2 hours of purchase`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: [['↩️ Back']],
            resize_keyboard: true
        }
    });
    
    userState[msg.from.id] = { action: 'recovery' };
}

async function processRecovery(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const orderId = msg.text;
    
    const order = await getOrder(orderId);
    
    if (!order) {
        return bot.sendMessage(chatId, `⚠️ Order not found: ${orderId}`);
    }
    
    if (order.user_id !== userId.toString()) {
        return bot.sendMessage(chatId, '❌ This order belongs to another user!');
    }
    
    const recoveryExpiry = new Date(order.recovery_expiry);
    if (new Date() > recoveryExpiry) {
        return bot.sendMessage(chatId, '⏰ Recovery period expired (2 hours limit)');
    }
    
    // Forward to admin
    await bot.sendMessage(process.env.ADMIN_ID,
        `🔄 Recovery Request
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
User: ${msg.from.first_name} (@${msg.from.username})
User ID: ${userId}
Category: ${order.category}
Quantity: ${order.quantity}

Process recovery:`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Send New Code', callback_data: `recover_${orderId}` },
                        { text: '❌ Cannot Recover', callback_data: `norecover_${orderId}` }
                    ]
                ]
            }
        }
    );
    
    await bot.sendMessage(chatId, '✅ Recovery request sent to admin. You will receive codes soon.');
}

async function myOrders(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const orders = await getUserOrders(userId);
    
    if (orders.length === 0) {
        return bot.sendMessage(chatId, '📦 You don\'t have any orders yet.', {
            reply_markup: {
                keyboard: [['↩️ Back']],
                resize_keyboard: true
            }
        });
    }
    
    let message = '📦 Your Orders\n━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    for (const order of orders.slice(0, 5)) { // Show last 5 orders
        const statusEmoji = order.status === 'delivered' ? '✅' : '⏳';
        message += `🧾 ${order.order_id}\n`;
        message += `🎟 ${order.category} | Qty ${order.quantity}\n`;
        message += `💰 ₹${order.total_price} | ${statusEmoji} ${order.status}\n\n`;
    }
    
    message += 'Click order ID to view details';
    
    const keyboard = orders.slice(0, 5).map(order => [
        { text: order.order_id, callback_data: `view_order_${order.order_id}` }
    ]);
    
    keyboard.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function viewOrder(bot, chatId, orderId) {
    const order = await getOrder(orderId);
    
    if (!order) return;
    
    let message = `📦 Order Details
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${order.order_id}
Date: ${new Date(order.order_date).toLocaleString()}
Category: ${order.category}
Quantity: ${order.quantity}
Total: ₹${order.total_price}
Status: ${order.status === 'delivered' ? '✅ Delivered' : '⏳ Pending'}`;
    
    if (order.status === 'delivered') {
        // Get vouchers
        const vouchers = await getAvailableVouchers(order.category); // Modify this to get actual vouchers
        
        const keyboard = vouchers.slice(0, parseInt(order.quantity)).map(v => [
            { text: `🎟 Copy Code ${v.code}`, callback_data: `copy_${v.voucher_id}` }
        ]);
        
        keyboard.push([{ text: '🔙 Back', callback_data: 'back_to_orders' }]);
        
        await bot.sendMessage(chatId, message, {
            reply_markup: { inline_keyboard: keyboard }
        });
    } else {
        await bot.sendMessage(chatId, message, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 Back', callback_data: 'back_to_orders' }]
                ]
            }
        });
    }
}

async function disclaimer(bot, msg) {
    const chatId = msg.chat.id;
    
    const message = `📜 Disclaimer

• All coupons given are 100% OFF upto voucher amount with NO minimum order amount required.
• Contact Support if you're facing any issue with vouchers.
• Only replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.
• No returns.
• Refund will be only given if vouchers are out of stock.
• Fake payment attempts will result in permanent ban.`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: [['↩️ Back']],
            resize_keyboard: true
        }
    });
}

async function support(bot, msg) {
    const chatId = msg.chat.id;
    
    const message = `🆘 Support

Send your message to admin.
Admin will reply as soon as possible.

⚠️ Please avoid spam, fake issues, or illegal content.
Violation may result in permanent ban.`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: [['↩️ Leave']],
            resize_keyboard: true
        }
    });
    
    userState[msg.from.id] = { action: 'support' };
}

async function processSupport(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    // Forward to admin
    await bot.sendMessage(process.env.ADMIN_ID,
        `💬 Support Message
━━━━━━━━━━━━━━━━━━━━━

From: ${msg.from.first_name} (@${msg.from.username})
User ID: ${userId}

Message: ${text}`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✏️ Reply', callback_data: `reply_${userId}` }]
                ]
            }
        }
    );
    
    await bot.sendMessage(chatId, '✅ Message sent to admin. You will get reply soon.');
}

module.exports = {
    buyVoucher,
    selectCategory,
    selectQuantity,
    processPayment,
    recoverVoucher,
    processRecovery,
    myOrders,
    viewOrder,
    disclaimer,
    support,
    processSupport
};
