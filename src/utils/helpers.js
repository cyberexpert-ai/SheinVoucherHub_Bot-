const db = require('../database/database');

// Message deletion tracking
const userMessages = {};

async function deletePreviousMessage(bot, chatId, userId = null) {
    try {
        if (userId && userMessages[userId]) {
            const messageId = userMessages[userId];
            await bot.deleteMessage(chatId, messageId).catch(() => {});
            delete userMessages[userId];
        }
    } catch (error) {
        console.error('Error deleting message:', error);
    }
}

function trackMessage(userId, messageId) {
    userMessages[userId] = messageId;
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
    const secs = Math.floor(((seconds % 86400) % 3600) % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);
    
    return parts.join(' ') || '0s';
}

function formatCurrency(amount) {
    return `₹${amount.toFixed(2)}`;
}

function generateOrderId() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    return `SVH-${year}${month}${day}-${random}`;
}

function generateVoucherId() {
    return `VCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

function validateUTR(utr) {
    return /^[A-Z0-9]{6,30}$/.test(utr);
}

function validateUserId(userId) {
    return /^\d+$/.test(userId);
}

function validateAmount(amount) {
    const num = parseInt(amount);
    return !isNaN(num) && num > 0 && num <= 100000;
}

function validateQuantity(quantity, maxStock) {
    const qty = parseInt(quantity);
    return !isNaN(qty) && qty >= 1 && qty <= maxStock;
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(fn, maxAttempts = 3, delay = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxAttempts - 1) throw error;
            await sleep(delay * Math.pow(2, i));
        }
    }
}

function getTimeRemaining(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
}

function formatDate(date) {
    return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateShort(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function calculateDiscount(originalPrice, discountedPrice) {
    const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
    return Math.round(discount);
}

function getStatusEmoji(status) {
    const emojis = {
        'pending': '🔄',
        'pending_approval': '⏳',
        'processing': '⚙️',
        'delivered': '✅',
        'rejected': '❌',
        'refunded': '💰',
        'cancelled': '❌'
    };
    return emojis[status] || '❓';
}

function logError(error, context = '') {
    console.error(`[ERROR] ${context}:`, error);
    // You can also log to file here
}

module.exports = {
    deletePreviousMessage,
    trackMessage,
    formatUptime,
    formatCurrency,
    generateOrderId,
    generateVoucherId,
    validateUTR,
    validateUserId,
    validateAmount,
    validateQuantity,
    escapeMarkdown,
    chunkArray,
    sleep,
    retry,
    getTimeRemaining,
    formatDate,
    formatDateShort,
    calculateDiscount,
    getStatusEmoji,
    logError
};
