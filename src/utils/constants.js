module.exports = {
    // Bot messages
    WELCOME_MESSAGE: `🎯 Welcome to Shein Voucher Hub!

🚀 Get exclusive Shein vouchers at the best prices!

📌 Choose an option below:`,

    JOIN_MESSAGE: `👋 Welcome to Shein Codes Bot

📢 Please join @SheinVoucherHub to continue.

After joining, tap verify ✅`,

    MAIN_MENU: {
        BUY: '🛒 Buy Voucher',
        RECOVER: '🔁 Recover Vouchers',
        ORDERS: '📦 My Orders',
        DISCLAIMER: '📜 Disclaimer',
        SUPPORT: '🆘 Support'
    },

    DISCLAIMER_TEXT: `📜 Disclaimer

✅ All coupons given are 100% OFF upto voucher amount with NO minimum order amount required.

🆘 Contact Support if you're facing any issue with vouchers.

⚠️ Only replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.

❌ No returns.

💰 Refund will be only given if vouchers are out of stock.`,

    ORDER_NOTIFICATION: `🎯 𝗡𝗲𝘄 𝗢𝗿𝗱𝗲𝗿 𝗦𝘂𝗯𝗺𝗶𝘁𝘁𝗲𝗱
━━━━━━━━━━━•❈•━━━━━━━━━━━
╰➤👤 𝗨𝗦𝗘𝗥 𝗡𝗔𝗠𝗘 : %s
╰➤🆔 𝗨𝗦𝗘𝗥 𝗜𝗗 : %s
╰➤📡 𝗦𝗧𝗔𝗧𝗨𝗦: ✅ Success
╰➤ 🔰𝗤𝗨𝗔𝗟𝗜𝗧𝗬: High 📶
╰➤ 📦𝗧𝗢𝗧𝗔𝗟 𝗤𝗨𝗔𝗡𝗧𝗜𝗧𝗬 : %d
╰➤ 💳𝗖𝗢𝗦𝗧 : %s

🤖𝗕𝗢𝗧 𝗡𝗔𝗠𝗘 : @SheinVoucherHub_Bot
━━━━━━━━━━━•❈•━━━━━━━━━━━`,

    // Payment QR
    PAYMENT_QR: process.env.PAYMENT_QR || 'https://i.supaimg.com/00332ad4-8aa7-408f-8705-55dbc91ea737.jpg',

    // Time constants
    RECOVERY_EXPIRY_HOURS: 2,
    TEMP_BLOCK_MINUTES: 30,
    MAX_WARNINGS: 3,

    // Channel IDs
    CHANNELS: {
        MAIN: '@SheinVoucherHub',
        NOTIFY: '@OrdersNotify'
    },

    // Order status
    ORDER_STATUS: {
        PENDING: 'pending',
        PROCESSING: 'processing',
        COMPLETED: 'completed',
        REJECTED: 'rejected',
        EXPIRED: 'expired'
    },

    // Warning types
    WARNING_TYPES: {
        FAKE_UTR: 'fake_utr',
        FAKE_RECOVERY: 'fake_recovery',
        ABUSE: 'abuse',
        SPAM: 'spam',
        OTHER: 'other'
    },

    // Button texts
    BUTTONS: {
        BACK: '↩️ Back',
        LEAVE: '↩️ Leave',
        VERIFY: '✅ Verify',
        PAID: '💰 I have paid',
        ACCEPT: '✅ Accept',
        REJECT: '❌ Reject',
        COPY: '📋 Copy Code'
    },

    // Error messages
    ERRORS: {
        BLOCKED: '⛔️ You are blocked from using this bot.',
        NOT_FOUND: '❌ Not found.',
        INVALID_INPUT: '❌ Invalid input. Please try again.',
        STOCK_EMPTY: '❌ Sorry, this category is out of stock.',
        ORDER_NOT_FOUND: '⚠️ Order not found: %s',
        NO_ORDERS: '📦 You don\'t have any orders yet.',
        UTR_EXISTS: '❌ This UTR/Transaction ID has already been used.',
        EXPIRED: '⏰ This recovery link has expired.'
    }
};
