const moment = require("moment");

function generateOrderId() {
    const dateStr = moment().format('YYYYMMDD');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `SVH-${dateStr}-${randomNum}`;
}

function formatCurrency(amount) {
    return `₹${amount.toFixed(2)}`;
}

function escapeMarkdown(text) {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

function splitArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

function calculatePrice(category, quantity) {
    // Base price calculation
    const basePrice = parseInt(category) / 10; // Rough calculation
    
    let price;
    if (quantity === 1) {
        price = basePrice;
    } else if (quantity === 5) {
        price = basePrice * 5 - 1;
    } else {
        price = basePrice * quantity * 0.95; // 5% discount for bulk
    }
    
    // Round to pattern
    if (price < 100) {
        price = Math.floor(price / 10) * 10 + 9;
    } else if (price < 1000) {
        price = Math.floor(price / 100) * 100 + 99;
    } else {
        price = Math.floor(price / 1000) * 1000 + 999;
    }
    
    return Math.floor(price);
}

function validateUTR(utr) {
    // Basic UTR validation
    // Can be enhanced based on actual UTR format
    const utrRegex = /^[A-Z0-9]{12,22}$/i;
    return utrRegex.test(utr);
}

function sanitizeInput(input) {
    if (!input) return '';
    return input.toString().trim().replace(/[<>]/g, '');
}

function formatTimeLeft(expiryTime) {
    const now = moment();
    const expiry = moment(expiryTime);
    const duration = moment.duration(expiry.diff(now));
    
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

module.exports = {
    generateOrderId,
    formatCurrency,
    escapeMarkdown,
    splitArray,
    calculatePrice,
    validateUTR,
    sanitizeInput,
    formatTimeLeft
};
