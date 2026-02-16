const { 
    createOrder, 
    updateOrderPayment, 
    getOrder,
    updateOrderStatus,
    getSetting,
    getUser
} = require('../sheets/googleSheets');
const axios = require('axios');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Razorpay Initialize
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

let paymentState = {};

// Mini App Website HTML Template
const getPaymentPageHTML = (orderId, amount, currency = 'INR') => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Shein Voucher Payment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #333;
                font-size: 24px;
                margin-bottom: 10px;
            }
            .header p {
                color: #666;
                font-size: 14px;
            }
            .order-details {
                background: #f8f9fa;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 25px;
            }
            .order-details h3 {
                color: #555;
                font-size: 16px;
                margin-bottom: 15px;
            }
            .detail-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            .detail-item:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            .label {
                color: #777;
                font-size: 14px;
            }
            .value {
                color: #333;
                font-weight: 600;
                font-size: 14px;
            }
            .amount {
                font-size: 28px;
                font-weight: 700;
                color: #4CAF50;
                text-align: center;
                margin: 20px 0;
            }
            .payment-methods {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 25px;
            }
            .payment-method {
                display: flex;
                align-items: center;
                padding: 15px;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s;
                background: white;
            }
            .payment-method:hover {
                border-color: #667eea;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
            }
            .payment-method.selected {
                border-color: #4CAF50;
                background: #f0f9f0;
            }
            .payment-method input[type="radio"] {
                margin-right: 15px;
                width: 20px;
                height: 20px;
                cursor: pointer;
            }
            .method-info {
                flex: 1;
            }
            .method-name {
                font-weight: 600;
                color: #333;
                margin-bottom: 5px;
            }
            .method-desc {
                font-size: 12px;
                color: #888;
            }
            .method-icon {
                width: 40px;
                height: 40px;
                background: #f0f0f0;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                font-size: 20px;
            }
            .pay-button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 16px;
                border-radius: 12px;
                font-size: 18px;
                font-weight: 600;
                width: 100%;
                cursor: pointer;
                transition: all 0.3s;
                margin-bottom: 15px;
            }
            .pay-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            }
            .pay-button:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            .manual-payment {
                border-top: 2px solid #eee;
                padding-top: 20px;
                margin-top: 10px;
            }
            .manual-payment h4 {
                color: #555;
                margin-bottom: 15px;
                font-size: 16px;
            }
            .bank-details {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 15px;
                font-family: monospace;
                font-size: 14px;
                line-height: 1.8;
                margin-bottom: 15px;
            }
            .upload-section {
                border: 2px dashed #ccc;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
            }
            .upload-section:hover {
                border-color: #667eea;
                background: #f8f9fa;
            }
            .upload-section input[type="file"] {
                display: none;
            }
            .upload-icon {
                font-size: 40px;
                color: #667eea;
                margin-bottom: 10px;
            }
            .upload-text {
                color: #666;
                font-size: 14px;
            }
            .file-name {
                margin-top: 10px;
                color: #4CAF50;
                font-size: 13px;
            }
            .utr-input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
                margin: 15px 0;
                transition: all 0.3s;
            }
            .utr-input:focus {
                outline: none;
                border-color: #667eea;
            }
            .status-message {
                text-align: center;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                display: none;
            }
            .status-message.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
                display: block;
            }
            .status-message.error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
                display: block;
            }
            .status-message.info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
                display: block;
            }
            .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 10px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #999;
                font-size: 12px;
            }
            .qr-code {
                text-align: center;
                margin: 20px 0;
            }
            .qr-code img {
                max-width: 200px;
                border-radius: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Shein Voucher Payment</h1>
                <p>Complete your payment to get vouchers instantly</p>
            </div>
            
            <div class="order-details">
                <h3>📋 Order Summary</h3>
                <div class="detail-item">
                    <span class="label">Order ID:</span>
                    <span class="value">${orderId}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Amount:</span>
                    <span class="value amount-value">₹${amount}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Currency:</span>
                    <span class="value">${currency}</span>
                </div>
            </div>
            
            <div class="amount">₹${amount}</div>
            
            <div class="payment-methods">
                <label class="payment-method" onclick="selectMethod('auto')">
                    <input type="radio" name="paymentMethod" value="auto" checked>
                    <div class="method-icon">🤖</div>
                    <div class="method-info">
                        <div class="method-name">Auto Payment (Instant)</div>
                        <div class="method-desc">Pay with Razorpay - Credit Card, UPI, NetBanking</div>
                    </div>
                </label>
                
                <label class="payment-method" onclick="selectMethod('manual')">
                    <input type="radio" name="paymentMethod" value="manual">
                    <div class="method-icon">💳</div>
                    <div class="method-info">
                        <div class="method-name">Manual Payment</div>
                        <div class="method-desc">Bank Transfer + Upload Screenshot</div>
                    </div>
                </label>
            </div>
            
            <div id="autoPaymentSection">
                <button class="pay-button" onclick="initiateRazorpayPayment()">
                    Pay Now with Razorpay
                </button>
                <p style="text-align: center; color: #888; font-size: 12px;">
                    🔒 Secure payment powered by Razorpay
                </p>
            </div>
            
            <div id="manualPaymentSection" style="display: none;">
                <div class="manual-payment">
                    <h4>🏦 Bank Transfer Details</h4>
                    <div class="bank-details">
                        <strong>Bank:</strong> HDFC Bank<br>
                        <strong>Account Name:</strong> Shein Voucher Hub<br>
                        <strong>Account No:</strong> 50100234567890<br>
                        <strong>IFSC Code:</strong> HDFC0001234<br>
                        <strong>UPI ID:</strong> sheinvoucher@hdfcbank<br>
                        <strong>Amount:</strong> ₹${amount}
                    </div>
                    
                    <div class="qr-code">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=sheinvoucher@hdfcbank&pn=SheinVoucher&am=${amount}&cu=INR" alt="UPI QR Code">
                        <p style="color: #888; font-size: 12px; margin-top: 5px;">Scan to pay via UPI</p>
                    </div>
                    
                    <h4>📸 Upload Payment Screenshot</h4>
                    <div class="upload-section" onclick="document.getElementById('screenshot').click()">
                        <input type="file" id="screenshot" accept="image/*" onchange="handleFileSelect(event)">
                        <div class="upload-icon">📎</div>
                        <div class="upload-text">Click to upload screenshot</div>
                        <div id="fileName" class="file-name"></div>
                    </div>
                    
                    <input type="text" class="utr-input" id="utr" placeholder="Enter UTR/Transaction ID">
                    
                    <button class="pay-button" onclick="submitManualPayment()">
                        Submit Payment Proof
                    </button>
                </div>
            </div>
            
            <div id="statusMessage" class="status-message"></div>
            
            <div class="footer">
                <p>© 2026 Shein Voucher Hub. All rights reserved.</p>
                <p>For support: @SheinVoucherHub</p>
            </div>
        </div>
        
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
            let selectedFile = null;
            let currentMethod = 'auto';
            
            function selectMethod(method) {
                currentMethod = method;
                document.querySelectorAll('.payment-method').forEach(el => {
                    el.classList.remove('selected');
                });
                event.currentTarget.classList.add('selected');
                
                if (method === 'auto') {
                    document.getElementById('autoPaymentSection').style.display = 'block';
                    document.getElementById('manualPaymentSection').style.display = 'none';
                } else {
                    document.getElementById('autoPaymentSection').style.display = 'none';
                    document.getElementById('manualPaymentSection').style.display = 'block';
                }
            }
            
            function handleFileSelect(event) {
                const file = event.target.files[0];
                if (file) {
                    selectedFile = file;
                    document.getElementById('fileName').textContent = file.name;
                }
            }
            
            async function initiateRazorpayPayment() {
                showStatus('info', 'Initializing payment...');
                
                try {
                    // Create Razorpay order
                    const response = await fetch('/api/create-razorpay-order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            orderId: '${orderId}',
                            amount: ${amount}
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (!data.success) {
                        throw new Error(data.error || 'Failed to create order');
                    }
                    
                    const options = {
                        key: '${process.env.RAZORPAY_KEY_ID}',
                        amount: data.amount,
                        currency: data.currency,
                        name: 'Shein Voucher Hub',
                        description: 'Voucher Purchase',
                        order_id: data.razorpayOrderId,
                        handler: async function(response) {
                            showStatus('info', 'Verifying payment...');
                            
                            // Verify payment
                            const verifyResponse = await fetch('/api/verify-razorpay-payment', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    orderId: '${orderId}',
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpaySignature: response.razorpay_signature
                                })
                            });
                            
                            const verifyData = await verifyResponse.json();
                            
                            if (verifyData.success) {
                                showStatus('success', '✅ Payment successful! Vouchers will be delivered instantly.');
                                setTimeout(() => {
                                    window.close();
                                }, 3000);
                            } else {
                                showStatus('error', '❌ Payment verification failed. Please contact support.');
                            }
                        },
                        prefill: {
                            name: 'Telegram User',
                            email: 'user@example.com',
                            contact: '9999999999'
                        },
                        theme: {
                            color: '#667eea'
                        },
                        modal: {
                            ondismiss: function() {
                                showStatus('info', 'Payment cancelled');
                            }
                        }
                    };
                    
                    const rzp = new Razorpay(options);
                    rzp.open();
                    
                } catch (error) {
                    showStatus('error', '❌ Payment failed: ' + error.message);
                }
            }
            
            async function submitManualPayment() {
                const utr = document.getElementById('utr').value.trim();
                
                if (!selectedFile) {
                    showStatus('error', '❌ Please upload payment screenshot');
                    return;
                }
                
                if (!utr) {
                    showStatus('error', '❌ Please enter UTR/Transaction ID');
                    return;
                }
                
                showStatus('info', 'Submitting payment proof...');
                
                const formData = new FormData();
                formData.append('screenshot', selectedFile);
                formData.append('orderId', '${orderId}');
                formData.append('utr', utr);
                
                try {
                    const response = await fetch('/api/submit-manual-payment', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showStatus('success', '✅ Payment proof submitted! Admin will verify and deliver vouchers soon.');
                        setTimeout(() => {
                            window.close();
                        }, 3000);
                    } else {
                        showStatus('error', '❌ Submission failed: ' + data.error);
                    }
                } catch (error) {
                    showStatus('error', '❌ Submission failed: ' + error.message);
                }
            }
            
            function showStatus(type, message) {
                const statusDiv = document.getElementById('statusMessage');
                statusDiv.className = 'status-message ' + type;
                statusDiv.textContent = message;
                statusDiv.style.display = 'block';
            }
        </script>
    </body>
    </html>
    `;
};

// Create Razorpay Order
async function createRazorpayOrder(orderId, amount) {
    try {
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: 'INR',
            receipt: orderId,
            payment_capture: 1
        };
        
        const order = await razorpay.orders.create(options);
        return {
            success: true,
            razorpayOrderId: order.id,
            amount: order.amount,
            currency: order.currency
        };
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Verify Razorpay Payment
async function verifyRazorpayPayment(orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    try {
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");
        
        const isAuthentic = expectedSignature === razorpaySignature;
        
        if (isAuthentic) {
            // Update order status
            await updateOrderStatus(orderId, 'paid');
            
            // Get order details
            const order = await getOrder(orderId);
            
            // Auto-deliver if enabled
            if (order && order.category) {
                await autoDeliverVouchers(orderId);
            }
            
            return {
                success: true,
                message: 'Payment verified successfully'
            };
        } else {
            return {
                success: false,
                error: 'Invalid signature'
            };
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Auto Deliver Vouchers (for auto payments)
async function autoDeliverVouchers(orderId) {
    const { getAvailableVouchers, assignVoucherToOrder } = require('../sheets/googleSheets');
    const order = await getOrder(orderId);
    
    if (!order) return false;
    
    // Get available vouchers
    const vouchers = await getAvailableVouchers(order.category);
    
    if (vouchers.length < parseInt(order.quantity)) {
        // Notify admin about insufficient stock
        await bot.sendMessage(process.env.ADMIN_ID, 
            `⚠️ Auto-delivery failed for Order ${orderId}\nReason: Insufficient stock`
        );
        return false;
    }
    
    // Assign vouchers to order
    const assignedVouchers = [];
    for (let i = 0; i < parseInt(order.quantity); i++) {
        const voucher = vouchers[i];
        await assignVoucherToOrder(voucher.voucher_id, order.user_id, orderId);
        assignedVouchers.push(voucher.code);
    }
    
    // Update order status
    await updateOrderStatus(orderId, 'delivered', new Date().toISOString());
    
    // Send vouchers to user
    const voucherMessage = `✅ Payment Successful! Vouchers Delivered Instantly!
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Category: ${order.category}
Quantity: ${order.quantity}

Your vouchers:
${assignedVouchers.map((v, i) => `${i+1}. ${v}`).join('\n')}

Thank you for shopping with us! 🎉`;

    await bot.sendMessage(parseInt(order.user_id), voucherMessage);
    
    // Send notification to OrdersNotify channel
    await bot.sendMessage(process.env.CHANNEL_2,
        `🎯 𝗡𝗲𝘄 𝗢𝗿𝗱𝗲𝗿 (𝗔𝘂𝘁𝗼 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗲𝗱)
━━━━━━━━━━━━━━━━━━━━━

╰➤👤 𝗨𝗦𝗘𝗥 : @${order.username || 'N/A'}
╰➤🆔 𝗜𝗗 : ${order.user_id}
╰➤📡 𝗦𝗧𝗔𝗧𝗨𝗦: ✅ Auto Success
╰➤ 📦𝗤𝗨𝗔𝗡𝗧𝗜𝗧𝗬 : ${order.quantity}
╰➤ 💳𝗔𝗠𝗢𝗨𝗡𝗧 : ₹${order.total_price}

🤖𝗕𝗢𝗧 : @SheinVoucherHub_Bot
━━━━━━━━━━━━━━━━━━━━━`
    );
    
    return true;
}

// Handle payment initiation
async function initiatePayment(bot, chatId, userId, category, quantity, totalPrice, categoryName) {
    // Create order first
    const orderId = await createOrder(
        userId,
        category,
        quantity,
        totalPrice,
        'pending'
    );
    
    // Store in payment state
    paymentState[userId] = {
        orderId,
        category,
        quantity,
        totalPrice,
        categoryName,
        chatId
    };
    
    // Create mini app button
    const webAppUrl = `${process.env.WEBAPP_URL}/pay?orderId=${orderId}&amount=${totalPrice}`;
    
    await bot.sendMessage(chatId, 
        `💳 Payment Options
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Category: ${categoryName}
Quantity: ${quantity}
Amount: ₹${totalPrice}

Choose payment method:`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🤖 Auto Payment (Instant)', web_app: { url: webAppUrl } }],
                    [{ text: '💳 Manual Payment', callback_data: `manual_pay_${orderId}` }],
                    [{ text: '❌ Cancel', callback_data: 'cancel_payment' }]
                ]
            }
        }
    );
}

// Handle manual payment
async function handleManualPayment(bot, chatId, userId, orderId) {
    paymentState[userId] = {
        ...paymentState[userId],
        orderId,
        method: 'manual'
    };
    
    await bot.sendMessage(chatId, 
        `💳 Manual Payment Instructions
━━━━━━━━━━━━━━━━━━━━━

🏦 Bank Details:
• Bank: HDFC Bank
• Account: Shein Voucher Hub
• A/c No: 50100234567890
• IFSC: HDFC0001234
• UPI: sheinvoucher@hdfcbank

💰 Amount: ₹${paymentState[userId]?.totalPrice || 'Check order'}

Steps:
1. Send payment to above account
2. Take screenshot of payment
3. Send screenshot here
4. Send UTR number

⚠️ Fake payments = Permanent ban!`,
        {
            reply_markup: {
                keyboard: [['📸 Send Screenshot', '❌ Cancel']],
                resize_keyboard: true
            }
        }
    );
}

// Handle payment from web app
async function handleWebAppPayment(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const data = msg.web_app_data?.data;
    
    if (!data) return;
    
    try {
        const paymentData = JSON.parse(data);
        
        if (paymentData.type === 'razorpay_success') {
            // Payment successful via Razorpay
            const { orderId, paymentId, signature } = paymentData;
            
            // Verify payment
            const verified = await verifyRazorpayPayment(
                orderId,
                paymentData.razorpayOrderId,
                paymentId,
                signature
            );
            
            if (verified.success) {
                await bot.sendMessage(chatId, 
                    `✅ Payment Successful! 
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Payment ID: ${paymentId}

Your vouchers will be delivered instantly!`
                );
                
                // Auto-deliver vouchers
                await autoDeliverVouchers(orderId);
            } else {
                await bot.sendMessage(chatId, 
                    '❌ Payment verification failed. Please contact support.'
                );
            }
        }
    } catch (error) {
        console.error('WebApp payment error:', error);
    }
}

// Handle manual payment submission
async function handleManualPaymentSubmission(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (msg.photo) {
        // User sent screenshot
        const photo = msg.photo[msg.photo.length - 1].file_id;
        paymentState[userId] = paymentState[userId] || {};
        paymentState[userId].screenshot = photo;
        
        await bot.sendMessage(chatId, '📝 Please enter your transaction ID/UTR number:', {
            reply_markup: {
                force_reply: true
            }
        });
        
    } else if (msg.text && paymentState[userId]?.screenshot) {
        // User sent UTR
        const state = paymentState[userId];
        const utr = msg.text;
        
        // Validate UTR
        if (!/^[A-Za-z0-9]{6,20}$/.test(utr)) {
            return bot.sendMessage(chatId, '❌ Invalid UTR format. Please enter a valid UTR:');
        }
        
        // Update order with payment details
        await updateOrderPayment(state.orderId, utr, state.screenshot);
        await updateOrderStatus(state.orderId, 'pending');
        
        // Get user info
        const user = await getUser(userId);
        
        // Notify admin
        await bot.sendMessage(process.env.ADMIN_ID, 
            `🆕 Manual Payment Submitted
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${state.orderId}
User: ${msg.from.first_name} (@${msg.from.username || 'N/A'})
User ID: ${userId}
Amount: ₹${state.totalPrice}
UTR: ${utr}

Approve to send vouchers:`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Approve', callback_data: `approve_${state.orderId}` },
                            { text: '❌ Reject', callback_data: `reject_${state.orderId}` }
                        ]
                    ]
                }
            }
        );
        
        // Forward screenshot
        await bot.sendPhoto(process.env.ADMIN_ID, state.screenshot, {
            caption: `📸 Payment Screenshot for Order ${state.orderId}`
        });
        
        await bot.sendMessage(chatId, 
            `✅ Payment proof submitted!
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${state.orderId}
UTR: ${utr}

Admin will verify and deliver vouchers within 24 hours.`
        );
        
        // Clear state
        delete paymentState[userId];
    }
}

module.exports = {
    initiatePayment,
    handleManualPayment,
    handleWebAppPayment,
    handleManualPaymentSubmission,
    createRazorpayOrder,
    verifyRazorpayPayment,
    autoDeliverVouchers,
    paymentState
};
