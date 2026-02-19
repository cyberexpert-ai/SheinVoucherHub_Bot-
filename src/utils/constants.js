module.exports = {
    // Bot Information
    BOT_NAME: 'Shein Voucher Hub',
    BOT_USERNAME: '@SheinVoucherHub_Bot',
    BOT_VERSION: '10.0.0',
    
    // Admin ID
    ADMIN_ID: process.env.ADMIN_ID || '8004114088',
    
    // Channel Links
    CHANNELS: {
        CHANNEL_1: process.env.CHANNEL_1 || '@SheinVoucherHub',
        CHANNEL_2: process.env.CHANNEL_2 || '@OrdersNotify'
    },
    
    // Support Bot
    SUPPORT_BOT: process.env.SUPPORT_BOT || '@SheinSupportRobot',
    
    // Payment QR
    PAYMENT_QR_URL: process.env.PAYMENT_QR_URL || 'https://i.supaimg.com/00332ad4-8aa7-408f-8705-55dbc91ea737.jpg',
    
    // Order Settings
    ORDER_PREFIX: 'SVH',
    VOUCHER_PREFIX: 'VCH',
    RECOVERY_HOURS: 2,
    
    // Quantity Options
    QUANTITY_OPTIONS: [1, 5, 10, 20],
    
    // Category Defaults
    DEFAULT_CATEGORIES: [
        { id: '1', name: '₹500 Shein Voucher', basePrice: 500 },
        { id: '2', name: '₹1000 Shein Voucher', basePrice: 1000 },
        { id: '3', name: '₹2000 Shein Voucher', basePrice: 2000 },
        { id: '4', name: '₹4000 Shein Voucher', basePrice: 4000 }
    ],
    
    // Default Price Tiers
    DEFAULT_PRICE_TIERS: {
        1: 0.06,  // 6% of base price
        5: 0.055, // 5.5% of base price
        10: 0.05, // 5% of base price
        20: 0.045 // 4.5% of base price
    },
    
    // Order Status
    ORDER_STATUS: {
        PENDING: 'pending',
        PENDING_APPROVAL: 'pending_approval',
        PROCESSING: 'processing',
        DELIVERED: 'delivered',
        REJECTED: 'rejected',
        REFUNDED: 'refunded',
        CANCELLED: 'cancelled'
    },
    
    // User Roles
    USER_ROLES: {
        ADMIN: 'admin',
        USER: 'user',
        BLOCKED: 'blocked'
    },
    
    // Button Labels
    BUTTONS: {
        BACK: '← Back',
        BACK_TO_MENU: '← Back to Menu',
        BACK_TO_CATEGORIES: '← Back to Categories',
        BACK_TO_ORDERS: '← Back to Orders',
        CONFIRM: '✅ Confirm',
        CANCEL: '❌ Cancel',
        APPROVE: '✅ Approve',
        REJECT: '❌ Reject',
        I_PAID: '✅ I have paid',
        OTHER_AMOUNT: 'Other amount'
    },
    
    // Error Messages
    ERRORS: {
        INVALID_AMOUNT: '❌ Invalid amount! Please enter a valid number.',
        INVALID_QUANTITY: '❌ Invalid quantity! Please enter a valid number.',
        INVALID_UTR: '❌ Invalid UTR format! UTR should be 6-30 alphanumeric characters.',
        INVALID_USER_ID: '❌ Invalid User ID!',
        INVALID_CATEGORY: '❌ Invalid category!',
        INVALID_ORDER: '❌ Invalid order!',
        INVALID_VOUCHER: '❌ Invalid voucher code!',
        
        OUT_OF_STOCK: '❌ This category is out of stock!',
        NOT_FOUND: '❌ Not found!',
        UNAUTHORIZED: '❌ Unauthorized!',
        BLOCKED: '⛔ You are blocked!',
        MAINTENANCE: '⚠️ Bot is under maintenance. Please try again later.',
        
        RECOVERY_NOT_FOUND: '⚠️ Order not found: ',
        RECOVERY_WRONG_USER: '❌ This order belongs to another user!',
        RECOVERY_NOT_DELIVERED: '❌ This order is not delivered yet!',
        RECOVERY_EXPIRED: '⏰ Recovery period expired (2 hours limit)'
    },
    
    // Success Messages
    SUCCESS: {
        ORDER_CREATED: '✅ Order created successfully!',
        PAYMENT_SUBMITTED: '✅ Payment proof submitted!',
        RECOVERY_REQUESTED: '✅ Recovery request sent to admin!',
        APPROVED: '✅ Approved!',
        REJECTED: '✅ Rejected!',
        DELIVERED: '✅ Vouchers delivered!'
    },
    
    // Info Messages
    INFO: {
        NO_ORDERS: '📦 You don\'t have any orders yet.',
        PROCESSING: '⏳ Processing your request...',
        WAITING: '⏳ Please wait...'
    },
    
    // Security
    SUSPICIOUS_UTR_PATTERNS: ['FAKE', 'TEST', 'DEMO', '123456', '000000'],
    MAX_WARNINGS: 3,
    
    // Time Constants (ms)
    TIME: {
        SECOND: 1000,
        MINUTE: 60 * 1000,
        HOUR: 60 * 60 * 1000,
        DAY: 24 * 60 * 60 * 1000,
        WEEK: 7 * 24 * 60 * 60 * 1000,
        MONTH: 30 * 24 * 60 * 60 * 1000
    },
    
    // Rate Limits
    RATE_LIMITS: {
        GENERAL: 30,
        LOGIN: 5,
        PAYMENT: 10
    }
};
