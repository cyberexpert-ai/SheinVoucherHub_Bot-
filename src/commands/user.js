const db = require('../database/database');
const { deletePreviousMessage } = require('../utils/helpers');

let userState = {};

// ==================== BUY VOUCHERS ====================
async function buyVouchers(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    await deletePreviousMessage(bot, chatId, userId);
    
    const categories = db.getCategories();
    
    if (categories.length === 0) {
        return bot.sendMessage(chatId, '❌ No categories available at the moment.');
    }
    
    // Create keyboard exactly like the image
    const keyboard = {
        inline_keyboard: categories.map(cat => {
            return [{
                text: `${cat.name} (Stock: ${cat.stock})`,
                callback_data: `select_cat_${cat.id}`
            }];
        }).concat([[{ text: '← Back', callback_data: 'back_to_main' }]])
    };
    
    await bot.sendMessage(chatId, '**Choose Voucher Type From Below**', {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function selectCategory(bot, chatId, userId, categoryId) {
    await deletePreviousMessage(bot, chatId, userId);
    
    const cat = db.getCategory(categoryId);
    
    if (!cat || cat.stock <= 0) {
        return bot.sendMessage(chatId, '❌ This category is out of stock!');
    }
    
    const prices = cat.prices;
    
    // Store category in user state
    userState[userId] = {
        categoryId: cat.id,
        categoryName: cat.name,
        stock: cat.stock,
        prices: prices,
        step: 'selecting_quantity'
    };
    
    // Create price display
    let priceText = `**${cat.name}**\n`;
    priceText += `Available stock: ${cat.stock} codes\n\n`;
    priceText += `**Available Packages (per-code):**\n`;
    
    // Sort quantities
    const quantities = Object.keys(prices).map(Number).sort((a, b) => a - b);
    
    quantities.forEach(q => {
        priceText += `- ${q} Code${q > 1 ? 's' : ''} → ₹${prices[q]}.00 / code\n`;
    });
    
    priceText += `\n**Select quantity:**`;
    
    // Create quantity buttons
    const qtyButtons = [];
    quantities.forEach(q => {
        qtyButtons.push([{
            text: `${q} code${q > 1 ? 's' : ''}`,
            callback_data: `qty_${q}`
        }]);
    });
    
    // Add Other amount and Back buttons
    qtyButtons.push([{ text: 'Other amount', callback_data: 'qty_custom' }]);
    qtyButtons.push([{ text: 'Back', callback_data: 'back_to_categories' }]);
    
    const keyboard = {
        inline_keyboard: qtyButtons
    };
    
    await bot.sendMessage(chatId, priceText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function selectQuantity(bot, chatId, userId, quantity) {
    await deletePreviousMessage(bot, chatId, userId);
    
    if (quantity === 'custom') {
        userState[userId].step = 'awaiting_qty';
        return bot.sendMessage(chatId, '📝 **Enter quantity** (max available):', {
            reply_markup: { force_reply: true }
        });
    }
    
    const state = userState[userId];
    const qty = parseInt(quantity);
    
    if (qty > state.stock) {
        return bot.sendMessage(chatId, `❌ Only ${state.stock} codes available!`);
    }
    
    // Calculate total price
    const pricePerCode = db.getPriceForQuantity(state.categoryId, qty);
    const total = pricePerCode * qty;
    
    const orderId = db.createOrder(userId, state.categoryId, qty, total);
    
    userState[userId] = {
        ...state,
        orderId,
        quantity: qty,
        total,
        pricePerCode,
        step: 'payment'
    };
    
    await sendPaymentInstructions(bot, chatId, userId, state.categoryName, qty, total, pricePerCode, orderId);
}

async function sendPaymentInstructions(bot, chatId, userId, category, quantity, total, pricePerCode, orderId) {
    const paymentQR = db.getPaymentQR();
    
    const message = `💳 **Payment Instructions**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **Order Summary**
• Order ID: \`${orderId}\`
• Category: ${category}
• Quantity: ${quantity}
• Price per code: ₹${pricePerCode}
• Total: ₹${total}

📱 **Payment Steps:**
1️⃣ Scan QR code below
2️⃣ Pay exact amount: ₹${total}
3️⃣ Take screenshot
4️⃣ Click "I have paid" button
5️⃣ Upload screenshot and UTR

⚠️ **Fake payments = Permanent ban!**`;

    await bot.sendPhoto(chatId, paymentQR, {
        caption: message,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ I have paid', callback_data: `upload_ss_${orderId}` }],
                [{ text: '❌ Cancel', callback_data: 'back_to_main' }]
            ]
        }
    });
}

async function uploadScreenshot(bot, chatId, userId, orderId) {
    userState[userId] = {
        ...userState[userId],
        step: 'awaiting_screenshot',
        orderId
    };
    
    await bot.sendMessage(chatId, '📸 **Please send the payment screenshot**', {
        parse_mode: 'Markdown',
        reply_markup: { force_reply: true }
    });
}

async function handleScreenshot(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        
        userState[userId] = {
            ...userState[userId],
            screenshot: fileId,
            step: 'awaiting_utr'
        };
        
        await bot.sendMessage(chatId, '📝 **Enter UTR/Transaction ID**', {
            parse_mode: 'Markdown',
            reply_markup: { force_reply: true }
        });
        
    } else if (msg.text && userState[userId]?.step === 'awaiting_utr') {
        const utr = msg.text.trim().toUpperCase();
        const state = userState[userId];
        
        // Validate UTR
        if (!/^[A-Z0-9]{6,30}$/.test(utr)) {
            return bot.sendMessage(chatId, '❌ Invalid UTR format! Please enter valid UTR.');
        }
        
        // Update order with payment
        db.updateOrderPayment(state.orderId, utr, state.screenshot);
        
        // Add warning for suspicious UTR
        if (utr.includes('FAKE') || utr.includes('TEST')) {
            db.addWarning(userId, 'Suspicious UTR');
        }
        
        await bot.sendMessage(chatId, 
            `✅ **Payment Proof Submitted!**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: \`${state.orderId}\`
UTR: \`${utr}\`

📌 **Next Steps:**
• Admin will verify your payment
• You'll receive vouchers within 24 hours
• Check status in "My Orders"

Thank you for your patience! 🙏`,
            { parse_mode: 'Markdown' }
        );
        
        // Notify admin
        await notifyAdmin(bot, state.orderId, userId, utr, state.screenshot);
        
        delete userState[userId];
    }
}

async function notifyAdmin(bot, orderId, userId, utr, screenshot) {
    const order = db.getOrder(orderId);
    const user = db.getUser(userId);
    
    const message = `🆕 **New Payment Received**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`
**User:** ${user?.firstName || 'N/A'} (@${user?.username || 'N/A'})
**User ID:** \`${userId}\`
**Category:** ${order?.categoryName || 'N/A'}
**Quantity:** ${order?.quantity || 0}
**Price/Code:** ₹${order?.pricePerCode || 0}
**Total:** ₹${order?.totalPrice || 0}
**UTR:** \`${utr}\`

**Action Required:** Verify payment`;

    await bot.sendMessage(process.env.ADMIN_ID, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Approve', callback_data: `approve_${orderId}` },
                    { text: '❌ Reject', callback_data: `reject_${orderId}` }
                ]
            ]
        }
    });
    
    // Forward screenshot
    if (screenshot) {
        await bot.sendPhoto(process.env.ADMIN_ID, screenshot, {
            caption: `📸 Screenshot for Order ${orderId}`
        });
    }
}

// ==================== MY ORDERS ====================
async function myOrders(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    await deletePreviousMessage(bot, chatId, userId);
    
    const orders = db.getUserOrders(userId);
    
    if (orders.length === 0) {
        return bot.sendMessage(chatId, '📦 **You don\'t have any orders yet.**', {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [['← Back']],
                resize_keyboard: true
            }
        });
    }
    
    // Sort orders by date (newest first)
    const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let text = '📦 **Your Orders**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    sortedOrders.forEach(order => {
        const statusEmoji = order.status === 'delivered' ? '✅' : 
                           order.status === 'pending_approval' ? '⏳' :
                           order.status === 'rejected' ? '❌' : '🔄';
        
        text += `🧾 \`${order.id}\`\n`;
        text += `🎟 ${order.categoryName} | Qty ${order.quantity}\n`;
        text += `💰 ₹${order.totalPrice} | ${statusEmoji} ${order.status}\n\n`;
    });
    
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nClick any order to view details`;
    
    const keyboard = {
        inline_keyboard: sortedOrders.slice(0, 5).map(order => [
            { text: `📦 ${order.id}`, callback_data: `view_order_${order.id}` }
        ]).concat([[{ text: '← Back', callback_data: 'back_to_main' }]])
    };
    
    await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function viewOrder(bot, chatId, orderId) {
    await deletePreviousMessage(bot, chatId);
    
    const order = db.getOrder(orderId);
    if (!order) return;
    
    let text = `📦 **Order Details**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${order.id}\`
**Date:** ${new Date(order.createdAt).toLocaleString()}
**Category:** ${order.categoryName}
**Quantity:** ${order.quantity}
**Price per code:** ₹${order.pricePerCode || 'N/A'}
**Total:** ₹${order.totalPrice}
**Status:** `;
    
    if (order.status === 'delivered') {
        text += '✅ Delivered';
        
        // Get vouchers for this order
        const vouchers = db.getVouchers(order.categoryId)
            .filter(v => v.orderId === orderId);
        
        if (vouchers.length > 0) {
            text += `\n\n**Your Vouchers:**\n`;
            vouchers.forEach((v, i) => {
                text += `${i+1}. \`${v.code}\`\n`;
            });
        }
    } else if (order.status === 'pending_approval') {
        text += '⏳ Pending Approval';
    } else if (order.status === 'rejected') {
        text += '❌ Rejected';
        if (order.adminNote) {
            text += `\n**Reason:** ${order.adminNote}`;
        }
    } else if (order.status === 'pending') {
        text += '🔄 Awaiting Payment';
    } else {
        text += '🔄 Processing';
    }
    
    await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '← Back to Orders', callback_data: 'back_to_orders' }]
            ]
        }
    });
}

// ==================== RECOVER VOUCHERS ====================
async function recoverVouchers(bot, msg) {
    const chatId = msg.chat.id;
    
    await deletePreviousMessage(bot, chatId);
    
    const message = `🔁 **Recover Vouchers**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Send your Order ID
Example: \`SVH-20260219-ABC123\`

⚠️ Recovery available within 2 hours of delivery
✅ Only orders delivered to YOU can be recovered`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['← Back to Menu']],
            resize_keyboard: true
        }
    });
    
    userState[msg.from.id] = { step: 'awaiting_recovery' };
}

async function handleRecovery(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const orderId = msg.text.trim();
    
    // Check if it's actually a back command
    if (orderId === '← Back to Menu') {
        delete userState[userId];
        const { startCommand } = require('./start');
        return startCommand(bot, msg);
    }
    
    // Show processing message
    await bot.sendMessage(chatId, `⏳ **Processing recovery request for Order** \`${orderId}\`...`, {
        parse_mode: 'Markdown'
    });
    
    const recovery = db.canRecover(orderId, userId);
    
    if (!recovery.can) {
        let errorMsg = '';
        if (recovery.reason === 'not_found') {
            errorMsg = `⚠️ **Order not found:** \`${orderId}\``;
        } else if (recovery.reason === 'wrong_user') {
            errorMsg = '❌ **This order belongs to another user!**';
        } else if (recovery.reason === 'not_delivered') {
            errorMsg = '❌ **This order is not delivered yet!**';
        } else if (recovery.reason === 'expired') {
            errorMsg = '⏰ **Recovery period expired** (2 hours limit)';
        }
        
        return bot.sendMessage(chatId, errorMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [['← Back to Menu']],
                resize_keyboard: true
            }
        });
    }
    
    // Notify admin
    const order = recovery.order;
    const user = db.getUser(userId);
    
    const adminMsg = `🔄 **Recovery Request**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`
**User:** ${user?.firstName || 'N/A'} (@${user?.username || 'N/A'})
**User ID:** \`${userId}\`
**Category:** ${order.categoryName}
**Quantity:** ${order.quantity}
**Amount:** ₹${order.totalPrice}
**Original Delivery:** ${new Date(order.deliveredAt || order.createdAt).toLocaleString()}

**Action Required:** Process recovery`;

    await bot.sendMessage(process.env.ADMIN_ID, adminMsg, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Send New Code', callback_data: `recover_${orderId}` },
                    { text: '❌ Cannot Recover', callback_data: `norecover_${orderId}` }
                ]
            ]
        }
    });
    
    await bot.sendMessage(chatId, '✅ **Recovery request sent to admin.** You will receive response soon.', {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['← Back to Menu']],
            resize_keyboard: true
        }
    });
    
    delete userState[userId];
}

// ==================== SUPPORT ====================
async function support(bot, msg) {
    const chatId = msg.chat.id;
    
    await deletePreviousMessage(bot, chatId);
    
    const message = `🆘 **Support**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For any issues, please contact our support robot:

👉 **${process.env.SUPPORT_BOT}**

They will assist you within 24 hours.

Thank you for using Shein Voucher Hub!`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📢 Contact Support', url: `https://t.me/${process.env.SUPPORT_BOT.replace('@', '')}` }]
            ],
            keyboard: [['← Back to Menu']],
            resize_keyboard: true
        }
    });
}

// ==================== DISCLAIMER ====================
async function disclaimer(bot, msg) {
    const chatId = msg.chat.id;
    
    await deletePreviousMessage(bot, chatId);
    
    const message = `📜 **Disclaimer**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• All coupons given are 100% OFF upto voucher amount with NO minimum order amount required.
• Contact Support if you're facing any issue with vouchers.
• Only replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.
• No returns.
• Refund will be only given if vouchers are out of stock.
• Fake payment attempts will result in permanent ban.`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['← Back to Menu']],
            resize_keyboard: true
        }
    });
}

// ==================== EXPORT ====================
module.exports = {
    buyVouchers,
    selectCategory,
    selectQuantity,
    uploadScreenshot,
    handleScreenshot,
    myOrders,
    viewOrder,
    recoverVouchers,
    handleRecovery,
    support,
    disclaimer,
    userState
};
