const constants = {
    // Bot Information
    BOT_NAME: 'Shein Voucher Hub',
    BOT_USERNAME: '@SheinVoucherHub_Bot',
    BOT_VERSION: '2.0.0',
    
    // Admin ID
    ADMIN_ID: process.env.ADMIN_ID || '8004114088',
    
    // Channel Links
    CHANNELS: {
        CHANNEL_1: 'https://t.me/SheinVoucherHub',
        CHANNEL_2: 'https://t.me/OrdersNotify'
    },
    
    // Messages
    MESSAGES: {
        WELCOME: `🎯 Welcome to Shein Voucher Hub!

🚀 Get exclusive Shein vouchers at the best prices!

📌 Choose an option below:`,
        
        JOIN_CHANNEL: `⚠️ Please join our channels first to use the bot:

📢 Channel 1: @SheinVoucherHub
📢 Channel 2: @OrdersNotify

After joining, click /start again.`,
        
        CAPTCHA: '🔐 Please solve this captcha to continue:',
        
        CATEGORY_SELECT: '🛒 Select voucher category:',
        
        QUANTITY_SELECT: (name, price, stock) => 
            `📦 Selected: ${name}\n💰 Price per code: ₹${price}\n📊 Available: ${stock}\n\nSelect quantity:`,
        
        PAYMENT: (category, quantity, total) => 
            `💳 Payment Details
━━━━━━━━━━━━━━━━━━━━━

📦 Category: ${category}
🔢 Quantity: ${quantity}
💰 Total: ₹${total}

⚠️ Please send payment screenshot and UTR number
❌ Fake payments will result in permanent ban!`,
        
        PAYMENT_SUCCESS: (orderId, amount, utr) => 
            `✅ Payment received! 
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Amount: ₹${amount}
UTR: ${utr}

Admin will verify your payment and deliver vouchers within 24 hours.

Thank you for your purchase! 🎉`,
        
        ORDER_DELIVERED: (orderId, category, quantity, codes) => 
            `✅ Order Delivered!
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Category: ${category}
Quantity: ${quantity}

Your vouchers:
${codes.map((v, i) => `${i+1}. ${v}`).join('\n')}

Thank you for shopping with us! 🎉`,
        
        ORDER_REJECTED: (orderId) => 
            `❌ Payment Rejected
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}

Your payment could not be verified.
Please contact support for assistance.

Reason: Invalid payment screenshot/UTR`,
        
        RECOVERY_REQUEST: `🔁 Recover Vouchers

Send your Order ID
Example: SVH-1234567890-ABC123

⚠️ Recovery available within 2 hours of purchase`,
        
        RECOVERY_SUCCESS: (orderId, code) => 
            `✅ Recovery Successful!
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}

New Voucher Code: ${code}

If you face any issues, contact support.`,
        
        RECOVERY_FAILED: (orderId) => 
            `❌ Recovery Failed
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}

We cannot recover your vouchers at this time.
Reason: Out of stock / Technical issue

Please contact support for assistance.`,
        
        NO_ORDERS: '📦 You don\'t have any orders yet.',
        
        ORDERS_LIST: '📦 Your Orders\n━━━━━━━━━━━━━━━━━━━━━\n\n',
        
        ORDER_DETAILS: (order) => 
            `📦 Order Details
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${order.order_id}
Date: ${new Date(order.order_date).toLocaleString()}
Category: ${order.category}
Quantity: ${order.quantity}
Total: ₹${order.total_price}
Status: ${order.status === 'delivered' ? '✅ Delivered' : '⏳ Pending'}`,
        
        DISCLAIMER: `📜 Disclaimer

• All coupons given are 100% OFF upto voucher amount with NO minimum order amount required.
• Contact Support if you're facing any issue with vouchers.
• Only replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.
• No returns.
• Refund will be only given if vouchers are out of stock.
• Fake payment attempts will result in permanent ban.`,
        
        SUPPORT: `🆘 Support

Send your message to admin.
Admin will reply as soon as possible.

⚠️ Please avoid spam, fake issues, or illegal content.
Violation may result in permanent ban.`,
        
        SUPPORT_SENT: '✅ Message sent to admin. You will get reply soon.',
        
        BLOCKED: `⛔ You are blocked from using this bot.
Contact @SheinVoucherHub for support.`,
        
        TEMP_BLOCKED: (hours) => 
            `⛔ You have been temporarily blocked for ${hours} hours.
Contact @SheinVoucherHub for appeal.`,
        
        MAINTENANCE: '⚠️ Bot is currently under maintenance. Please try again later.',
        
        INVALID_COMMAND: '❌ Invalid command. Please use the buttons below.',
        
        ORDER_NOT_FOUND: (orderId) => `⚠️ Order not found: ${orderId}`,
        
        EXPIRED_RECOVERY: '⏰ Recovery period expired (2 hours limit)',
        
        WRONG_USER: '❌ This order belongs to another user!',
        
        OUT_OF_STOCK: '❌ This category is out of stock!',
        
        INVALID_QUANTITY: (max) => `❌ Only ${max} codes available!`,
        
        INVALID_UTR: '❌ Invalid UTR format. Please enter a valid UTR number:',
        
        PAYMENT_PENDING: '⏳ Payment not yet verified. Please wait or contact support.',
        
        ADMIN_NEW_ORDER: (orderId, user, category, qty, amount, utr) => 
            `🆕 New Payment Pending
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
User: ${user}
Category: ${category}
Quantity: ${qty}
Amount: ₹${amount}
UTR: ${utr}

Approve to send vouchers:`,
        
        ADMIN_NEW_SUPPORT: (userId, username, message) => 
            `💬 Support Message
━━━━━━━━━━━━━━━━━━━━━

From: ${username}
User ID: ${userId}

Message: ${message}`,
        
        ADMIN_ORDER_NOTIFICATION: (order) => 
            `🎯 𝗡𝗲𝘄 𝗢𝗿𝗱𝗲𝗿 𝗦𝘂𝗯𝗺𝗶𝘁𝘁𝗲𝗱
━━━━━━━━━━━━━━━━━━━━━

╰➤👤 𝗨𝗦𝗘𝗥 𝗡𝗔𝗠𝗘 : @${order.username || 'N/A'}
╰➤🆔 𝗨𝗦𝗘𝗥 𝗜𝗗 : ${order.user_id}
╰➤📡 𝗦𝗧𝗔𝗧𝗨𝗦: ✅ Success
╰➤ 🔰𝗤𝗨𝗔𝗟𝗜𝗧𝗬: High 📶
╰➤ 📦𝗧𝗢𝗧𝗔𝗟 𝗤𝗨𝗔𝗡𝗧𝗜𝗧𝗬 : ${order.quantity}
╰➤ 💳𝗖𝗢𝗦𝗧 : ₹${order.total_price}

🤖𝗕𝗢𝗧 𝗡𝗔𝗠𝗘 : @SheinVoucherHub_Bot
━━━━━━━━━━━━━━━━━━━━━`
    },
    
    // Error Messages
    ERRORS: {
        DATABASE: '❌ Database error. Please try again later.',
        NETWORK: '❌ Network error. Please check your connection.',
        UNAUTHORIZED: '❌ Unauthorized access.',
        NOT_FOUND: '❌ Not found.',
        INVALID_INPUT: '❌ Invalid input. Please check and try again.',
        PAYMENT_FAILED: '❌ Payment failed. Please try again.',
        SERVER_ERROR: '❌ Server error. Admin has been notified.'
    },
    
    // Order Status
    ORDER_STATUS: {
        PENDING: 'pending',
        PAID: 'paid',
        DELIVERED: 'delivered',
        REJECTED: 'rejected',
        REFUNDED: 'refunded',
        EXPIRED: 'expired'
    },
    
    // User Roles
    USER_ROLES: {
        ADMIN: 'admin',
        MODERATOR: 'moderator',
        USER: 'user',
        VIP: 'vip',
        BANNED: 'banned'
    },
    
    // Payment Methods
    PAYMENT_METHODS: {
        MANUAL: 'manual',
        BARATPAY: 'baratpay',
        RAZORPAY: 'razorpay',
        PAYTM: 'paytm',
        UPI: 'upi'
    },
    
    // Captcha Types
    CAPTCHA_TYPES: {
        MATH: 'math',
        TEXT: 'text',
        MIXED: 'mixed',
        IMAGE: 'image'
    },
    
    // Time Constants (in milliseconds)
    TIME: {
        SECOND: 1000,
        MINUTE: 60 * 1000,
        HOUR: 60 * 60 * 1000,
        DAY: 24 * 60 * 60 * 1000,
        WEEK: 7 * 24 * 60 * 60 * 1000,
        MONTH: 30 * 24 * 60 * 60 * 1000
    },
    
    // Recovery Period (hours)
    RECOVERY_HOURS: 2,
    
    // Order ID Prefix
    ORDER_PREFIX: 'SVH',
    
    // Voucher ID Prefix
    VOUCHER_PREFIX: 'VCH',
    
    // Default Quantities
    DEFAULT_QUANTITIES: [1, 2, 3, 4, 5],
    
    // Max Quantity
    MAX_QUANTITY: 100,
    
    // Min Quantity
    MIN_QUANTITY: 1,
    
    // Pagination
    ITEMS_PER_PAGE: 10,
    
    // Rate Limits (requests per hour)
    RATE_LIMITS: {
        BUY: 5,
        RECOVER: 3,
        SUPPORT: 10,
        ORDER_CHECK: 20,
        GENERAL: 50
    },
    
    // Alert Thresholds
    ALERT_THRESHOLDS: {
        LOW_STOCK: 10,
        EXPIRY_DAYS: 7,
        ORDER_AMOUNT: 1000,
        PAYMENT_AMOUNT: 5000,
        DAILY_REVENUE: 10000
    },
    
    // File Types
    FILE_TYPES: {
        PHOTO: ['jpg', 'jpeg', 'png', 'gif'],
        VIDEO: ['mp4', 'avi', 'mov'],
        DOCUMENT: ['pdf', 'doc', 'docx', 'txt'],
        AUDIO: ['mp3', 'wav', 'ogg']
    },
    
    // Max File Size (in MB)
    MAX_FILE_SIZE: 20,
    
    // Currency Symbols
    CURRENCY_SYMBOLS: {
        INR: '₹',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥'
    },
    
    // Language Codes
    LANGUAGES: {
        EN: 'en',
        HI: 'hi',
        ES: 'es',
        FR: 'fr',
        DE: 'de',
        ZH: 'zh',
        JA: 'ja',
        RU: 'ru',
        AR: 'ar',
        PT: 'pt'
    },
    
    // Timezones
    TIMEZONES: [
        'UTC',
        'Asia/Kolkata',
        'Asia/Dubai',
        'Asia/Singapore',
        'America/New_York',
        'Europe/London',
        'Australia/Sydney'
    ],
    
    // Date Formats
    DATE_FORMATS: {
        'DD/MM/YYYY': 'DD/MM/YYYY',
        'MM/DD/YYYY': 'MM/DD/YYYY',
        'YYYY-MM-DD': 'YYYY-MM-DD',
        'DD-MM-YYYY': 'DD-MM-YYYY'
    },
    
    // Time Formats
    TIME_FORMATS: {
        '12H': 'hh:mm A',
        '24H': 'HH:mm'
    },
    
    // Export Formats
    EXPORT_FORMATS: ['csv', 'excel', 'pdf', 'json'],
    
    // Backup Settings
    BACKUP: {
        AUTO_BACKUP: true,
        BACKUP_INTERVAL: 24, // hours
        MAX_BACKUPS: 10,
        BACKUP_FORMAT: 'json'
    },
    
    // Log Settings
    LOGS: {
        MAX_LOG_AGE: 30, // days
        LOG_LEVELS: ['info', 'warning', 'error', 'debug']
    },
    
    // API Settings
    API: {
        RATE_LIMIT: 100, // requests per minute
        TOKEN_EXPIRY: 24, // hours
        VERSIONS: ['v1']
    },
    
    // Referral Settings
    REFERRAL: {
        ENABLED: true,
        BONUS_TYPE: 'fixed', // fixed or percentage
        BONUS_AMOUNT: 50,
        TIERS: [5, 10, 15, 20, 25]
    },
    
    // Discount Types
    DISCOUNT_TYPES: {
        PERCENTAGE: 'percentage',
        FIXED: 'fixed'
    },
    
    // Tax Types
    TAX_TYPES: {
        PERCENTAGE: 'percentage',
        FIXED: 'fixed'
    },
    
    // Notification Types
    NOTIFICATION_TYPES: {
        EMAIL: 'email',
        SMS: 'sms',
        TELEGRAM: 'telegram',
        PUSH: 'push'
    },
    
    // Report Types
    REPORT_TYPES: {
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
        YEARLY: 'yearly',
        CUSTOM: 'custom'
    },
    
    // Colors for UI
    COLORS: {
        SUCCESS: '✅',
        ERROR: '❌',
        WARNING: '⚠️',
        INFO: 'ℹ️',
        MONEY: '💰',
        ORDER: '📦',
        USER: '👤',
        STATS: '📊',
        SETTINGS: '⚙️',
        BACKUP: '🔄',
        LOCK: '🔒',
        UNLOCK: '🔓',
        TIME: '⏰',
        CALENDAR: '📅',
        CHART: '📈'
    }
};

module.exports = constants;
