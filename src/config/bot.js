const dotenv = require('dotenv');
dotenv.config();

const botConfig = {
    token: process.env.BOT_TOKEN,
    adminId: process.env.ADMIN_ID,
    channels: {
        channel1: process.env.CHANNEL_1,
        channel2: process.env.CHANNEL_2
    },
    sheetsId: process.env.GOOGLE_SHEETS_ID,
    paymentMethods: ['manual', 'baratpay'],
    captchaTypes: ['math', 'text', 'mixed', 'image'],
    recoveryHours: 2,
    orderPrefix: 'SVH',
    maxQuantity: 5,
    minQuantity: 1
};

module.exports = botConfig;
