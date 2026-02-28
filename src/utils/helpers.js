const moment = require('moment');

function generateOrderId() {
    const prefix = 'SVH';
    const date = moment().format('YYYYMMDD');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const unique = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `${prefix}-${date}-${random}${unique}`;
}

function formatCurrency(amount) {
    return `₹${amount.toFixed(2)}`;
}

function formatDate(date) {
    return moment(date).format('DD MMM YYYY, hh:mm A');
}

function truncate(str, length) {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

function validateUtr(utr) {
    // Basic UTR validation - can be enhanced
    const utrRegex = /^[A-Za-z0-9]{6,30}$/;
    return utrRegex.test(utr);
}

function validateOrderId(orderId) {
    const orderRegex = /^SVH-\d{8}-[A-Z0-9]{12}$/;
    return orderRegex.test(orderId);
}

function sanitizeMessage(text) {
    // Remove any potentially harmful characters
    return text.replace(/[<>]/g, '');
}

function escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateTotalPrice(category, quantity, priceTiers) {
    // Find closest tier or calculate dynamically
    const tier = priceTiers.find(t => t.quantity === quantity);
    if (tier) return tier.price;
    
    // Calculate based on base price
    const basePrice = category.value === 500 ? 49 :
                      category.value === 1000 ? 99 :
                      category.value === 2000 ? 199 : 299;
    
    let price = basePrice * quantity;
    
    // Apply bulk discounts
    if (quantity > 80) price = price * 0.98; // 2% discount
    else if (quantity > 50) price = price * 0.99; // 1% discount
    
    return Math.round(price);
}

module.exports = {
    generateOrderId,
    formatCurrency,
    formatDate,
    truncate,
    validateUtr,
    validateOrderId,
    sanitizeMessage,
    escapeMarkdown,
    chunkArray,
    delay,
    calculateTotalPrice
};
