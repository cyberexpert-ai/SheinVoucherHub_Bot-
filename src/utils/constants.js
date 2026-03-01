module.exports = {
  // Bot messages
  WELCOME_MESSAGE: "🎯 Welcome to Shein Voucher Hub!\n\n🚀 Get exclusive Shein vouchers at the best prices!",
  
  // Error messages
  ERROR_GENERIC: "An error occurred. Please try again later.",
  ERROR_UNAUTHORIZED: "⛔ Unauthorized access.",
  
  // Status emojis
  STATUS_ACTIVE: "🟢",
  STATUS_INACTIVE: "🔴",
  STATUS_PENDING: "⏳",
  STATUS_SUCCESS: "✅",
  STATUS_FAILED: "❌",
  STATUS_BLOCKED: "⛔",
  
  // Order status
  ORDER_PENDING: "pending",
  ORDER_COMPLETED: "completed",
  ORDER_REJECTED: "rejected",
  ORDER_CANCELLED: "cancelled",
  
  // User status
  USER_ACTIVE: "active",
  USER_BLOCKED_PERMANENT: "blocked_permanent",
  USER_BLOCKED_TEMP: "blocked_temp",
  
  // Voucher status
  VOUCHER_AVAILABLE: "available",
  VOUCHER_SOLD: "sold",
  VOUCHER_EXPIRED: "expired",
  
  // Recovery window (hours)
  RECOVERY_WINDOW: 2,
  
  // Default quantity options
  QUANTITY_OPTIONS: [1, 2, 3, 4, 5, 10],
  
  // Price calculation formula
  PRICE_FORMULA: {
    500: { base: 49, discount: 0.5 },
    1000: { base: 99, discount: 0.5 },
    2000: { base: 199, discount: 0.5 },
    4000: { base: 299, discount: 0.5 }
  }
};
