const db = require('../database/database');
const { deletePreviousMessage } = require('../utils/helpers');
const axios = require('axios');

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
    
    // Create keyboard with all categories
    const keyboard = {
        inline_keyboard: categories.map(cat => {
            const availableVouchers = db.getAvailableVouchersCount(cat.id);
            return [{
                text: `${cat.name} (Stock: ${availableVouchers})`,
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
    const availableVouchers = db.getAvailableVouchersCount(categoryId);
    
    if (!cat || availableVouchers <= 0) {
        return bot.sendMessage(chatId, '❌ This category is out of stock!');
    }
    
    const prices = cat.prices;
    
    // Store category in user state
    userState[userId] = {
        categoryId: cat.id,
        categoryName: cat.name,
        availableVouchers: availableVouchers,
        prices: prices,
        step: 'selecting_quantity'
    };
    
    // Create price display
    let priceText = `**${cat.name}**\n`;
    priceText += `Available stock: ${availableVouchers} codes\n\n`;
    priceText += `**Available Packages (per-code):**\n`;
    
    const quantities = Object.keys(prices).map(Number).sort((a, b) => a - b);
    quantities.forEach(qty => {
        priceText += `- ${qty} Code${qty > 1 ? 's' : ''} → ₹${prices[qty]}.00 / code\n`;
    });
    
    priceText += `\n**Select quantity:**`;
    
    const qtyButtons = quantities.map(qty => {
        return [{ text: `${qty} code${qty > 1 ? 's' : ''}`, callback_data: `qty_${qty}` }];
    });
    
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
        return bot.sendMessage(chatId, '📝 **Enter quantity** (max available):\n\nExample: `7`', {
            parse_mode: 'Markdown',
            reply_markup: { force_reply: true }
        });
    }
    
    const state = userState[userId];
    const qty = parseInt(quantity);
    
    if (qty > state.availableVouchers) {
        return bot.sendMessage(chatId, `❌ Only ${state.availableVouchers} codes available!`);
    }
    
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

async function handleCustomQuantity(bot, chatId, userId, text) {
    const state = userState[userId];
    const qty = parseInt(text);
    
    if (isNaN(qty) || qty < 1) {
        await bot.sendMessage(chatId, '❌ Please enter a valid positive number!', {
            reply_markup: { force_reply: true }
        });
        return;
    }
    
    if (qty > state.availableVouchers) {
        await bot.sendMessage(chatId, `❌ Only ${state.availableVouchers} codes available!`, {
            reply_markup: { force_reply: true }
        });
        return;
    }
    
    const pricePerCode = db.getPriceForQuantity(state.categoryId, qty);
    const total = pricePerCode * qty;
    
    const confirmMsg = `📊 **Price Calculation**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nCategory: ${state.categoryName}\nQuantity: ${qty} codes\nPrice per code: ₹${pricePerCode}\nTotal Amount: ₹${total}\n\nDo you want to proceed?`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '✅ Yes, Proceed', callback_data: `confirm_qty_${qty}` },
                { text: '❌ No, Cancel', callback_data: 'back_to_categories' }
            ]
        ]
    };
    
    userState[userId].tempQty = qty;
    userState[userId].tempTotal = total;
    userState[userId].tempPricePerCode = pricePerCode;
    userState[userId].step = 'confirming_qty';
    
    await bot.sendMessage(chatId, confirmMsg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function confirmQuantity(bot, chatId, userId, qty) {
    await deletePreviousMessage(bot, chatId, userId);
    
    const state = userState[userId];
    
    const orderId = db.createOrder(userId, state.categoryId, qty, state.tempTotal);
    
    userState[userId] = {
        ...state,
        orderId,
        quantity: qty,
        total: state.tempTotal,
        pricePerCode: state.tempPricePerCode,
        step: 'payment'
    };
    
    await sendPaymentInstructions(bot, chatId, userId, state.categoryName, qty, state.tempTotal, state.tempPricePerCode, orderId);
}

async function sendPaymentInstructions(bot, chatId, userId, category, quantity, total, pricePerCode, orderId) {
    const paymentQR = db.getPaymentQR();
    
    const message = `💳 **Payment Instructions**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 **Order Summary**\n• Order ID: \`${orderId}\`\n• Category: ${category}\n• Quantity: ${quantity}\n• Price per code: ₹${pricePerCode}\n• Total: ₹${total}\n\n📱 **Payment Steps:**\n1️⃣ Scan QR code below\n2️⃣ Pay exact amount: ₹${total}\n3️⃣ Take screenshot\n4️⃣ Click "I have paid" button below\n5️⃣ Upload screenshot and UTR\n\n⚠️ **Fake payments = Permanent ban!**`;

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

// ==================== UTR HANDLING - SUCCESS MESSAGE সহ ====================
async function handleScreenshot(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    console.log('handleScreenshot called with step:', userState[userId]?.step);
    
    // যদি ফটো আসে
    if (msg.photo) {
        console.log('Photo received');
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        
        userState[userId] = {
            ...userState[userId],
            screenshot: fileId,
            step: 'awaiting_utr'
        };
        
        await bot.sendMessage(chatId, '📝 **Enter UTR/Transaction ID**\n\nExample: `UTR123456789`', {
            parse_mode: 'Markdown',
            reply_markup: { force_reply: true }
        });
        return;
    }
    
    // যদি UTR এর জন্য অপেক্ষা করছে
    if (userState[userId]?.step === 'awaiting_utr') {
        console.log('Awaiting UTR, received text:', text);
        const state = userState[userId];
        
        // যদি ইউজার /start দেয়
        if (text === '/start') {
            console.log('User sent /start, clearing state');
            delete userState[userId];
            const { startCommand } = require('./start');
            return startCommand(bot, msg);
        }
        
        // যদি ইউজার ব্যাক বলে
        if (text === '← Back' || text === '← Back to Menu' || text === 'Back' || text === 'back') {
            console.log('User sent back command, clearing state');
            delete userState[userId];
            const { startCommand } = require('./start');
            return startCommand(bot, msg);
        }
        
        // UTR ভ্যালিডেশন
        const utr = text.trim().toUpperCase();
        console.log('Validating UTR:', utr);
        
        // UTR ফরম্যাট চেক
        if (!/^[A-Z0-9]{6,30}$/.test(utr)) {
            console.log('Invalid UTR format');
            return bot.sendMessage(chatId, 
                '❌ **Invalid UTR Format!**\n\n' +
                'UTR should be 6-30 characters long and contain only letters and numbers.\n\n' +
                'Example: `UTR123456789`\n\n' +
                'Please try again:',
                { 
                    parse_mode: 'Markdown',
                    reply_markup: { force_reply: true }
                }
            );
        }
        
        // চেক করে UTR আগে ব্যবহার করা হয়েছে কিনা
        if (db.isUTRUsed(utr)) {
            console.log('UTR already used');
            db.addWarning(userId, 'Duplicate UTR');
            return bot.sendMessage(chatId, 
                '❌ **This UTR has already been used!**\n\n' +
                'Fake payment detected.\n\n' +
                'Please try again with correct UTR:',
                { 
                    parse_mode: 'Markdown',
                    reply_markup: { force_reply: true }
                }
            );
        }
        
        console.log('UTR is valid, processing payment');
        
        // UTR মার্ক as used
        db.addUsedUTR(utr);
        
        // Update order with payment
        const paymentUpdated = db.updateOrderPayment(state.orderId, utr, state.screenshot);
        console.log('Payment updated:', paymentUpdated);
        
        // Add warning for suspicious UTR
        if (utr.includes('FAKE') || utr.includes('TEST') || utr.includes('DEMO') || utr.includes('123456')) {
            db.addWarning(userId, 'Suspicious UTR');
        }
        
        // ✅ SUCCESS MESSAGE - ইউজারকে জানিয়ে দাও যে পেমেন্ট সাবমিট হয়েছে
        const successMessage = `✅ **Payment Proof Submitted Successfully!**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                              `📋 **Order Details**\n` +
                              `• Order ID: \`${state.orderId}\`\n` +
                              `• UTR Number: \`${utr}\`\n` +
                              `• Category: ${state.categoryName}\n` +
                              `• Quantity: ${state.quantity} codes\n` +
                              `• Total Amount: ₹${state.total}\n\n` +
                              `📌 **Next Steps:**\n` +
                              `1️⃣ Admin will verify your payment\n` +
                              `2️⃣ You'll receive vouchers within 24 hours\n` +
                              `3️⃣ Check status in "My Orders"\n\n` +
                              `Thank you for your patience! 🙏`;
        
        await bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
        
        // Notify admin
        await notifyAdmin(bot, state.orderId, userId, utr, state.screenshot);
        
        // Clear user state
        delete userState[userId];
        
        // Return to main menu after submission
        setTimeout(async () => {
            const { startCommand } = require('./start');
            await startCommand(bot, { chat: { id: chatId }, from: { id: userId } });
        }, 5000);
        
        return;
    }
    
    // যদি অন্য কোন স্টেটে থাকে
    if (userState[userId]) {
        console.log('User state:', userState[userId].step);
        
        // Handle quantity input
        if (userState[userId].step === 'awaiting_qty') {
            console.log('Handling custom quantity');
            return handleCustomQuantity(bot, chatId, userId, text);
        }
        
        // Handle recovery input
        if (userState[userId].step === 'awaiting_recovery') {
            console.log('Handling recovery');
            const orderId = text.trim();
            
            if (orderId === '← Back to Menu' || orderId === '← Back' || orderId === 'Back') {
                delete userState[userId];
                const { startCommand } = require('./start');
                return startCommand(bot, msg);
            }
            
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
                
                await bot.sendMessage(chatId, errorMsg, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        keyboard: [['← Back to Menu']],
                        resize_keyboard: true
                    }
                });
                
                delete userState[userId];
                return;
            }
            
            const order = recovery.order;
            const user = db.getUser(userId);
            
            const adminMsg = `🔄 **Recovery Request**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Order ID:** \`${orderId}\`\n**User:** ${user?.firstName || 'N/A'} (@${user?.username || 'N/A'})\n**User ID:** \`${userId}\`\n**Category:** ${order.categoryName}\n**Quantity:** ${order.quantity}\n**Amount:** ₹${order.totalPrice}\n**Original Delivery:** ${new Date(order.deliveredAt || order.createdAt).toLocaleString()}\n\n**Action Required:** Process recovery`;

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
            return;
        }
    }
}

async function notifyAdmin(bot, orderId, userId, utr, screenshot) {
    const order = db.getOrder(orderId);
    const user = db.getUser(userId);
    
    const message = `🆕 **New Payment Received**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                   `**Order ID:** \`${orderId}\`\n` +
                   `**User:** ${user?.firstName || 'N/A'} (@${user?.username || 'N/A'})\n` +
                   `**User ID:** \`${userId}\`\n` +
                   `**Category:** ${order?.categoryName || 'N/A'}\n` +
                   `**Quantity:** ${order?.quantity || 0}\n` +
                   `**Price/Code:** ₹${order?.pricePerCode || 0}\n` +
                   `**Total:** ₹${order?.totalPrice || 0}\n` +
                   `**UTR:** \`${utr}\`\n\n` +
                   `**Action Required:** Verify payment`;

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
        try {
            await bot.sendPhoto(process.env.ADMIN_ID, screenshot, {
                caption: `📸 Screenshot for Order ${orderId}`
            });
        } catch (error) {
            console.error('Error sending screenshot to admin:', error);
        }
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
                keyboard: [['← Back to Menu']],
                resize_keyboard: true
            }
        });
    }
    
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
        ]).concat([[{ text: '← Back to Menu', callback_data: 'back_to_main' }]])
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
    
    let text = `📦 **Order Details**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
               `**Order ID:** \`${order.id}\`\n` +
               `**Date:** ${new Date(order.createdAt).toLocaleString()}\n` +
               `**Category:** ${order.categoryName}\n` +
               `**Quantity:** ${order.quantity}\n` +
               `**Price per code:** ₹${order.pricePerCode || 'N/A'}\n` +
               `**Total:** ₹${order.totalPrice}\n` +
               `**Status:** `;
    
    if (order.status === 'delivered') {
        text += '✅ Delivered';
        
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
    
    const message = `🔁 **Recover Vouchers**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nSend your Order ID\nExample: \`SVH-20260219-ABC123\`\n\n⚠️ Recovery available within 2 hours of delivery\n✅ Only orders delivered to YOU can be recovered`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['← Back to Menu']],
            resize_keyboard: true
        }
    });
    
    userState[msg.from.id] = { step: 'awaiting_recovery' };
}

// ==================== SUPPORT ====================
async function support(bot, msg) {
    const chatId = msg.chat.id;
    
    await deletePreviousMessage(bot, chatId);
    
    const message = `🆘 **Support**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nFor any issues, please contact our support robot:\n\n👉 **${process.env.SUPPORT_BOT}**\n\nThey will assist you within 24 hours.\n\nThank you for using Shein Voucher Hub!`;

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
    
    const message = `📜 **Disclaimer**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n• All coupons given are 100% OFF upto voucher amount with NO minimum order amount required.\n• Contact Support if you're facing any issue with vouchers.\n• Only replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.\n• No returns.\n• Refund will be only given if vouchers are out of stock.\n• Fake payment attempts will result in permanent ban.`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['← Back to Menu']],
            resize_keyboard: true
        }
    });
}

// ==================== USER CALLBACK HANDLER ====================
async function handleUserCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    await bot.deleteMessage(chatId, messageId).catch(() => {});
    
    if (data.startsWith('select_cat_')) {
        const id = data.split('_')[2];
        return selectCategory(bot, chatId, userId, id);
    }
    
    if (data.startsWith('qty_')) {
        const qty = data.split('_')[1];
        return selectQuantity(bot, chatId, userId, qty);
    }
    
    if (data.startsWith('confirm_qty_')) {
        const qty = parseInt(data.replace('confirm_qty_', ''));
        return confirmQuantity(bot, chatId, userId, qty);
    }
    
    if (data.startsWith('upload_ss_')) {
        const orderId = data.replace('upload_ss_', '');
        return uploadScreenshot(bot, chatId, userId, orderId);
    }
    
    if (data.startsWith('view_order_')) {
        const orderId = data.replace('view_order_', '');
        return viewOrder(bot, chatId, orderId);
    }
    
    if (data === 'qty_custom') {
        userState[userId].step = 'awaiting_qty';
        return bot.sendMessage(chatId, '📝 **Enter quantity** (max available):\n\nExample: `7`', {
            parse_mode: 'Markdown',
            reply_markup: { force_reply: true }
        });
    }
    
    if (data === 'back_to_categories') {
        const { buyVouchers } = require('./user');
        return buyVouchers(bot, { chat: { id: chatId }, from: { id: userId } });
    }
    
    if (data === 'back_to_orders') {
        return myOrders(bot, { chat: { id: chatId }, from: { id: userId } });
    }
    
    if (data === 'back_to_main') {
        const { startCommand } = require('./start');
        return startCommand(bot, { chat: { id: chatId }, from: { id: userId } });
    }
}

// ==================== EXPORT ====================
module.exports = {
    buyVouchers,
    selectCategory,
    selectQuantity,
    uploadScreenshot,
    handleScreenshot,
    handleUserCallback,
    myOrders,
    viewOrder,
    recoverVouchers,
    support,
    disclaimer,
    userState
};
