module.exports = {
    // Bot info
    BOT_NAME: "SheinVoucherHub_Bot",
    BOT_USERNAME: "@SheinVoucherHub_Bot",
    
    // Admin ID
    ADMIN_ID: "8004114088",
    
    // Channels
    CHANNELS: [
        { name: "Channel 1", username: "@SheinVoucherHub", url: "https://t.me/SheinVoucherHub" },
        { name: "Channel 2", username: "@OrdersNotify", url: "https://t.me/OrdersNotify", id: "-1002862139182" }
    ],
    
    // Support
    SUPPORT_BOT: "@SheinSupportRobot",
    SUPPORT_URL: "https://t.me/SheinSupportRobot",
    
    // Payment
    QR_IMAGE: "https://i.supaimg.com/00332ad4-8aa7-408f-8705-55dbc91ea737.jpg",
    UPI_ID: "sheinvoucher@okhdfcbank",
    
    // Order settings
    ORDER_EXPIRE_HOURS: 2,
    MAX_RECOVERY_ATTEMPTS: 3,
    
    // Quantity limits
    MIN_QUANTITY: 1,
    MAX_QUANTITY: 100,
    
    // Price patterns
    PRICE_PATTERNS: {
        UNDER_100: "ends with 9",
        UNDER_1000: "ends with 99",
        OVER_1000: "ends with 999"
    },
    
    // Status messages
    STATUS: {
        PENDING: "⏳ Pending",
        SUCCESS: "✅ Success",
        REJECTED: "❌ Rejected",
        EXPIRED: "⌛ Expired"
    },
    
    // Error messages
    ERRORS: {
        NOT_MEMBER: "❌ Please join both channels first!",
        BLOCKED: "🚫 You are blocked from using this bot",
        INVALID_ORDER: "⚠️ Invalid Order ID",
        NO_STOCK: "❌ Out of stock",
        INSUFFICIENT_BALANCE: "❌ Insufficient balance",
        INVALID_QUANTITY: "❌ Invalid quantity",
        DUPLICATE_UTR: "⚠️ Duplicate UTR detected",
        FRAUD_ATTEMPT: "🚨 Fraud attempt detected"
    }
};
