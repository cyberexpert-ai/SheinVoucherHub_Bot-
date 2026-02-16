const { 
    createOrder, 
    updateOrderPayment, 
    getOrder,
    updateOrderStatus,
    getAvailableVouchers,
    assignVoucherToOrder,
    getUser,
    addNotification,
    getCategories
} = require('../sheets/googleSheets');

// Store payment states
let paymentState = {};

// Initialize payment
async function initiatePayment(bot, chatId, userId, categoryId, quantity, totalPrice, categoryName) {
    try {
        // Create order in database
        const orderId = await createOrder(
            userId,
            categoryId,
            quantity,
            totalPrice,
            'pending'
        );
        
        // Store in state
        paymentState[userId] = {
            orderId,
            categoryId,
            quantity,
            totalPrice,
            categoryName,
            chatId,
            status: 'pending'
        };
        
        // Create web app URL
        const webAppUrl = `${process.env.WEBAPP_URL}/pay?orderId=${orderId}&amount=${totalPrice}&userId=${userId}`;
        
        // Send payment options
        await bot.sendMessage(chatId, 
            `💳 **Payment Options**
━━━━━━━━━━━━━━━━━━━━━

📦 **Order ID:** \`${orderId}\`
📂 **Category:** ${categoryName}
🔢 **Quantity:** ${quantity}
💰 **Total Amount:** ₹${totalPrice}

Choose payment method:`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🤖 Auto Payment (Instant)', web_app: { url: webAppUrl } }],
                        [{ text: '💳 Manual Payment', callback_data: `manual_pay_${orderId}` }],
                        [{ text: '❌ Cancel', callback_data: 'cancel_payment' }]
                    ]
                }
            }
        );
        
        return orderId;
    } catch (error) {
        console.error('Initiate payment error:', error);
        await bot.sendMessage(chatId, '❌ Payment initiation failed. Please try again.');
        return null;
    }
}

// Handle manual payment selection
async function handleManualPayment(bot, chatId, userId, orderId) {
    const order = await getOrder(orderId);
    
    if (!order) {
        return bot.sendMessage(chatId, '❌ Order not found!');
    }
    
    paymentState[userId] = {
        ...paymentState[userId],
        orderId,
        method: 'manual',
        categoryId: order.category,
        quantity: order.quantity,
        totalPrice: order.total_price
    };
    
    const bankDetails = `🏦 **Manual Payment Instructions**
━━━━━━━━━━━━━━━━━━━━━

**Bank Details:**
• **Bank:** HDFC Bank
• **Account Name:** Shein Voucher Hub
• **Account Number:** 50100234567890
• **IFSC Code:** HDFC0001234
• **UPI ID:** sheinvoucher@hdfcbank

**Order Details:**
• **Order ID:** \`${orderId}\`
• **Amount:** ₹${order.total_price}

**Steps to pay:**
1️⃣ Send payment to above account
2️⃣ Take screenshot of payment
3️⃣ Click "Send Screenshot" button
4️⃣ Upload screenshot and enter UTR

⚠️ **Note:** Fake payments = Permanent ban!`;

    await bot.sendMessage(chatId, bankDetails, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                ['📸 Send Screenshot'],
                ['❌ Cancel Payment']
            ],
            resize_keyboard: true
        }
    });
}

// Handle manual payment submission
async function submitManualPayment(orderId, userId, utr, screenshotData) {
    try {
        // Update order with payment details
        await updateOrderPayment(orderId, utr, screenshotData);
        await updateOrderStatus(orderId, 'pending_approval');
        
        // Get order details
        const order = await getOrder(orderId);
        const user = await getUser(userId);
        
        // Notify admin
        const adminMessage = 
            `🆕 **Manual Payment Received**
━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`
**User:** ${user?.first_name || 'N/A'} (@${user?.username || 'N/A'})
**User ID:** \`${userId}\`
**Amount:** ₹${order?.total_price || 'N/A'}
**UTR:** \`${utr}\`

**Action Required:** Verify payment`;

        await bot.sendMessage(process.env.ADMIN_ID, adminMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Approve Payment', callback_data: `approve_${orderId}` },
                        { text: '❌ Reject Payment', callback_data: `reject_${orderId}` }
                    ]
                ]
            }
        });
        
        // Send screenshot to admin
        await bot.sendPhoto(process.env.ADMIN_ID, Buffer.from(screenshotData.split(',')[1], 'base64'), {
            caption: `📸 Payment Screenshot for Order ${orderId}`
        });
        
        return {
            success: true,
            message: 'Payment proof submitted successfully! Admin will verify soon.'
        };
    } catch (error) {
        console.error('Submit manual payment error:', error);
        return {
            success: false,
            error: 'Failed to submit payment proof'
        };
    }
}

// Auto deliver vouchers for Razorpay payments
async function autoDeliverVouchers(orderId, paymentMethod, paymentId) {
    try {
        // Get order details
        const order = await getOrder(orderId);
        
        if (!order) {
            return { success: false, error: 'Order not found' };
        }
        
        // Get available vouchers
        const vouchers = await getAvailableVouchers(order.category);
        
        if (vouchers.length < parseInt(order.quantity)) {
            // Insufficient stock - notify admin
            await bot.sendMessage(process.env.ADMIN_ID, 
                `⚠️ **Auto-delivery Failed - Insufficient Stock**
━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`
**Category:** ${order.category}
**Required:** ${order.quantity}
**Available:** ${vouchers.length}

Please add more vouchers!`,
                { parse_mode: 'Markdown' }
            );
            
            // Update order status
            await updateOrderStatus(orderId, 'payment_received');
            
            return { 
                success: false, 
                error: 'Insufficient stock. Admin will deliver manually.' 
            };
        }
        
        // Assign vouchers
        const assignedVouchers = [];
        for (let i = 0; i < parseInt(order.quantity); i++) {
            const voucher = vouchers[i];
            await assignVoucherToOrder(voucher.voucher_id, order.user_id, orderId);
            assignedVouchers.push(voucher.code);
        }
        
        // Update order status
        await updateOrderStatus(orderId, 'delivered', new Date().toISOString());
        
        // Update payment details
        await updateOrderPayment(orderId, paymentId, 'razorpay_auto');
        
        // Send vouchers to user
        const voucherMessage = 
            `✅ **Payment Successful! Vouchers Delivered Instantly!**
━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`
**Payment ID:** \`${paymentId}\`
**Category:** ${order.category}
**Quantity:** ${order.quantity}

**Your Vouchers:**
${assignedVouchers.map((v, i) => `${i+1}. \`${v}\``).join('\n')}

Thank you for shopping with us! 🎉`;

        await bot.sendMessage(parseInt(order.user_id), voucherMessage, {
            parse_mode: 'Markdown'
        });
        
        // Send notification to channel
        const user = await getUser(order.user_id);
        await bot.sendMessage(process.env.CHANNEL_2,
            `🎯 **New Order (Auto Delivered)**
━━━━━━━━━━━━━━━━━━━━━

╰➤👤 **User:** @${user?.username || 'N/A'}
╰➤🆔 **User ID:** \`${order.user_id}\`
╰➤📡 **Status:** ✅ Success (Auto)
╰➤📦 **Quantity:** ${order.quantity}
╰➤💳 **Amount:** ₹${order.total_price}
╰➤💳 **Payment:** Razorpay

🤖 **Bot:** @SheinVoucherHub_Bot
━━━━━━━━━━━━━━━━━━━━━`,
            { parse_mode: 'Markdown' }
        );
        
        return {
            success: true,
            vouchers: assignedVouchers
        };
    } catch (error) {
        console.error('Auto deliver error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Approve manual payment
async function approvePayment(bot, chatId, orderId) {
    try {
        const order = await getOrder(orderId);
        
        if (!order) {
            return bot.sendMessage(chatId, '❌ Order not found!');
        }
        
        // Get available vouchers
        const vouchers = await getAvailableVouchers(order.category);
        
        if (vouchers.length < parseInt(order.quantity)) {
            return bot.sendMessage(chatId, 
                `❌ **Insufficient Stock!**
Available: ${vouchers.length}
Required: ${order.quantity}

Please add more vouchers first.`,
                { parse_mode: 'Markdown' }
            );
        }
        
        // Assign vouchers
        const assignedVouchers = [];
        for (let i = 0; i < parseInt(order.quantity); i++) {
            const voucher = vouchers[i];
            await assignVoucherToOrder(voucher.voucher_id, order.user_id, orderId);
            assignedVouchers.push(voucher.code);
        }
        
        // Update order status
        await updateOrderStatus(orderId, 'delivered', new Date().toISOString());
        
        // Send vouchers to user
        const voucherMessage = 
            `✅ **Payment Approved! Vouchers Delivered**
━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`
**Category:** ${order.category}
**Quantity:** ${order.quantity}

**Your Vouchers:**
${assignedVouchers.map((v, i) => `${i+1}. \`${v}\``).join('\n')}

Thank you for shopping with us! 🎉`;

        await bot.sendMessage(parseInt(order.user_id), voucherMessage, {
            parse_mode: 'Markdown'
        });
        
        // Send notification to channel
        const user = await getUser(order.user_id);
        await bot.sendMessage(process.env.CHANNEL_2,
            `🎯 **New Order (Manual Approved)**
━━━━━━━━━━━━━━━━━━━━━

╰➤👤 **User:** @${user?.username || 'N/A'}
╰➤🆔 **User ID:** \`${order.user_id}\`
╰➤📡 **Status:** ✅ Success (Manual)
╰➤📦 **Quantity:** ${order.quantity}
╰➤💳 **Amount:** ₹${order.total_price}

🤖 **Bot:** @SheinVoucherHub_Bot
━━━━━━━━━━━━━━━━━━━━━`,
            { parse_mode: 'Markdown' }
        );
        
        await bot.sendMessage(chatId, 
            `✅ **Payment Approved!**
━━━━━━━━━━━━━━━━━━━━━

Order ID: \`${orderId}\`
Vouchers sent to user: ${assignedVouchers.length} codes`,
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error('Approve payment error:', error);
        await bot.sendMessage(chatId, '❌ Failed to approve payment: ' + error.message);
    }
}

// Reject manual payment
async function rejectPayment(bot, chatId, orderId, reason = 'Invalid payment proof') {
    try {
        const order = await getOrder(orderId);
        
        if (!order) {
            return bot.sendMessage(chatId, '❌ Order not found!');
        }
        
        // Update order status
        await updateOrderStatus(orderId, 'rejected');
        
        // Notify user
        const rejectMessage = 
            `❌ **Payment Rejected**
━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`

Your payment could not be verified.
**Reason:** ${reason}

Please contact support @SheinVoucherHub if you think this is a mistake.`;

        await bot.sendMessage(parseInt(order.user_id), rejectMessage, {
            parse_mode: 'Markdown'
        });
        
        await bot.sendMessage(chatId, 
            `✅ **Payment Rejected**
━━━━━━━━━━━━━━━━━━━━━

Order ID: \`${orderId}\`
User notified about rejection.
Reason: ${reason}`,
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error('Reject payment error:', error);
        await bot.sendMessage(chatId, '❌ Failed to reject payment: ' + error.message);
    }
}

// Handle screenshot upload from user
async function handleScreenshotUpload(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (msg.photo) {
        // Get the largest photo
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        
        // Get file URL
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
        
        // Download file
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const screenshotBase64 = Buffer.from(response.data).toString('base64');
        const screenshotData = `data:image/jpeg;base64,${screenshotBase64}`;
        
        // Store in state
        paymentState[userId] = paymentState[userId] || {};
        paymentState[userId].screenshot = screenshotData;
        
        await bot.sendMessage(chatId, '📝 Now please enter your UTR/Transaction ID:', {
            reply_markup: {
                force_reply: true
            }
        });
    } else if (msg.text && paymentState[userId]?.screenshot) {
        const utr = msg.text;
        const state = paymentState[userId];
        
        // Validate UTR
        if (!/^[A-Za-z0-9]{6,30}$/.test(utr)) {
            return bot.sendMessage(chatId, '❌ Invalid UTR format. Please enter a valid UTR:');
        }
        
        // Submit payment
        const result = await submitManualPayment(
            state.orderId,
            userId,
            utr,
            state.screenshot
        );
        
        if (result.success) {
            await bot.sendMessage(chatId, result.message, {
                reply_markup: {
                    keyboard: [['↩️ Back to Menu']],
                    resize_keyboard: true
                }
            });
        } else {
            await bot.sendMessage(chatId, '❌ ' + result.error);
        }
        
        // Clear state
        delete paymentState[userId];
    }
}

module.exports = {
    initiatePayment,
    handleManualPayment,
    submitManualPayment,
    autoDeliverVouchers,
    approvePayment,
    rejectPayment,
    handleScreenshotUpload,
    paymentState
};
