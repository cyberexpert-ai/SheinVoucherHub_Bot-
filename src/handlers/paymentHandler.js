const db = require('../database/database');

// UTR ফরম্যাট চেক করার ফাংশন
function isValidUTR(utr) {
    return /^[A-Z0-9]{6,30}$/.test(utr);
}

// পেমেন্ট ইন্সট্রাকশন পাঠান
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

// UTR প্রসেস করুন
async function processUTR(utr, orderId, userId, screenshot, bot, chatId, orderDetails) {
    console.log('Processing UTR:', utr, 'for order:', orderId);
    
    // UTR ফরম্যাট চেক
    if (!isValidUTR(utr)) {
        return {
            success: false,
            message: '❌ **Invalid UTR Format!**\n\n' +
                    'UTR should be 6-30 characters long and contain only letters and numbers.\n\n' +
                    '✅ **Valid Examples:**\n' +
                    '• `UTR123456789`\n' +
                    '• `ABC123456`\n' +
                    '• `1234567890`\n\n' +
                    'Please try again:'
        };
    }
    
    try {
        // Update order with payment
        const paymentUpdated = db.updateOrderPayment(orderId, utr, screenshot);
        
        if (!paymentUpdated) {
            return {
                success: false,
                message: '❌ **Error updating payment!**\n\nPlease try again or contact support.'
            };
        }
        
        // Success message
        const successMessage = `✅ **Payment Proof Submitted Successfully!**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                              `📋 **Order Details**\n` +
                              `• Order ID: \`${orderId}\`\n` +
                              `• UTR Number: \`${utr}\`\n` +
                              `• Category: ${orderDetails.categoryName}\n` +
                              `• Quantity: ${orderDetails.quantity} codes\n` +
                              `• Total Amount: ₹${orderDetails.total}\n\n` +
                              `📌 **Next Steps:**\n` +
                              `1️⃣ Admin will verify your payment\n` +
                              `2️⃣ You'll receive vouchers within 24 hours\n` +
                              `3️⃣ Check status in "My Orders"\n\n` +
                              `Thank you for your patience! 🙏`;
        
        return {
            success: true,
            message: successMessage,
            utr: utr
        };
    } catch (error) {
        console.error('Error processing UTR:', error);
        return {
            success: false,
            message: '❌ **Error processing payment!**\n\nPlease try again or contact support.'
        };
    }
}

// অ্যাডমিনকে নোটিফাই করুন
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

module.exports = {
    sendPaymentInstructions,
    processUTR,
    notifyAdmin
};
