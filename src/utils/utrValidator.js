// UTR Validator - আলাদা ফাইল
const db = require('../database/database');

// UTR ফরম্যাট চেক করার ফাংশন
function isValidUTR(utr) {
    // UTR should be 6-30 characters, only letters and numbers
    return /^[A-Z0-9]{6,30}$/.test(utr);
}

// UTR ফরম্যাট মেসেজ
function getUTRFormatMessage() {
    return '❌ **Invalid UTR Format!**\n\n' +
           'UTR should be 6-30 characters long and contain only letters and numbers.\n\n' +
           '✅ **Valid Examples:**\n' +
           '• `UTR123456789`\n' +
           '• `ABC123456`\n' +
           '• `1234567890`\n' +
           '• `PAYMENT12345`\n\n' +
           '❌ **Invalid Examples:**\n' +
           '• `UTR@123` (special characters not allowed)\n' +
           '• `123` (too short)\n' +
           '• `ABC` (too short)\n\n' +
           'Please try again:';
}

// UTR প্রসেস করার ফাংশন
async function processUTR(utr, userId, orderId, screenshot, bot, chatId, state) {
    console.log('Processing UTR:', utr);
    
    // UTR ফরম্যাট চেক
    if (!isValidUTR(utr)) {
        console.log('Invalid UTR format');
        return {
            success: false,
            message: getUTRFormatMessage()
        };
    }
    
    // চেক করে UTR আগে ব্যবহার করা হয়েছে কিনা
    if (db.isUTRUsed(utr)) {
        console.log('UTR already used');
        db.addWarning(userId, 'Duplicate UTR');
        return {
            success: false,
            message: '❌ **This UTR has already been used!**\n\n' +
                    'Fake payment detected.\n\n' +
                    'Please try again with correct UTR:'
        };
    }
    
    console.log('UTR is valid, processing payment');
    
    // UTR মার্ক as used
    db.addUsedUTR(utr);
    
    // Update order with payment
    const paymentUpdated = db.updateOrderPayment(orderId, utr, screenshot);
    console.log('Payment updated:', paymentUpdated);
    
    // Add warning for suspicious UTR
    if (utr.includes('FAKE') || utr.includes('TEST') || utr.includes('DEMO') || utr.includes('123456')) {
        db.addWarning(userId, 'Suspicious UTR');
    }
    
    // Success message
    const successMessage = `✅ **Payment Proof Submitted Successfully!**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                          `📋 **Order Details**\n` +
                          `• Order ID: \`${orderId}\`\n` +
                          `• UTR Number: \`${utr}\`\n` +
                          `• Category: ${state.categoryName}\n` +
                          `• Quantity: ${state.quantity} codes\n` +
                          `• Total Amount: ₹${state.total}\n\n` +
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
}

module.exports = {
    isValidUTR,
    getUTRFormatMessage,
    processUTR
};
