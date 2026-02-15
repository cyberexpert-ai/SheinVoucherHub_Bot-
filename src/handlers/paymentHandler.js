const { 
    createOrder, 
    updateOrderPayment, 
    getOrder,
    updateOrderStatus,
    getSetting,
    getUser
} = require('../sheets/googleSheets');
const axios = require('axios');

let paymentState = {};

async function handlePayment(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (msg.photo) {
        // User sent screenshot
        const photo = msg.photo[msg.photo.length - 1].file_id;
        paymentState[userId] = paymentState[userId] || {};
        paymentState[userId].screenshot = photo;
        
        await bot.sendMessage(chatId, '📝 Please enter your transaction ID/UTR number:\n\n⚠️ Fake UTR will result in permanent ban!', {
            reply_markup: {
                force_reply: true
            }
        });
        
    } else if (msg.text && paymentState[userId]?.screenshot) {
        // User sent UTR
        const state = paymentState[userId];
        const utr = msg.text;
        
        // Validate UTR format (basic check)
        if (!/^[A-Za-z0-9]{6,20}$/.test(utr)) {
            return bot.sendMessage(chatId, '❌ Invalid UTR format. Please enter a valid UTR number:');
        }
        
        // Create order
        const orderId = await createOrder(
            userId,
            state.category,
            state.quantity,
            state.totalPrice,
            'manual'
        );
        
        await updateOrderPayment(orderId, utr, state.screenshot);
        
        // Get user info for admin notification
        const user = await getUser(userId);
        
        // Send to admin for approval
        await bot.sendMessage(process.env.ADMIN_ID, 
            `🆕 New Payment Pending
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
User: ${msg.from.first_name} (@${msg.from.username || 'N/A'})
User ID: ${userId}
Category: ${state.categoryName}
Quantity: ${state.quantity}
Amount: ₹${state.totalPrice}
UTR: ${utr}

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
        
        // Forward screenshot to admin
        await bot.sendPhoto(process.env.ADMIN_ID, state.screenshot, {
            caption: `📸 Payment Screenshot for Order ${orderId}`
        });
        
        await bot.sendMessage(chatId, 
            `✅ Payment received! 
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Amount: ₹${state.totalPrice}
UTR: ${utr}

Admin will verify your payment and deliver vouchers within 24 hours.

Thank you for your purchase! 🎉`
        );
        
        // Clear payment state
        delete paymentState[userId];
    }
}

async function handleBaratpayPayment(bot, chatId, userId, amount, orderId) {
    try {
        // Initialize Baratpay API
        const apiKey = process.env.BARATPAY_API_KEY;
        const callbackUrl = `https://your-bot-url.onrender.com/payment/callback`;
        
        // Create payment request
        const response = await axios.post('https://api.baratpay.com/v1/payments', {
            amount: amount,
            currency: 'INR',
            order_id: orderId,
            callback_url: callbackUrl,
            customer_id: userId.toString()
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data && response.data.payment_url) {
            await bot.sendMessage(chatId, 
                `💰 Payment Link Generated
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Amount: ₹${amount}

Click below to complete payment:`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '💳 Pay Now', url: response.data.payment_url }],
                            [{ text: '✅ I have paid', callback_data: `check_payment_${orderId}` }]
                        ]
                    }
                }
            );
        } else {
            throw new Error('Failed to generate payment link');
        }
    } catch (error) {
        console.error('Baratpay error:', error);
        await bot.sendMessage(chatId, '❌ Payment gateway error. Please try again or use manual payment.');
    }
}

async function verifyBaratpayPayment(orderId) {
    try {
        const apiKey = process.env.BARATPAY_API_KEY;
        const response = await axios.get(`https://api.baratpay.com/v1/payments/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        return response.data.status === 'success';
    } catch (error) {
        console.error('Payment verification error:', error);
        return false;
    }
}

async function checkPaymentStatus(bot, chatId, orderId) {
    const isPaid = await verifyBaratpayPayment(orderId);
    
    if (isPaid) {
        const order = await getOrder(orderId);
        if (order) {
            await updateOrderStatus(orderId, 'paid');
            await bot.sendMessage(chatId, '✅ Payment verified! Admin will deliver vouchers soon.');
            
            // Notify admin
            await bot.sendMessage(process.env.ADMIN_ID, 
                `💰 Auto Payment Verified
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Amount: ₹${order.total_price}

Process order for delivery.`
            );
        }
    } else {
        await bot.sendMessage(chatId, '⏳ Payment not yet verified. Please wait or contact support.');
    }
}

module.exports = {
    handlePayment,
    handleBaratpayPayment,
    verifyBaratpayPayment,
    checkPaymentStatus,
    paymentState
};
