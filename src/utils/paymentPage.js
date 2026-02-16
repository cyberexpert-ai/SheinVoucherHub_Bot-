const getPaymentPageHTML = (orderId, amount, userId) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shein Voucher Payment</title>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            max-width: 500px;
            width: 100%;
            background: white;
            border-radius: 20px;
            padding: 30px;
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
        
        .order-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 25px;
        }
        
        .order-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        
        .order-row:last-child {
            border-bottom: none;
        }
        
        .label {
            color: #666;
            font-weight: 500;
        }
        
        .value {
            color: #333;
            font-weight: 600;
        }
        
        .amount {
            font-size: 32px;
            font-weight: 700;
            color: #4CAF50;
            text-align: center;
            margin: 20px 0;
        }
        
        .method-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .method-tab {
            flex: 1;
            padding: 15px;
            text-align: center;
            background: #f5f5f5;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .method-tab.active {
            background: #667eea;
            color: white;
        }
        
        .method-content {
            display: none;
        }
        
        .method-content.active {
            display: block;
        }
        
        .razorpay-btn {
            width: 100%;
            padding: 18px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin: 15px 0;
        }
        
        .razorpay-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102,126,234,0.4);
        }
        
        .bank-details {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin: 15px 0;
        }
        
        .detail-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        
        .detail-label {
            flex: 1;
            color: #666;
            font-size: 14px;
        }
        
        .detail-value {
            font-weight: 600;
            color: #333;
            margin-right: 10px;
        }
        
        .copy-btn {
            padding: 5px 10px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .copy-btn:hover {
            background: #5a67d8;
        }
        
        .upload-area {
            border: 2px dashed #ccc;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            cursor: pointer;
            margin: 20px 0;
        }
        
        .upload-area:hover {
            border-color: #667eea;
        }
        
        .upload-icon {
            font-size: 48px;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .file-name {
            margin-top: 10px;
            color: #4CAF50;
        }
        
        .utr-input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            margin: 15px 0;
        }
        
        .utr-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .submit-btn {
            width: 100%;
            padding: 18px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            margin: 10px 0;
        }
        
        .submit-btn:hover {
            background: #45a049;
        }
        
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            display: none;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
            display: block;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
            display: block;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
        }
        
        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Shein Voucher Payment</h1>
            <p>Complete your payment to get vouchers instantly</p>
        </div>
        
        <div class="order-card">
            <div class="order-row">
                <span class="label">Order ID:</span>
                <span class="value">${orderId}</span>
            </div>
            <div class="order-row">
                <span class="label">Amount:</span>
                <span class="value amount-value">₹${amount}</span>
            </div>
        </div>
        
        <div class="method-tabs">
            <button class="method-tab active" onclick="switchMethod('auto')">🤖 Auto Payment</button>
            <button class="method-tab" onclick="switchMethod('manual')">💳 Manual Payment</button>
        </div>
        
        <!-- Auto Payment Section -->
        <div id="autoPayment" class="method-content active">
            <button class="razorpay-btn" onclick="initiateRazorpay()">
                Pay Now with Razorpay
            </button>
            <p style="text-align:center; color:#666; font-size:13px;">
                ✅ Instant Delivery • Secure Payment • UPI/Card/NetBanking
            </p>
        </div>
        
        <!-- Manual Payment Section -->
        <div id="manualPayment" class="method-content">
            <div class="bank-details">
                <h3 style="margin-bottom:15px;">🏦 Bank Transfer Details</h3>
                
                <div class="detail-item">
                    <span class="detail-label">Bank:</span>
                    <span class="detail-value">HDFC Bank</span>
                    <button class="copy-btn" onclick="copyText('HDFC Bank')">Copy</button>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Account Name:</span>
                    <span class="detail-value">Shein Voucher Hub</span>
                    <button class="copy-btn" onclick="copyText('Shein Voucher Hub')">Copy</button>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Account No:</span>
                    <span class="detail-value">50100234567890</span>
                    <button class="copy-btn" onclick="copyText('50100234567890')">Copy</button>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">IFSC Code:</span>
                    <span class="detail-value">HDFC0001234</span>
                    <button class="copy-btn" onclick="copyText('HDFC0001234')">Copy</button>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">UPI ID:</span>
                    <span class="detail-value">sheinvoucher@hdfcbank</span>
                    <button class="copy-btn" onclick="copyText('sheinvoucher@hdfcbank')">Copy</button>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Amount to pay:</span>
                    <span class="detail-value">₹${amount}</span>
                    <button class="copy-btn" onclick="copyText('${amount}')">Copy</button>
                </div>
            </div>
            
            <h3 style="margin:20px 0 10px;">📸 Upload Payment Screenshot</h3>
            
            <div class="upload-area" onclick="document.getElementById('screenshot').click()">
                <input type="file" id="screenshot" accept="image/*" style="display:none;" onchange="handleFileSelect(event)">
                <div class="upload-icon">📎</div>
                <div>Click to upload screenshot</div>
                <div id="fileName" class="file-name"></div>
            </div>
            
            <input type="text" class="utr-input" id="utr" placeholder="Enter UTR/Transaction ID">
            
            <button class="submit-btn" onclick="submitManualPayment()">
                Submit Payment Proof
            </button>
        </div>
        
        <div id="status" class="status"></div>
        <div id="loading" class="loading" style="display:none;">
            <div class="loader"></div>
            <p>Processing...</p>
        </div>
        
        <div class="footer">
            <p>© 2026 Shein Voucher Hub | @SheinVoucherHub</p>
        </div>
    </div>
    
    <script>
        let selectedFile = null;
        const orderId = '${orderId}';
        const amount = ${amount};
        const userId = '${userId}';
        
        function switchMethod(method) {
            document.querySelectorAll('.method-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.method-content').forEach(content => content.classList.remove('active'));
            
            if (method === 'auto') {
                document.querySelectorAll('.method-tab')[0].classList.add('active');
                document.getElementById('autoPayment').classList.add('active');
            } else {
                document.querySelectorAll('.method-tab')[1].classList.add('active');
                document.getElementById('manualPayment').classList.add('active');
            }
        }
        
        function copyText(text) {
            navigator.clipboard.writeText(text).then(() => {
                showStatus('success', 'Copied to clipboard!');
            });
        }
        
        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                selectedFile = file;
                document.getElementById('fileName').textContent = file.name;
            }
        }
        
        async function initiateRazorpay() {
            showLoading(true);
            
            try {
                // Create order
                const response = await fetch('/api/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, orderId })
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error);
                }
                
                const options = {
                    key: '${process.env.RAZORPAY_KEY_ID}',
                    amount: data.amount,
                    currency: data.currency,
                    name: 'Shein Voucher Hub',
                    description: 'Voucher Purchase',
                    order_id: data.id,
                    handler: async function(response) {
                        showStatus('info', 'Verifying payment...');
                        
                        const verifyResponse = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId,
                                userId,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature
                            })
                        });
                        
                        const verifyData = await verifyResponse.json();
                        
                        if (verifyData.success) {
                            showStatus('success', '✅ Payment successful! Vouchers delivered.\n\n' + 
                                      verifyData.vouchers.map((v,i) => `${i+1}. ${v}`).join('\n'));
                            setTimeout(() => window.close(), 5000);
                        } else {
                            showStatus('error', '❌ ' + verifyData.error);
                        }
                    },
                    modal: {
                        ondismiss: function() {
                            showLoading(false);
                            showStatus('info', 'Payment cancelled');
                        }
                    }
                };
                
                const rzp = new Razorpay(options);
                rzp.open();
                
            } catch (error) {
                showStatus('error', '❌ ' + error.message);
            } finally {
                showLoading(false);
            }
        }
        
        async function submitManualPayment() {
            if (!selectedFile) {
                showStatus('error', 'Please upload payment screenshot');
                return;
            }
            
            const utr = document.getElementById('utr').value.trim();
            if (!utr) {
                showStatus('error', 'Please enter UTR number');
                return;
            }
            
            showLoading(true);
            
            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('userId', userId);
            formData.append('utr', utr);
            formData.append('screenshot', selectedFile);
            
            try {
                const response = await fetch('/api/submit-manual-payment', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showStatus('success', '✅ ' + data.message);
                    setTimeout(() => window.close(), 3000);
                } else {
                    showStatus('error', '❌ ' + data.error);
                }
            } catch (error) {
                showStatus('error', '❌ ' + error.message);
            } finally {
                showLoading(false);
            }
        }
        
        function showStatus(type, message) {
            const statusDiv = document.getElementById('status');
            statusDiv.className = 'status ' + type;
            statusDiv.textContent = message;
        }
        
        function showLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }
    </script>
</body>
</html>
    `;
};

module.exports = { getPaymentPageHTML };
