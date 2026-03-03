const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { ORDER_PREFIX } = require('./constants');

const generateOrderId = () => {
    const date = moment().format('YYYYMMDD');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${ORDER_PREFIX}-${date}-${random}`;
};

const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
};

const calculatePrice = (basePrice, quantity) => {
    return basePrice * quantity;
};

const isValidUTR = (utr) => {
    // UTR validation logic
    return utr && utr.length >= 8 && /^[a-zA-Z0-9]+$/.test(utr);
};

const escapeMarkdown = (text) => {
    return text.replace(/[_*[\]()~>#+=|{}.!-]/g, '\\$&');
};

const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const isExpired = (timestamp, hours = 2) => {
    const expiryTime = moment(timestamp).add(hours, 'hours');
    return moment().isAfter(expiryTime);
};

const formatOrderMessage = (order) => {
    return `🧾 Order: ${order.order_id}
🎟 ${order.category_name} | Qty ${order.quantity}
💰 ${formatCurrency(order.total_price)} | ${order.status}
${order.voucher_codes ? `🔑 Code: \`${order.voucher_codes[0]}\`` : ''}`;
};

const formatNotificationMessage = (order, user) => {
    return `🎯 𝗡𝗲𝘄 𝗢𝗿𝗱𝗲𝗿 𝗦𝘂𝗯𝗺𝗶𝘁𝘁𝗲𝗱
━━━━━━━━━━━•❈•━━━━━━━━━━━
╰➤👤 𝗨𝗦𝗘𝗥 𝗡𝗔𝗠𝗘 : ${user.first_name || 'N/A'} ${user.last_name || ''}
╰➤🆔 𝗨𝗦𝗘𝗥 𝗜𝗗 : ${user.user_id}
╰➤📡 𝗦𝗧𝗔𝗧𝗨𝗦: ⏳ Pending
╰➤ 🔰𝗤𝗨𝗔𝗟𝗜𝗧𝗬: High 📶
╰➤ 📦𝗧𝗢𝗧𝗔𝗟 𝗤𝗨𝗔𝗡𝗧𝗜𝗧𝗬 : ${order.quantity}
╰➤ 💳𝗖𝗢𝗦𝗧 : ${formatCurrency(order.total_price)}

🤖𝗕𝗢𝗧 𝗡𝗔𝗠𝗘 : @SheinVoucherHub_Bot
━━━━━━━━━━━•❈•━━━━━━━━━━━`;
};

module.exports = {
    generateOrderId,
    formatCurrency,
    calculatePrice,
    isValidUTR,
    escapeMarkdown,
    chunkArray,
    sleep,
    isExpired,
    formatOrderMessage,
    formatNotificationMessage
};
