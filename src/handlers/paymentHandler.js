const db = require('../database/database');
const helpers = require('../utils/helpers');

async function verifyPayment(bot, userId, orderId, utr) {
    // Check if UTR is already used
    const existing = await db.query(
        'SELECT id FROM orders WHERE utr_number = ? UNION SELECT id FROM fraud_detection WHERE utr_number = ?',
        [utr, utr]
    );
    
    if (existing.length > 0) {
        return {
            valid: false,
            reason: 'duplicate_utr'
        };
    }
    
    // Additional validation can be added here
    // e.g., checking UTR format, length, etc.
    
    return {
        valid: true
    };
}

async function processRefund(bot, orderId) {
    const order = await db.getOrder(orderId);
    
    if (!order) return false;
    
    // Mark order as rejected with refund note
    await db.updateOrderStatus(orderId, 'rejected', 'Refund issued due to stock issue');
    
    // Notify user
    await bot.sendMessage(order.user_id,
        `💰 Refund Initiated\n\n` +
        `Order: ${orderId}\n` +
        `Amount: ₹${order.total_price}\n\n` +
        `Your refund has been initiated. It will reflect in 2-3 business days.`
    );
    
    return true;
}

module.exports = {
    verifyPayment,
    processRefund
};
