module.exports = {
  // Bot info
  BOT_NAME: 'SheinVoucherHub_Bot',
  BOT_USERNAME: '@SheinVoucherHub_Bot',
  
  // Status emojis
  STATUS: {
    PENDING: '⏳',
    SUCCESS: '✅',
    REJECTED: '❌',
    EXPIRED: '⌛'
  },
  
  // Warning messages
  WARNINGS: {
    FAKE_PAYMENT: '⚠️ Fake payments lead to permanent ban',
    ILLEGAL: '⚠️ Illegal messages = Permanent ban',
    RECOVERY: '⚠️ Recovery available for 2 hours only',
    NO_RETURNS: '⚠️ No returns. Refund only if out of stock'
  },
  
  // Error messages
  ERRORS: {
    GENERAL: 'An error occurred. Please try again later.',
    NOT_FOUND: 'Not found.',
    UNAUTHORIZED: '⛔ Unauthorized access',
    BLOCKED: '🚫 You are blocked from using this bot',
    INVALID_INPUT: '❌ Invalid input',
    NO_STOCK: '❌ Out of stock',
    EXPIRED: '⌛ This session has expired'
  },
  
  // Success messages
  SUCCESS: {
    ORDER_CREATED: '✅ Order created successfully',
    PAYMENT_RECEIVED: '✅ Payment received',
    CODES_SENT: '✅ Voucher codes sent',
    RECOVERY_SUCCESS: '✅ Recovery successful'
  },
  
  // Button texts
  BUTTONS: {
    BUY: '🛒 Buy Voucher',
    RECOVER: '🔁 Recover Vouchers',
    ORDERS: '📦 My Orders',
    DISCLAIMER: '📜 Disclaimer',
    SUPPORT: '🆘 Support',
    BACK: '↩️ Back',
    LEAVE: '⬅️ Leave',
    CONFIRM: '✅ Confirm',
    CANCEL: '❌ Cancel'
  },
  
  // Order ID prefix
  ORDER_PREFIX: 'SVH',
  
  // Recovery hours
  RECOVERY_HOURS: 2,
  
  // Block durations (minutes)
  BLOCK_DURATIONS: {
    FAKE_UTR: 30,
    REUSE_UTR: 60,
    ILLEGAL: 1440, // 24 hours
    SPAM: 15,
    DEFAULT: 30
  },
  
  // Price tiers
  PRICE_TIERS: {
    500: {
      base: 49,
      discount5: 249,
      discount10: 498,
      discount20: 996
    },
    1000: {
      base: 99,
      discount5: 499,
      discount10: 998,
      discount20: 1996
    },
    2000: {
      base: 199,
      discount5: 999,
      discount10: 1998,
      discount20: 3996
    },
    4000: {
      base: 299,
      discount5: 1499,
      discount10: 2998,
      discount20: 5996
    }
  }
};
