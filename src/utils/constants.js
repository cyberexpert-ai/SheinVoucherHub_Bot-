module.exports = {
    // Channel IDs
    CHANNELS: {
        MAIN: process.env.CHANNEL_1,
        NOTIFY: process.env.CHANNEL_2,
        NOTIFY_ID: process.env.CHANNEL_2_ID
    },

    // Admin ID
    ADMIN_ID: process.env.ADMIN_ID,

    // Payment QR Code
    PAYMENT_QR: 'https://i.supaimg.com/00332ad4-8aa7-408f-8705-55dbc91ea737.jpg',

    // Order ID Prefix
    ORDER_PREFIX: 'SVH',

    // Time constants (in milliseconds)
    TIME: {
        RECOVERY_EXPIRY: 2 * 60 * 60 * 1000, // 2 hours
        TEMP_BLOCK: 30 * 60 * 1000, // 30 minutes
        SESSION_TIMEOUT: 5 * 60 * 1000 // 5 minutes
    },

    // Status messages
    MESSAGES: {
        JOIN_REQUIRED: `👋 Welcome to Shein Codes Bot

📢 Please join @SheinVoucherHub to continue.

After joining, tap verify ✅`,

        WELCOME: `🎯 Welcome to Shein Voucher Hub!

🚀 Get exclusive Shein vouchers at the best prices!

📌 Choose an option below:`,

        DISCLAIMER: `📜 Disclaimer

All coupons given are 100% OFF upto voucher amount with NO minimum order amount required.

Contact Support if you're facing any issue with vouchers.

Only replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.

No returns.

Refund will be only given if vouchers are out of stock.`,

        NO_ORDERS: `📦 You don't have any orders yet.`,

        RECOVERY_PROMPT: `🔁 Recover Vouchers
Send your Order ID
Example: SVH-1234567890-ABC123`,

        SUPPORT: `🆘 Support
Please send your message. Our team will respond shortly.`,

        ORDER_NOT_FOUND: (orderId) => `⚠️ Order not found: ${orderId}`,

        ORDER_EXPIRED: (orderId) => `⚠️ Order ${orderId} has expired. Recovery window is 2 hours only.`,

        WRONG_ACCOUNT: `⚠️ This Order ID belongs to another account. Recovery is only allowed for the original purchaser.`,

        UTR_USED: `⚠️ This UTR number has already been used. Please provide a valid UTR.`,

        USER_BLOCKED: `🚫 You have been blocked from using this bot.\n\nReason: %reason%\n\nContact @SheinSupportRobot for assistance.`,

        TEMP_BLOCKED: (minutes) => `⏳ You are temporarily restricted for ${minutes} minutes.\n\nReason: %reason%\n\nPlease wait and try again later.`
    },

    // Button texts
    BUTTONS: {
        VERIFY: '✅ Verify',
        BACK: '↩️ Back',
        LEAVE: '↩️ Leave',
        COPY: '📋 Copy',
        PAID: '💰 Paid',
        ACCEPT: '✅ Accept',
        REJECT: '❌ Reject',
        CONFIRM: '✅ Confirm',
        CANCEL: '❌ Cancel'
    },

    // Admin commands
    ADMIN_COMMANDS: {
        ADMIN: 'admin',
        STATS: 'stats',
        USERS: 'users',
        ORDERS: 'orders',
        CATEGORY: 'category',
        VOUCHER: 'voucher',
        BROADCAST: 'broadcast',
        BLOCK: 'block',
        UNBLOCK: 'unblock'
    },

    // User commands
    USER_COMMANDS: {
        START: 'start',
        BUY: 'buy',
        ORDERS: 'orders',
        RECOVER: 'recover',
        SUPPORT: 'support',
        DISCLAIMER: 'disclaimer'
    },

    // Keyboard layouts
    KEYBOARD: {
        MAIN: [
            ['🛒 Buy Voucher', '🔁 Recover Vouchers'],
            ['📦 My Orders', '📜 Disclaimer'],
            ['🆘 Support']
        ],
        BACK: [['↩️ Back']],
        LEAVE: [['↩️ Leave']]
    }
};
