const { 
    getOrder,
    updateOrderStatus,
    getAvailableVouchers,
    assignVoucherToOrder,
    getUser,
    updateUserStats
} = require('../sheets/googleSheets');
const QRCode = require('qrcode');
const axios = require('axios');

let paymentState = {};

// ==================== INITIATE MANUAL PAYMENT ====================
async function initiateManualPayment(bot, chatId, userId, orderId, amount, category, quantity) {
    paymentState[userId] = {
        orderId,
        amount,
        category,
        quantity,
        status: 'pending'
    };
    
    const paymentMessage = `💳 **Manual Payment**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **Order Summary**
• Order ID: \`${orderId}\`
• Category: ${category}
• Quantity: ${quantity}
• Amount: ₹${amount}

📱 **Payment Steps:**
1️⃣ Scan QR code below
2️⃣ Pay exact amount: ₹${amount}
3️⃣ Take screenshot
4️⃣ Upload screenshot
5️⃣ Enter UTR number

⏰ **Time Limit:** 30 minutes

👇 **Click button to start**`;

    await bot.sendMessage(chatId, paymentMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📱 Show QR Code', callback_data: `show_qr_${orderId}` }],
                [{ text: '📸 Upload Screenshot', callback_data: `upload_ss_${orderId}` }],
                [{ text: '❌ Cancel', callback_data: 'cancel_payment' }]
            ]
        }
    });
}

// ==================== SHOW QR CODE ====================
async function showQRCode(bot, chatId, orderId, amount) {
    const qrData = `upi://pay?pa=sheinvoucher@hdfcbank&pn=SheinVoucher&am=${amount}&cu=INR`;
    
    try {
        const qrBuffer = await QRCode.toBuffer(qrData);
        
        const caption = `📱 **Scan QR Code**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **Amount:** ₹${amount}
🆔 **Order ID:** \`${orderId}\`

📌 **Instructions:**
1. Open any UPI app (GPay/PhonePe/Paytm)
2. Scan this QR code
3. Pay exact amount: ₹${amount}
4. Take screenshot
5. Click "I have paid" button

⏰ **Valid for:** 30 minutes`;

        await bot.sendPhoto(chatId, qrBuffer, {
            caption: caption,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ I have paid', callback_data: `upload_ss_${orderId}` }],
                    [{ text: '❌ Cancel', callback_data: 'cancel_payment' }]
                ]
            }
        });
    } catch (error) {
        console.error('QR generation error:', error);
        await bot.sendMessage(chatId, '❌ Failed to generate QR code. Please try again.');
    }
}

// ==================== HANDLE SCREENSHOT UPLOAD ====================
async function handleScreenshotUpload(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (msg.photo) {
        // User sent screenshot
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
        
        await bot.sendMessage(chatId, '📝 **Enter UTR/Transaction ID**\n\nExample: `UTR123456789`', {
            parse_mode: 'Markdown',
            reply_markup: { force_reply: true }
        });
        
    } else if (msg.text && paymentState[userId]?.screenshot) {
        // User sent UTR
        const utr = msg.text.trim().toUpperCase();
        const state = paymentState[userId];
        
        // Validate UTR
        if (!/^[A-Z0-9]{6,30}$/.test(utr)) {
            return bot.sendMessage(chatId, '❌ Invalid UTR format. Please enter a valid UTR:');
        }
        
        // Submit payment for verification
        await submitManualPayment(bot, chatId, userId, state.orderId, utr, state.screenshot);
        
        // Clear state
        delete paymentState[userId];
    }
}

// ==================== SUBMIT MANUAL PAYMENT ====================
async function submitManualPayment(bot, chatId, userId, orderId, utr, screenshot) {
    try {
        // Update order status
        await updateOrderStatus(orderId, 'pending_approval');
        
        // Get order details
        const order = await getOrder(orderId);
        const user = await getUser(userId);
        
        // Prepare payment data for admin
        const paymentData = {
            orderId,
            userId,
            utr,
            screenshot,
            amount: order.total_price,
            category: order.category,
            quantity: order.quantity,
            username: user?.username || 'N/A',
            firstName: user?.first_name || 'N/A',
            timestamp: Date.now()
        };
        
        // Send to payment verification bot
        await sendToPaymentBot(paymentData);
        
        // Notify admin
        const adminMessage = 
            `🆕 **New Manual Payment Received**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`
**User:** ${paymentData.firstName} (@${paymentData.username})
**User ID:** \`${userId}\`
**Category:** ${order.category}
**Quantity:** ${order.quantity}
**Amount:** ₹${order.total_price}
**UTR:** \`${utr}\`

**Action Required:** Verify payment in @SheinPaymentVerifyBot`;

        await bot.sendMessage(process.env.ADMIN_ID, adminMessage, {
            parse_mode: 'Markdown'
        });
        
        // Send screenshot to admin
        await bot.sendPhoto(process.env.ADMIN_ID, Buffer.from(screenshot.split(',')[1], 'base64'), {
            caption: `📸 Payment Screenshot for Order ${orderId}`
        });
        
        // Confirm to user
        await bot.sendMessage(chatId, 
            `✅ **Payment Proof Submitted!**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`
**UTR:** \`${utr}\`

📌 **Next Steps:**
1. Admin will verify your payment
2. You'll receive vouchers within 24 hours
3. Check status in "My Orders"

Thank you for your patience! 🙏`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [['🔙 Back to Main Menu']],
                    resize_keyboard: true
                }
            }
        );
        
        return { success: true };
        
    } catch (error) {
        console.error('Submit manual payment error:', error);
        await bot.sendMessage(chatId, '❌ Failed to submit payment. Please try again.');
        return { success: false };
    }
}

// ==================== SEND TO PAYMENT BOT ====================
async function sendToPaymentBot(paymentData) {
    try {
        const botToken = process.env.PAYMENT_BOT_TOKEN;
        const adminId = process.env.ADMIN_ID;
        
        // Send message to payment bot
        const message = 
            `🆕 **Payment Verification Required**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${paymentData.orderId}\`
**User:** ${paymentData.firstName} (@${paymentData.username})
**User ID:** \`${paymentData.userId}\`
**Category:** ${paymentData.category}
**Quantity:** ${paymentData.quantity}
**Amount:** ₹${paymentData.amount}
**UTR:** \`${paymentData.utr}\`

✅ **Verify Payment** - /verify_${paymentData.orderId}
❌ **Reject Payment** - /reject_${paymentData.orderId}`;

        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: adminId,
            text: message,
            parse_mode: 'Markdown'
        });
        
        // Send screenshot
        await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            chat_id: adminId,
            photo: paymentData.screenshot,
            caption: `📸 Screenshot for Order ${paymentData.orderId}`
        });
        
    } catch (error) {
        console.error('Error sending to payment bot:', error);
    }
}

// ==================== APPROVE PAYMENT ====================
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
        
        // Update user stats
        await updateUserStats(order.user_id, order.total_price);
        
        // Send vouchers to user
        const voucherMessage = 
            `✅ **Payment Approved! Vouchers Delivered**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`
**Category:** ${order.category}
**Quantity:** ${order.quantity}
**Total:** ₹${order.total_price}

**Your Vouchers:**
${assignedVouchers.map((v, i) => `${i+1}. \`${v}\``).join('\n')}

Thank you for shopping with us! 🎉`;

        await bot.sendMessage(parseInt(order.user_id), voucherMessage, {
            parse_mode: 'Markdown'
        });
        
        // Send notification to channel
        const user = await getUser(order.user_id);
        await bot.sendMessage(process.env.CHANNEL_2,
            `🎯 **New Order Delivered**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╰➤👤 **User:** @${user?.username || 'N/A'}
╰➤🆔 **User ID:** \`${order.user_id}\`
╰➤📡 **Status:** ✅ Delivered
╰➤📦 **Category:** ${order.category}
╰➤🔢 **Quantity:** ${order.quantity}
╰➤💰 **Amount:** ₹${order.total_price}

🤖 **Bot:** @SheinVoucherHub_Bot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            { parse_mode: 'Markdown' }
        );
        
        await bot.sendMessage(chatId, 
            `✅ **Payment Approved!**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: \`${orderId}\`
Vouchers sent: ${assignedVouchers.length}`,
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error('Approve payment error:', error);
        await bot.sendMessage(chatId, '❌ Failed to approve payment: ' + error.message);
    }
}

// ==================== REJECT PAYMENT ====================
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`

Your payment could not be verified.
**Reason:** ${reason}

Please contact @SheinVoucherHub for assistance.`;

        await bot.sendMessage(parseInt(order.user_id), rejectMessage, {
            parse_mode: 'Markdown'
        });
        
        await bot.sendMessage(chatId, 
            `✅ **Payment Rejected**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: \`${orderId}\`
Reason: ${reason}`,
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error('Reject payment error:', error);
        await bot.sendMessage(chatId, '❌ Failed to reject payment: ' + error.message);
    }
}

module.exports = {
    initiateManualPayment,
    showQRCode,
    handleScreenshotUpload,
    submitManualPayment,
    approvePayment,
    rejectPayment,
    paymentState
};
