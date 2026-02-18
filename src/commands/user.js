const { 
    getCategories, 
    getUserOrders, 
    getOrder,
    getAvailableVouchers,
    createOrder
} = require('../sheets/googleSheets');
const { initiateManualPayment } = require('../handlers/paymentHandler');
const keyboards = require('../keyboards/keyboards');

let userState = {};

async function buyVouchers(bot, msg) {
    const chatId = msg.chat.id;
    const categories = await getCategories();
    
    if (categories.length === 0) {
        return bot.sendMessage(chatId, '❌ No categories available at the moment.');
    }
    
    const keyboard = {
        inline_keyboard: categories.map(cat => {
            const match = cat.name.match(/₹(\d+)/);
            const displayName = match ? match[1] : cat.name;
            
            return [{
                text: `💰 ₹${displayName} - ₹${cat.price_per_code} (${cat.stock} left)`,
                callback_data: `select_cat_${cat.category_id}`
            }];
        }).concat([[{ text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }]])
    };
    
    await bot.sendMessage(chatId, '🛒 **Select Voucher Category**', {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function selectCategory(bot, chatId, userId, categoryId) {
    const categories = await getCategories();
    const category = categories.find(c => c.category_id === categoryId);
    
    if (!category || parseInt(category.stock) <= 0) {
        return bot.sendMessage(chatId, '❌ This category is out of stock!');
    }
    
    const match = category.name.match(/₹(\d+)/);
    const displayName = match ? match[1] : category.name;
    
    userState[userId] = { 
        categoryId: category.category_id,
        categoryName: category.name,
        displayName: displayName,
        price: category.price_per_code,
        maxStock: category.stock
    };
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: '1️⃣', callback_data: 'qty_1' },
                { text: '2️⃣', callback_data: 'qty_2' },
                { text: '3️⃣', callback_data: 'qty_3' }
            ],
            [
                { text: '4️⃣', callback_data: 'qty_4' },
                { text: '5️⃣', callback_data: 'qty_5' },
                { text: '🔢 Custom', callback_data: 'qty_custom' }
            ],
            [{ text: '🔙 Back to Categories', callback_data: 'back_to_categories' }]
        ]
    };
    
    await bot.sendMessage(chatId, 
        `📦 **Selected:** ₹${displayName} Voucher
💰 **Price per code:** ₹${category.price_per_code}
📊 **Available:** ${category.stock}

Select quantity:`,
        {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        }
    );
}

async function selectQuantity(bot, chatId, userId, quantity) {
    if (quantity === 'custom') {
        userState[userId].awaitingQty = true;
        return bot.sendMessage(chatId, '📝 **Enter quantity** (max available):\n\nExample: `10`', {
            parse_mode: 'Markdown',
            reply_markup: { force_reply: true }
        });
    }
    
    const state = userState[userId];
    const qty = parseInt(quantity);
    
    if (qty > parseInt(state.maxStock)) {
        return bot.sendMessage(chatId, `❌ Only ${state.maxStock} codes available!`);
    }
    
    const totalPrice = qty * parseInt(state.price);
    
    // Create order
    const orderId = await createOrder(
        userId,
        state.categoryId,
        qty,
        totalPrice,
        'pending'
    );
    
    state.orderId = orderId;
    state.quantity = qty;
    state.totalPrice = totalPrice;
    
    // Send payment instructions
    await sendPaymentInstructions(bot, chatId, userId, state);
}

async function sendPaymentInstructions(bot, chatId, userId, state) {
    const paymentMessage = `💳 **Manual Payment Instructions**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **Order Summary**
• Order ID: \`${state.orderId}\`
• Category: ₹${state.displayName} Voucher
• Quantity: ${state.quantity}
• Total Amount: ₹${state.totalPrice}

📱 **Payment Steps:**
1️⃣ Scan the QR code below with any UPI app
2️⃣ Pay exact amount: ₹${state.totalPrice}
3️⃣ Take screenshot of successful payment
4️⃣ Upload screenshot here
5️⃣ Enter UTR/Transaction ID

⏰ **Note:** You have 30 minutes to complete payment

👇 **Click the button below to start**`;

    await bot.sendMessage(chatId, paymentMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📱 Show QR Code', callback_data: `show_qr_${state.orderId}` }],
                [{ text: '📸 Upload Screenshot', callback_data: `upload_ss_${state.orderId}` }],
                [{ text: '❌ Cancel Order', callback_data: 'cancel_order' }]
            ]
        }
    });
}

async function showQRCode(bot, chatId, orderId) {
    const qrMessage = `📱 **Scan QR Code to Pay**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **Amount:** ₹${userState[chatId]?.totalPrice || 'N/A'}
🆔 **Order ID:** \`${orderId}\`

Scan this QR code with any UPI app:`;

    await bot.sendPhoto(chatId, process.env.PAYMENT_QR_URL, {
        caption: qrMessage,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ I have paid', callback_data: `upload_ss_${orderId}` }],
                [{ text: '❌ Cancel', callback_data: 'cancel_order' }]
            ]
        }
    });
}

async function myOrders(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const orders = await getUserOrders(userId);
    
    if (orders.length === 0) {
        return bot.sendMessage(chatId, '📦 You don\'t have any orders yet.', {
            reply_markup: keyboards.backButton
        });
    }
    
    let message = '📦 **Your Orders**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    orders.slice(0, 10).forEach(order => {
        const statusEmoji = order.status === 'delivered' ? '✅' : 
                           order.status === 'pending_approval' ? '⏳' :
                           order.status === 'rejected' ? '❌' : '🔄';
        
        message += `🧾 \`${order.order_id}\`\n`;
        message += `🎟️ Category: ${order.category} | Qty: ${order.quantity}\n`;
        message += `💰 ₹${order.total_price} | ${statusEmoji} ${order.status}\n`;
        message += `📅 ${new Date(order.order_date).toLocaleDateString()}\n\n`;
    });
    
    message += 'Click on any order to view details';
    
    const keyboard = {
        inline_keyboard: orders.slice(0, 5).map(order => [
            { text: `📦 ${order.order_id}`, callback_data: `view_order_${order.order_id}` }
        ]).concat([[{ text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }]])
    };
    
    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function viewOrder(bot, chatId, orderId) {
    const order = await getOrder(orderId);
    
    if (!order) return;
    
    let message = `📦 **Order Details**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${order.order_id}\`
**Date:** ${new Date(order.order_date).toLocaleString()}
**Category:** ${order.category}
**Quantity:** ${order.quantity}
**Total:** ₹${order.total_price}
**Status:** ${order.status === 'delivered' ? '✅ Delivered' : 
             order.status === 'pending_approval' ? '⏳ Pending Approval' :
             order.status === 'rejected' ? '❌ Rejected' : '🔄 Processing'}`;
    
    if (order.status === 'delivered') {
        const vouchers = await getAvailableVouchers(order.category);
        message += `\n\n**Vouchers:**\n${vouchers.slice(0, order.quantity).map((v, i) => `${i+1}. \`${v.code}\``).join('\n')}`;
    }
    
    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 Back to Orders', callback_data: 'back_to_orders' }]
            ]
        }
    });
}

async function recoverVouchers(bot, msg) {
    const chatId = msg.chat.id;
    
    const message = `🔁 **Recover Vouchers**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Send your Order ID to recover lost vouchers.

📝 **Format:** \`SVH-20260218-ABC123\`

⏰ **Note:** Recovery available within 2 hours of purchase
✅ Only orders with 'delivered' status can be recovered`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.backButton
    });
    
    userState[msg.from.id] = { action: 'recovery' };
}

async function support(bot, msg) {
    const chatId = msg.chat.id;
    
    const message = `🆘 **Support Center**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For any issues, please contact our support:

📢 **Main Channel:** @SheinVoucherHub
📢 **Order Updates:** @OrdersNotify
🤖 **Payment Bot:** @SheinPaymentVerifyBot

⏰ **Support Hours:** 24/7
📧 **Email:** support@sheinvoucherhub.com

**Common Issues:**
• ❓ Payment not verified - Contact @SheinPaymentVerifyBot
• ❓ Voucher not working - Send recovery request
• ❓ Order status - Check "My Orders"
• ❓ Refund - Contact admin directly

Click the button below to contact admin directly:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📨 Message Admin', url: 'https://t.me/SheinVoucherHub' }],
                [{ text: '🤖 Payment Bot', url: 'https://t.me/SheinPaymentVerifyBot' }]
            ],
            keyboard: [['🔙 Back to Main Menu']],
            resize_keyboard: true
        }
    });
}

async function disclaimer(bot, msg) {
    const chatId = msg.chat.id;
    
    const message = `📜 **Disclaimer & Terms**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. Voucher Usage**
• All vouchers are 100% OFF up to the voucher amount
• No minimum order amount required
• Valid on Shein website and app
• One voucher per order

**2. Refund Policy**
• No refunds after voucher delivery
• Refund only if vouchers are out of stock
• Replacement within 2 hours of delivery
• Contact support within 1-2 hours for issues

**3. Payment Terms**
• Manual payment only via UPI/QR
• Screenshot required for verification
• Fake payments result in permanent ban
• Payment verification within 24 hours

**4. Account Terms**
• One account per user
• No multiple accounts
• Suspicious activity leads to ban
• We reserve right to refuse service

**5. Liability**
• Not responsible for Shein policy changes
• Not responsible for voucher misuse
• Maximum liability = voucher value

By using this bot, you agree to all terms above.`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboards.backButton
    });
}

module.exports = {
    buyVouchers,
    selectCategory,
    selectQuantity,
    showQRCode,
    myOrders,
    viewOrder,
    recoverVouchers,
    support,
    disclaimer,
    userState
};
