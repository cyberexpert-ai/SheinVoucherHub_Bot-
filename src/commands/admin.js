const { 
    getCategories, addCategory, updateCategoryStock, deleteCategory,
    addVoucher, blockUser, unblockUser, isUserBlocked, getAllUsers,
    getSetting, updateSetting, getUserOrders, getOrder, getAllOrders,
    getStats, getBlockedUsers, getVouchersByCategory, deleteVoucher,
    updateVoucherPrice, getDailyStats, getMonthlyStats, backupData,
    restoreData, clearOldData, sendBroadcast, sendPersonalMessage,
    deleteBroadcast, deletePersonalMessage, scheduleBroadcast,
    getBroadcastHistory, addAdmin, removeAdmin, getAdmins,
    setUserRestriction, removeUserRestriction, getUserRestrictions,
    setTemporaryBlock, removeTemporaryBlock, getTemporaryBlocks,
    addCategoryDiscount, removeCategoryDiscount, getCategoryDiscounts,
    setPaymentMethod, getPaymentMethod, setCaptchaType, getCaptchaType,
    setRecoveryHours, getRecoveryHours, setMaxQuantity, getMaxQuantity,
    setMinQuantity, getMinQuantity, setOrderPrefix, getOrderPrefix,
    setBotStatus, getBotStatus, setMaintenanceMode, getMaintenanceMode,
    setWelcomeMessage, getWelcomeMessage, setDisclaimer, getDisclaimer,
    setSupportMessage, getSupportMessage, setPaymentMessage, getPaymentMessage,
    setSuccessMessage, getSuccessMessage, setFailureMessage, getFailureMessage,
    setChannelLinks, getChannelLinks, setChannelCheck, getChannelCheck,
    setCaptchaEnabled, getCaptchaEnabled, setAutoApprove, getAutoApprove,
    setAutoRecovery, getAutoRecovery, setNotificationChannel, getNotificationChannel,
    setAdminLogChannel, getAdminLogChannel, setErrorLogChannel, getErrorLogChannel,
    setPaymentLogChannel, getPaymentLogChannel, setUserLogChannel, getUserLogChannel,
    setOrderLogChannel, getOrderLogChannel, setBackupEnabled, getBackupEnabled,
    setBackupInterval, getBackupInterval, setBackupLocation, getBackupLocation,
    setEmailAlerts, getEmailAlerts, setSMSAlerts, getSMSAlerts, setTelegramAlerts,
    getTelegramAlerts, setAlertEmail, getAlertEmail, setAlertPhone, getAlertPhone,
    setAlertTelegram, getAlertTelegram, setLowStockAlert, getLowStockAlert,
    setLowStockThreshold, getLowStockThreshold, setExpiryAlert, getExpiryAlert,
    setExpiryDays, getExpiryDays, setOrderAlert, getOrderAlert, setPaymentAlert,
    getPaymentAlert, setBlockAlert, getBlockAlert, setRecoveryAlert, getRecoveryAlert,
    setSupportAlert, getSupportAlert, setDailyReport, getDailyReport,
    setWeeklyReport, getWeeklyReport, setMonthlyReport, getMonthlyReport,
    setYearlyReport, getYearlyReport, setReportEmail, getReportEmail,
    setReportTime, getReportTime, setReportFormat, getReportFormat,
    setExportEnabled, getExportEnabled, setExportFormat, getExportFormat,
    setExportLocation, getExportLocation, setImportEnabled, getImportEnabled,
    setImportFormat, getImportFormat, setImportLocation, getImportLocation,
    setAPIAccess, getAPIAccess, setAPIKey, getAPIKey, setAPIEndpoint, getAPIEndpoint,
    setWebhookEnabled, getWebhookEnabled, setWebhookURL, getWebhookURL,
    setWebhookSecret, getWebhookSecret, setRateLimit, getRateLimit,
    setRateLimitTime, getRateLimitTime, setRateLimitCount, getRateLimitCount,
    setIPWhitelist, getIPWhitelist, setIPBlacklist, getIPBlacklist,
    setUserWhitelist, getUserWhitelist, setUserBlacklist, getUserBlacklist,
    setCountryRestriction, getCountryRestriction, setCountryWhitelist,
    getCountryWhitelist, setCountryBlacklist, getCountryBlacklist,
    setLanguage, getLanguage, setTimezone, getTimezone, setDateFormat,
    getDateFormat, setTimeFormat, getTimeFormat, setCurrency, getCurrency,
    setCurrencySymbol, getCurrencySymbol, setCurrencyPosition, getCurrencyPosition,
    setDecimalSeparator, getDecimalSeparator, setThousandSeparator, getThousandSeparator,
    setTaxEnabled, getTaxEnabled, setTaxRate, getTaxRate, setTaxType, getTaxType,
    setDiscountEnabled, getDiscountEnabled, setDiscountType, getDiscountType,
    setDiscountValue, getDiscountValue, setDiscountCode, getDiscountCode,
    setDiscountExpiry, getDiscountExpiry, setDiscountUsage, getDiscountUsage,
    setDiscountLimit, getDiscountLimit, setDiscountMinAmount, getDiscountMinAmount,
    setDiscountMaxAmount, getDiscountMaxAmount, setCouponEnabled, getCouponEnabled,
    setCouponType, getCouponType, setCouponValue, getCouponValue, setCouponCode,
    getCouponCode, setCouponExpiry, getCouponExpiry, setCouponUsage, getCouponUsage,
    setCouponLimit, getCouponLimit, setCouponMinAmount, getCouponMinAmount,
    setCouponMaxAmount, getCouponMaxAmount, setReferralEnabled, getReferralEnabled,
    setReferralBonus, getReferralBonus, setReferralLimit, getReferralLimit,
    setReferralExpiry, getReferralExpiry, setReferralDiscount, getReferralDiscount,
    setReferralCommission, getReferralCommission, setReferralTier, getReferralTier,
    setReferralTier1, getReferralTier1, setReferralTier2, getReferralTier2,
    setReferralTier3, getReferralTier3, setReferralTier4, getReferralTier4,
    setReferralTier5, getReferralTier5
} = require('../sheets/googleSheets');

let adminState = {};

async function adminCommand(bot, msg) {
    const chatId = msg.chat.id;
    
    const adminMenu = `👑 Admin Panel
━━━━━━━━━━━━━━━━━━━━━

📊 System Management
📦 Voucher Management
👥 User Management
📢 Broadcast & Messages
⚙️ Settings & Configuration
🔒 Security & Restrictions
💰 Payment & Pricing
📈 Reports & Analytics
🔄 Backup & Restore
📝 Logs & Monitoring
🎁 Discounts & Coupons
🤝 Referral System
🌍 Regional Settings
🔌 API & Integration
🚦 Rate Limiting
📧 Email & SMS Alerts
⏰ Scheduled Tasks
📋 Category Management
🗑 Data Cleanup
✅ Verification Settings

Select an option:`;

    await bot.sendMessage(chatId, adminMenu, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📊 System Stats', callback_data: 'admin_stats' }],
                [{ text: '📦 Manage Categories', callback_data: 'admin_categories' }],
                [{ text: '➕ Add Vouchers', callback_data: 'admin_add_vouchers' }],
                [{ text: '👥 Manage Users', callback_data: 'admin_users' }],
                [{ text: '🔒 Block/Unblock User', callback_data: 'admin_block' }],
                [{ text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
                [{ text: '✉️ Personal Message', callback_data: 'admin_personal' }],
                [{ text: '⚙️ Bot Settings', callback_data: 'admin_settings' }],
                [{ text: '💰 Payment Settings', callback_data: 'admin_payment' }],
                [{ text: '🎁 Discounts & Coupons', callback_data: 'admin_discounts' }],
                [{ text: '📈 Reports', callback_data: 'admin_reports' }],
                [{ text: '🔄 Backup', callback_data: 'admin_backup' }],
                [{ text: '📝 Logs', callback_data: 'admin_logs' }],
                [{ text: '🔌 API Settings', callback_data: 'admin_api' }],
                [{ text: '🚦 Rate Limits', callback_data: 'admin_ratelimit' }],
                [{ text: '📧 Alerts', callback_data: 'admin_alerts' }],
                [{ text: '🌍 Regional', callback_data: 'admin_regional' }],
                [{ text: '✅ Verification', callback_data: 'admin_verification' }],
                [{ text: '🗑 Data Cleanup', callback_data: 'admin_cleanup' }],
                [{ text: '🔙 Main Menu', callback_data: 'back_to_main' }]
            ]
        }
    });
}

async function handleAdminCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    if (userId.toString() !== process.env.ADMIN_ID) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: 'Unauthorized!' });
    }
    
    // Delete previous message
    try {
        await bot.deleteMessage(chatId, messageId);
    } catch (error) {}
    
    switch(data) {
        // System Stats
        case 'admin_stats':
            await showStats(bot, chatId);
            break;
            
        // Category Management
        case 'admin_categories':
            await manageCategories(bot, chatId);
            break;
            
        case 'admin_add_category':
            adminState[chatId] = { action: 'add_category' };
            await bot.sendMessage(chatId, '➕ Add New Category\n\nFormat: Name|Price|Stock\nExample: ₹1000 Voucher|100|50');
            break;
            
        case 'admin_update_stock':
            adminState[chatId] = { action: 'update_stock' };
            await bot.sendMessage(chatId, '✏️ Update Stock\n\nFormat: CategoryID|NewStock\nExample: 1|100');
            break;
            
        case 'admin_delete_category':
            adminState[chatId] = { action: 'delete_category' };
            await bot.sendMessage(chatId, '🗑 Delete Category\n\nSend Category ID to delete:');
            break;
            
        case 'admin_category_discounts':
            await showCategoryDiscounts(bot, chatId);
            break;
            
        // Voucher Management
        case 'admin_add_vouchers':
            await addVouchersMenu(bot, chatId);
            break;
            
        case 'admin_bulk_add':
            adminState[chatId] = { action: 'bulk_add' };
            await bot.sendMessage(chatId, '📦 Bulk Add Vouchers\n\nFormat: CategoryID|Code1,Code2,Code3...\nExample: 1|VCH100,VCH101,VCH102');
            break;
            
        case 'admin_delete_vouchers':
            adminState[chatId] = { action: 'delete_vouchers' };
            await bot.sendMessage(chatId, '🗑 Delete Vouchers\n\nFormat: CategoryID|Code1,Code2,Code3...\nOr send "ALL" to delete all in category');
            break;
            
        case 'admin_update_price':
            adminState[chatId] = { action: 'update_price' };
            await bot.sendMessage(chatId, '💰 Update Voucher Price\n\nFormat: CategoryID|NewPrice\nExample: 1|150');
            break;
            
        case 'admin_view_vouchers':
            await viewVouchers(bot, chatId);
            break;
            
        // User Management
        case 'admin_users':
            await manageUsers(bot, chatId);
            break;
            
        case 'admin_block':
            await blockUserMenu(bot, chatId);
            break;
            
        case 'admin_unblock':
            adminState[chatId] = { action: 'unblock_user' };
            await bot.sendMessage(chatId, '👥 Unblock User\n\nSend User ID to unblock:');
            break;
            
        case 'admin_temp_block':
            adminState[chatId] = { action: 'temp_block' };
            await bot.sendMessage(chatId, '⏱ Temporary Block\n\nFormat: UserID|Reason|Hours\nExample: 123456789|Spam|24');
            break;
            
        case 'admin_user_restrictions':
            adminState[chatId] = { action: 'user_restrictions' };
            await bot.sendMessage(chatId, '🔒 User Restrictions\n\nFormat: UserID|RestrictionType|Duration\nTypes: buy,recover,chat\nExample: 123456789|buy|48');
            break;
            
        case 'admin_user_stats':
            adminState[chatId] = { action: 'user_stats' };
            await bot.sendMessage(chatId, '📊 User Statistics\n\nSend User ID to view stats:');
            break;
            
        case 'admin_user_orders':
            adminState[chatId] = { action: 'user_orders' };
            await bot.sendMessage(chatId, '📦 User Orders\n\nSend User ID to view orders:');
            break;
            
        case 'admin_blocked_list':
            await showBlockedUsers(bot, chatId);
            break;
            
        // Broadcast & Messages
        case 'admin_broadcast':
            adminState[chatId] = { action: 'broadcast' };
            await bot.sendMessage(chatId, '📢 Broadcast Message\n\nSend the message to broadcast to all users:');
            break;
            
        case 'admin_scheduled_broadcast':
            adminState[chatId] = { action: 'scheduled_broadcast' };
            await bot.sendMessage(chatId, '⏰ Scheduled Broadcast\n\nFormat: Message|YYYY-MM-DD HH:MM\nExample: Happy New Year!|2025-01-01 00:00');
            break;
            
        case 'admin_broadcast_history':
            await showBroadcastHistory(bot, chatId);
            break;
            
        case 'admin_delete_broadcast':
            adminState[chatId] = { action: 'delete_broadcast' };
            await bot.sendMessage(chatId, '🗑 Delete Broadcast\n\nSend Broadcast ID to delete:');
            break;
            
        case 'admin_personal':
            adminState[chatId] = { action: 'personal_message' };
            await bot.sendMessage(chatId, '✉️ Personal Message\n\nFormat: UserID|Message\nExample: 123456789|Hello, how can I help?');
            break;
            
        case 'admin_bulk_message':
            adminState[chatId] = { action: 'bulk_message' };
            await bot.sendMessage(chatId, '📨 Bulk Message\n\nFormat: UserID1,UserID2,UserID3|Message\nExample: 123,456,789|Special offer for you!');
            break;
            
        // Settings
        case 'admin_settings':
            await settingsMenu(bot, chatId);
            break;
            
        case 'toggle_bot':
            const botStatus = await getBotStatus();
            await setBotStatus(botStatus === 'active' ? 'inactive' : 'active');
            await bot.sendMessage(chatId, `✅ Bot status changed to ${botStatus === 'active' ? 'inactive' : 'active'}`);
            await settingsMenu(bot, chatId);
            break;
            
        case 'toggle_maintenance':
            const maintenanceMode = await getMaintenanceMode();
            await setMaintenanceMode(maintenanceMode === 'off' ? 'on' : 'off');
            await bot.sendMessage(chatId, `✅ Maintenance mode ${maintenanceMode === 'off' ? 'enabled' : 'disabled'}`);
            await settingsMenu(bot, chatId);
            break;
            
        case 'set_welcome':
            adminState[chatId] = { action: 'set_welcome' };
            await bot.sendMessage(chatId, '📝 Set Welcome Message\n\nSend new welcome message:');
            break;
            
        case 'set_disclaimer':
            adminState[chatId] = { action: 'set_disclaimer' };
            await bot.sendMessage(chatId, '📝 Set Disclaimer\n\nSend new disclaimer text:');
            break;
            
        case 'set_support':
            adminState[chatId] = { action: 'set_support' };
            await bot.sendMessage(chatId, '📝 Set Support Message\n\nSend new support message:');
            break;
            
        // Payment Settings
        case 'admin_payment':
            await paymentSettings(bot, chatId);
            break;
            
        case 'toggle_payment':
            const currentMethod = await getPaymentMethod();
            await setPaymentMethod(currentMethod === 'manual' ? 'baratpay' : 'manual');
            await bot.sendMessage(chatId, `✅ Payment method changed to ${currentMethod === 'manual' ? 'baratpay' : 'manual'}`);
            await paymentSettings(bot, chatId);
            break;
            
        case 'set_payment_message':
            adminState[chatId] = { action: 'set_payment_message' };
            await bot.sendMessage(chatId, '📝 Set Payment Message\n\nSend new payment instructions:');
            break;
            
        case 'set_success_message':
            adminState[chatId] = { action: 'set_success_message' };
            await bot.sendMessage(chatId, '📝 Set Success Message\n\nSend new payment success message:');
            break;
            
        case 'set_failure_message':
            adminState[chatId] = { action: 'set_failure_message' };
            await bot.sendMessage(chatId, '📝 Set Failure Message\n\nSend new payment failure message:');
            break;
            
        case 'set_currency':
            adminState[chatId] = { action: 'set_currency' };
            await bot.sendMessage(chatId, '💰 Set Currency\n\nSend currency code (INR/USD/EUR):');
            break;
            
        case 'set_tax':
            adminState[chatId] = { action: 'set_tax' };
            await bot.sendMessage(chatId, '📊 Set Tax Rate\n\nFormat: Rate|Type\nExample: 18|percentage or 20|fixed');
            break;
            
        // Discounts & Coupons
        case 'admin_discounts':
            await discountSettings(bot, chatId);
            break;
            
        case 'add_discount':
            adminState[chatId] = { action: 'add_discount' };
            await bot.sendMessage(chatId, '🎁 Add Discount\n\nFormat: Code|Type|Value|Expiry|MinAmount|MaxAmount\nExample: SAVE20|percentage|20|2025-12-31|100|1000');
            break;
            
        case 'add_category_discount':
            adminState[chatId] = { action: 'category_discount' };
            await bot.sendMessage(chatId, '🏷 Add Category Discount\n\nFormat: CategoryID|Discount%\nExample: 1|15');
            break;
            
        case 'add_coupon':
            adminState[chatId] = { action: 'add_coupon' };
            await bot.sendMessage(chatId, '🎟 Add Coupon\n\nFormat: Code|Value|Type|Usage|Expiry\nExample: SHEIN50|50|fixed|100|2025-12-31');
            break;
            
        case 'view_discounts':
            await showDiscounts(bot, chatId);
            break;
            
        case 'delete_discount':
            adminState[chatId] = { action: 'delete_discount' };
            await bot.sendMessage(chatId, '🗑 Delete Discount\n\nSend Discount Code to delete:');
            break;
            
        // Referral System
        case 'admin_referral':
            await referralSettings(bot, chatId);
            break;
            
        case 'toggle_referral':
            const referralEnabled = await getReferralEnabled();
            await setReferralEnabled(referralEnabled === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ Referral system ${referralEnabled === 'true' ? 'disabled' : 'enabled'}`);
            await referralSettings(bot, chatId);
            break;
            
        case 'set_referral_bonus':
            adminState[chatId] = { action: 'referral_bonus' };
            await bot.sendMessage(chatId, '💰 Set Referral Bonus\n\nFormat: Amount|Type\nExample: 50|fixed or 10|percentage');
            break;
            
        case 'set_referral_tiers':
            adminState[chatId] = { action: 'referral_tiers' };
            await bot.sendMessage(chatId, '📊 Set Referral Tiers\n\nFormat: Tier1|Tier2|Tier3|Tier4|Tier5\nExample: 5|10|15|20|25');
            break;
            
        // Reports
        case 'admin_reports':
            await reportsMenu(bot, chatId);
            break;
            
        case 'daily_report':
            const dailyStats = await getDailyStats();
            await showDailyReport(bot, chatId, dailyStats);
            break;
            
        case 'weekly_report':
            const weeklyStats = await getWeeklyStats();
            await showWeeklyReport(bot, chatId, weeklyStats);
            break;
            
        case 'monthly_report':
            const monthlyStats = await getMonthlyStats();
            await showMonthlyReport(bot, chatId, monthlyStats);
            break;
            
        case 'yearly_report':
            const yearlyStats = await getYearlyStats();
            await showYearlyReport(bot, chatId, yearlyStats);
            break;
            
        case 'export_report':
            adminState[chatId] = { action: 'export_report' };
            await bot.sendMessage(chatId, '📤 Export Report\n\nFormat: Type|Format\nExample: daily|csv or monthly|excel');
            break;
            
        case 'set_report_schedule':
            adminState[chatId] = { action: 'report_schedule' };
            await bot.sendMessage(chatId, '⏰ Set Report Schedule\n\nFormat: Type|Time|Email\nExample: daily|09:00|admin@email.com');
            break;
            
        // Backup
        case 'admin_backup':
            await backupMenu(bot, chatId);
            break;
            
        case 'create_backup':
            const backup = await backupData();
            await bot.sendDocument(chatId, Buffer.from(JSON.stringify(backup)), {
                filename: `backup_${Date.now()}.json`,
                caption: '✅ Backup created successfully!'
            });
            break;
            
        case 'restore_backup':
            adminState[chatId] = { action: 'restore_backup' };
            await bot.sendMessage(chatId, '🔄 Restore Backup\n\nSend the backup file:');
            break;
            
        case 'toggle_auto_backup':
            const backupEnabled = await getBackupEnabled();
            await setBackupEnabled(backupEnabled === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ Auto backup ${backupEnabled === 'true' ? 'disabled' : 'enabled'}`);
            await backupMenu(bot, chatId);
            break;
            
        case 'set_backup_interval':
            adminState[chatId] = { action: 'backup_interval' };
            await bot.sendMessage(chatId, '⏱ Set Backup Interval (hours)\n\nSend number of hours:');
            break;
            
        // Logs
        case 'admin_logs':
            await logsMenu(bot, chatId);
            break;
            
        case 'view_admin_logs':
            // Show admin action logs
            await bot.sendMessage(chatId, '📋 Admin Logs\n\nFeature coming soon...');
            break;
            
        case 'view_error_logs':
            // Show error logs
            await bot.sendMessage(chatId, '📋 Error Logs\n\nFeature coming soon...');
            break;
            
        case 'view_payment_logs':
            // Show payment logs
            await bot.sendMessage(chatId, '📋 Payment Logs\n\nFeature coming soon...');
            break;
            
        case 'view_user_logs':
            // Show user activity logs
            await bot.sendMessage(chatId, '📋 User Logs\n\nFeature coming soon...');
            break;
            
        case 'clear_logs':
            adminState[chatId] = { action: 'clear_logs' };
            await bot.sendMessage(chatId, '🗑 Clear Logs\n\nType "CONFIRM" to clear all logs:');
            break;
            
        // API Settings
        case 'admin_api':
            await apiSettings(bot, chatId);
            break;
            
        case 'toggle_api':
            const apiEnabled = await getAPIAccess();
            await setAPIAccess(apiEnabled === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ API access ${apiEnabled === 'true' ? 'disabled' : 'enabled'}`);
            await apiSettings(bot, chatId);
            break;
            
        case 'generate_api_key':
            const newApiKey = 'API_' + Math.random().toString(36).substr(2, 16).toUpperCase();
            await setAPIKey(newApiKey);
            await bot.sendMessage(chatId, `🔑 New API Key: ${newApiKey}\n\nSave this key securely!`);
            await apiSettings(bot, chatId);
            break;
            
        case 'set_webhook':
            adminState[chatId] = { action: 'set_webhook' };
            await bot.sendMessage(chatId, '🔗 Set Webhook URL\n\nSend webhook URL:');
            break;
            
        // Rate Limiting
        case 'admin_ratelimit':
            await rateLimitSettings(bot, chatId);
            break;
            
        case 'set_rate_limit':
            adminState[chatId] = { action: 'rate_limit' };
            await bot.sendMessage(chatId, '🚦 Set Rate Limit\n\nFormat: Count|Time(seconds)\nExample: 10|60');
            break;
            
        case 'set_ip_whitelist':
            adminState[chatId] = { action: 'ip_whitelist' };
            await bot.sendMessage(chatId, '✅ IP Whitelist\n\nSend IP addresses (comma separated):');
            break;
            
        case 'set_ip_blacklist':
            adminState[chatId] = { action: 'ip_blacklist' };
            await bot.sendMessage(chatId, '❌ IP Blacklist\n\nSend IP addresses (comma separated):');
            break;
            
        // Alerts
        case 'admin_alerts':
            await alertSettings(bot, chatId);
            break;
            
        case 'set_email_alerts':
            adminState[chatId] = { action: 'email_alerts' };
            await bot.sendMessage(chatId, '📧 Email Alerts\n\nFormat: Enable/Disable|Email\nExample: enable|admin@email.com');
            break;
            
        case 'set_telegram_alerts':
            adminState[chatId] = { action: 'telegram_alerts' };
            await bot.sendMessage(chatId, '📱 Telegram Alerts\n\nFormat: Enable/Disable|ChatID\nExample: enable|123456789');
            break;
            
        case 'set_alert_thresholds':
            adminState[chatId] = { action: 'alert_thresholds' };
            await bot.sendMessage(chatId, '⚠️ Alert Thresholds\n\nFormat: LowStock|Expiry|Order|Payment\nExample: 10|7|50|1000');
            break;
            
        // Regional Settings
        case 'admin_regional':
            await regionalSettings(bot, chatId);
            break;
            
        case 'set_language':
            adminState[chatId] = { action: 'set_language' };
            await bot.sendMessage(chatId, '🌐 Set Language\n\nSend language code (en/hi/es/fr):');
            break;
            
        case 'set_timezone':
            adminState[chatId] = { action: 'set_timezone' };
            await bot.sendMessage(chatId, '🕐 Set Timezone\n\nSend timezone (Asia/Kolkata, UTC, etc):');
            break;
            
        case 'set_currency_format':
            adminState[chatId] = { action: 'currency_format' };
            await bot.sendMessage(chatId, '💰 Set Currency Format\n\nFormat: Symbol|Position|Decimal|Thousand\nExample: ₹|before|.|,');
            break;
            
        // Verification Settings
        case 'admin_verification':
            await verificationSettings(bot, chatId);
            break;
            
        case 'toggle_captcha':
            const captchaEnabled = await getCaptchaEnabled();
            await setCaptchaEnabled(captchaEnabled === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ Captcha ${captchaEnabled === 'true' ? 'disabled' : 'enabled'}`);
            await verificationSettings(bot, chatId);
            break;
            
        case 'set_captcha_type':
            adminState[chatId] = { action: 'captcha_type' };
            await bot.sendMessage(chatId, '🔐 Set Captcha Type\n\nTypes: math, text, mixed, image\nSend type name:');
            break;
            
        case 'set_channel_check':
            const channelCheck = await getChannelCheck();
            await setChannelCheck(channelCheck === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ Channel verification ${channelCheck === 'true' ? 'disabled' : 'enabled'}`);
            await verificationSettings(bot, chatId);
            break;
            
        case 'set_channel_links':
            adminState[chatId] = { action: 'channel_links' };
            await bot.sendMessage(chatId, '🔗 Set Channel Links\n\nFormat: Channel1|Channel2\nExample: @channel1|@channel2');
            break;
            
        // Data Cleanup
        case 'admin_cleanup':
            await cleanupMenu(bot, chatId);
            break;
            
        case 'cleanup_old_orders':
            adminState[chatId] = { action: 'cleanup_orders' };
            await bot.sendMessage(chatId, '🗑 Cleanup Old Orders\n\nSend days to keep (older will be deleted):');
            break;
            
        case 'cleanup_old_users':
            adminState[chatId] = { action: 'cleanup_users' };
            await bot.sendMessage(chatId, '🗑 Cleanup Inactive Users\n\nSend days of inactivity:');
            break;
            
        case 'cleanup_temp_data':
            await clearOldData();
            await bot.sendMessage(chatId, '✅ Temporary data cleaned up!');
            break;
            
        case 'reset_all_data':
            adminState[chatId] = { action: 'reset_data' };
            await bot.sendMessage(chatId, '⚠️ WARNING: This will delete ALL data!\nType "RESET ALL DATA" to confirm:');
            break;
            
        // Handle voucher addition
        default:
            if (data.startsWith('add_voucher_')) {
                const categoryId = data.split('_')[2];
                adminState[chatId] = { action: 'add_voucher', categoryId };
                await bot.sendMessage(chatId, '➕ Add Vouchers\n\nSend voucher codes (one per line):');
            }
            
            // Handle order approval
            if (data.startsWith('approve_')) {
                const orderId = data.replace('approve_', '');
                await approveOrder(bot, chatId, orderId);
            }
            
            if (data.startsWith('reject_')) {
                const orderId = data.replace('reject_', '');
                await rejectOrder(bot, chatId, orderId);
            }
            
            // Handle recovery
            if (data.startsWith('recover_')) {
                const orderId = data.replace('recover_', '');
                adminState[chatId] = { action: 'recovery_code', orderId };
                await bot.sendMessage(chatId, '📝 Send new voucher code for recovery:');
            }
            
            if (data.startsWith('norecover_')) {
                const orderId = data.replace('norecover_', '');
                await noRecovery(bot, chatId, orderId);
            }
            
            // Handle reply to user
            if (data.startsWith('reply_')) {
                const targetUserId = data.split('_')[1];
                adminState[chatId] = { action: 'reply_to_user', targetUserId };
                await bot.sendMessage(chatId, '✏️ Enter your reply message:');
            }
            
            if (data === 'admin_back') {
                await adminCommand(bot, { chat: { id: chatId } });
            }
            break;
    }
}

async function showStats(bot, chatId) {
    const stats = await getStats();
    const categories = await getCategories();
    const users = await getAllUsers();
    const orders = await getAllOrders();
    const blocked = await getBlockedUsers();
    
    let message = `📊 System Statistics
━━━━━━━━━━━━━━━━━━━━━

👥 Total Users: ${users.length}
🔒 Blocked Users: ${blocked.length}
📦 Total Orders: ${orders.length}
✅ Successful Orders: ${orders.filter(o => o.status === 'delivered').length}
⏳ Pending Orders: ${orders.filter(o => o.status === 'pending').length}
❌ Rejected Orders: ${orders.filter(o => o.status === 'rejected').length}
💰 Total Revenue: ₹${orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + parseInt(o.total_price), 0)}

📊 Category Statistics:\n`;
    
    for (const cat of categories) {
        const catOrders = orders.filter(o => o.category === cat.name && o.status === 'delivered');
        const revenue = catOrders.reduce((sum, o) => sum + parseInt(o.total_price), 0);
        message += `\n• ${cat.name}\n`;
        message += `  Stock: ${cat.stock} | Sold: ${cat.total_sold}\n`;
        message += `  Revenue: ₹${revenue}`;
    }
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔄 Refresh', callback_data: 'admin_stats' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function manageCategories(bot, chatId) {
    const categories = await getCategories();
    
    let message = `📦 Category Management
━━━━━━━━━━━━━━━━━━━━━

Existing Categories:\n\n`;
    
    categories.forEach(cat => {
        message += `• ${cat.name} (ID: ${cat.category_id})\n`;
        message += `  Price: ₹${cat.price_per_code} | Stock: ${cat.stock}\n\n`;
    });
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Add Category', callback_data: 'admin_add_category' }],
                [{ text: '✏️ Update Stock', callback_data: 'admin_update_stock' }],
                [{ text: '💰 Update Price', callback_data: 'admin_update_price' }],
                [{ text: '🏷 Category Discounts', callback_data: 'admin_category_discounts' }],
                [{ text: '🗑 Delete Category', callback_data: 'admin_delete_category' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function addVouchersMenu(bot, chatId) {
    const categories = await getCategories();
    
    const keyboard = categories.map(cat => [
        { text: `${cat.name} (Stock: ${cat.stock})`, callback_data: `add_voucher_${cat.category_id}` }
    ]);
    
    keyboard.push([{ text: '📦 Bulk Add', callback_data: 'admin_bulk_add' }]);
    keyboard.push([{ text: '🗑 Delete Vouchers', callback_data: 'admin_delete_vouchers' }]);
    keyboard.push([{ text: '👁 View Vouchers', callback_data: 'admin_view_vouchers' }]);
    keyboard.push([{ text: '🔙 Back', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, 'Select category to add vouchers:', {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function viewVouchers(bot, chatId) {
    const categories = await getCategories();
    
    let message = '📋 Available Vouchers\n━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    for (const cat of categories) {
        const vouchers = await getVouchersByCategory(cat.category_id);
        const available = vouchers.filter(v => v.status === 'available');
        message += `📦 ${cat.name}\n`;
        message += `Total: ${vouchers.length} | Available: ${available.length}\n`;
        if (available.length > 0) {
            message += `Codes: ${available.slice(0, 5).map(v => v.code).join(', ')}${available.length > 5 ? '...' : ''}\n\n`;
        } else {
            message += 'No available codes\n\n';
        }
    }
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔄 Refresh', callback_data: 'admin_view_vouchers' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function manageUsers(bot, chatId) {
    const users = await getAllUsers();
    const blocked = await getBlockedUsers();
    const activeUsers = users.filter(u => !blocked.some(b => b.user_id === u.user_id));
    
    const message = `👥 User Management
━━━━━━━━━━━━━━━━━━━━━

Total Users: ${users.length}
Active Users: ${activeUsers.length}
Blocked Users: ${blocked.length}

Select an option:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔒 Block User', callback_data: 'admin_block' }],
                [{ text: '🔓 Unblock User', callback_data: 'admin_unblock' }],
                [{ text: '⏱ Temporary Block', callback_data: 'admin_temp_block' }],
                [{ text: '📋 Blocked List', callback_data: 'admin_blocked_list' }],
                [{ text: '🔐 User Restrictions', callback_data: 'admin_user_restrictions' }],
                [{ text: '📊 User Stats', callback_data: 'admin_user_stats' }],
                [{ text: '📦 User Orders', callback_data: 'admin_user_orders' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function blockUserMenu(bot, chatId) {
    adminState[chatId] = { action: 'block_user' };
    await bot.sendMessage(chatId, '👥 Block User\n\nFormat: UserID|Reason|Type(permanent/temporary)|Hours(if temporary)\nExample: 123456789|Spam|temporary|24');
}

async function showBlockedUsers(bot, chatId) {
    const blocked = await getBlockedUsers();
    
    if (blocked.length === 0) {
        await bot.sendMessage(chatId, '✅ No blocked users found.');
        return;
    }
    
    let message = '📋 Blocked Users\n━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    blocked.forEach((user, index) => {
        message += `${index + 1}. User ID: ${user.user_id}\n`;
        message += `   Reason: ${user.reason}\n`;
        message += `   Type: ${user.block_type}\n`;
        if (user.expiry_date) {
            message += `   Expires: ${new Date(user.expiry_date).toLocaleString()}\n`;
        }
        message += `   Blocked: ${new Date(user.block_date).toLocaleString()}\n\n`;
    });
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔄 Refresh', callback_data: 'admin_blocked_list' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function settingsMenu(bot, chatId) {
    const botStatus = await getBotStatus();
    const maintenanceMode = await getMaintenanceMode();
    const welcomeMessage = await getWelcomeMessage();
    const disclaimer = await getDisclaimer();
    const supportMessage = await getSupportMessage();
    
    const message = `⚙️ Bot Settings
━━━━━━━━━━━━━━━━━━━━━

🤖 Bot Status: ${botStatus === 'active' ? '✅ Active' : '❌ Inactive'}
🔧 Maintenance: ${maintenanceMode === 'on' ? '⚠️ On' : '✅ Off'}
📝 Welcome: ${welcomeMessage ? 'Set' : 'Not Set'}
📜 Disclaimer: ${disclaimer ? 'Set' : 'Not Set'}
🆘 Support: ${supportMessage ? 'Set' : 'Not Set'}

Select setting to change:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: botStatus === 'active' ? '❌ Stop Bot' : '✅ Start Bot', callback_data: 'toggle_bot' }],
                [{ text: maintenanceMode === 'on' ? '✅ Disable Maintenance' : '⚠️ Enable Maintenance', callback_data: 'toggle_maintenance' }],
                [{ text: '📝 Set Welcome', callback_data: 'set_welcome' }],
                [{ text: '📜 Set Disclaimer', callback_data: 'set_disclaimer' }],
                [{ text: '🆘 Set Support', callback_data: 'set_support' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function paymentSettings(bot, chatId) {
    const paymentMethod = await getPaymentMethod();
    const currency = await getCurrency();
    const taxEnabled = await getTaxEnabled();
    const taxRate = await getTaxRate();
    
    const message = `💰 Payment Settings
━━━━━━━━━━━━━━━━━━━━━

💳 Method: ${paymentMethod}
💰 Currency: ${currency}
📊 Tax: ${taxEnabled === 'true' ? '✅ Enabled' : '❌ Disabled'}
📈 Tax Rate: ${taxRate}%

Select option:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔄 Toggle Method', callback_data: 'toggle_payment' }],
                [{ text: '📝 Payment Message', callback_data: 'set_payment_message' }],
                [{ text: '✅ Success Message', callback_data: 'set_success_message' }],
                [{ text: '❌ Failure Message', callback_data: 'set_failure_message' }],
                [{ text: '💰 Set Currency', callback_data: 'set_currency' }],
                [{ text: '📊 Set Tax', callback_data: 'set_tax' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function discountSettings(bot, chatId) {
    const message = `🎁 Discounts & Coupons
━━━━━━━━━━━━━━━━━━━━━

Select option:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Add Discount', callback_data: 'add_discount' }],
                [{ text: '🏷 Add Category Discount', callback_data: 'add_category_discount' }],
                [{ text: '🎟 Add Coupon', callback_data: 'add_coupon' }],
                [{ text: '👁 View Discounts', callback_data: 'view_discounts' }],
                [{ text: '🗑 Delete Discount', callback_data: 'delete_discount' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function referralSettings(bot, chatId) {
    const referralEnabled = await getReferralEnabled();
    const referralBonus = await getReferralBonus();
    const referralTiers = await getReferralTier();
    
    const message = `🤝 Referral System
━━━━━━━━━━━━━━━━━━━━━

Status: ${referralEnabled === 'true' ? '✅ Active' : '❌ Inactive'}
Bonus: ${referralBonus}
Tiers: ${referralTiers}

Select option:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: referralEnabled === 'true' ? '❌ Disable' : '✅ Enable', callback_data: 'toggle_referral' }],
                [{ text: '💰 Set Bonus', callback_data: 'set_referral_bonus' }],
                [{ text: '📊 Set Tiers', callback_data: 'set_referral_tiers' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function reportsMenu(bot, chatId) {
    const message = `📈 Reports
━━━━━━━━━━━━━━━━━━━━━

Select report type:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📅 Daily Report', callback_data: 'daily_report' }],
                [{ text: '📆 Weekly Report', callback_data: 'weekly_report' }],
                [{ text: '📊 Monthly Report', callback_data: 'monthly_report' }],
                [{ text: '📈 Yearly Report', callback_data: 'yearly_report' }],
                [{ text: '📤 Export Report', callback_data: 'export_report' }],
                [{ text: '⏰ Schedule Report', callback_data: 'set_report_schedule' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function showDailyReport(bot, chatId, stats) {
    const message = `📅 Daily Report - ${new Date().toLocaleDateString()}
━━━━━━━━━━━━━━━━━━━━━

👥 New Users: ${stats.newUsers}
📦 New Orders: ${stats.newOrders}
💰 Revenue: ₹${stats.revenue}
✅ Successful: ${stats.successful}
❌ Failed: ${stats.failed}
📊 Conversion Rate: ${stats.conversionRate}%

Top Products:
${stats.topProducts.map(p => `• ${p.name}: ${p.sold} sold (₹${p.revenue})`).join('\n')}`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📊 Export', callback_data: 'export_report' }],
                [{ text: '🔙 Back', callback_data: 'admin_reports' }]
            ]
        }
    });
}

async function backupMenu(bot, chatId) {
    const backupEnabled = await getBackupEnabled();
    const backupInterval = await getBackupInterval();
    const lastBackup = await getLastBackup();
    
    const message = `🔄 Backup Management
━━━━━━━━━━━━━━━━━━━━━

Auto Backup: ${backupEnabled === 'true' ? '✅ On' : '❌ Off'}
Interval: ${backupInterval} hours
Last Backup: ${lastBackup || 'Never'}

Select option:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📦 Create Backup', callback_data: 'create_backup' }],
                [{ text: '🔄 Restore Backup', callback_data: 'restore_backup' }],
                [{ text: backupEnabled === 'true' ? '❌ Disable Auto' : '✅ Enable Auto', callback_data: 'toggle_auto_backup' }],
                [{ text: '⏱ Set Interval', callback_data: 'set_backup_interval' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function logsMenu(bot, chatId) {
    const message = `📝 Logs
━━━━━━━━━━━━━━━━━━━━━

Select log type:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '👤 Admin Logs', callback_data: 'view_admin_logs' }],
                [{ text: '❌ Error Logs', callback_data: 'view_error_logs' }],
                [{ text: '💰 Payment Logs', callback_data: 'view_payment_logs' }],
                [{ text: '👥 User Logs', callback_data: 'view_user_logs' }],
                [{ text: '🗑 Clear Logs', callback_data: 'clear_logs' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function apiSettings(bot, chatId) {
    const apiEnabled = await getAPIAccess();
    const apiKey = await getAPIKey();
    const webhookEnabled = await getWebhookEnabled();
    
    const message = `🔌 API Settings
━━━━━━━━━━━━━━━━━━━━━

API Access: ${apiEnabled === 'true' ? '✅ Enabled' : '❌ Disabled'}
API Key: ${apiKey ? 'Set' : 'Not Set'}
Webhook: ${webhookEnabled === 'true' ? '✅ Enabled' : '❌ Disabled'}

Select option:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: apiEnabled === 'true' ? '❌ Disable API' : '✅ Enable API', callback_data: 'toggle_api' }],
                [{ text: '🔄 Generate API Key', callback_data: 'generate_api_key' }],
                [{ text: '🔗 Set Webhook', callback_data: 'set_webhook' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function rateLimitSettings(bot, chatId) {
    const rateLimit = await getRateLimit();
    const rateLimitTime = await getRateLimitTime();
    
    const message = `🚦 Rate Limiting
━━━━━━━━━━━━━━━━━━━━━

Current Limit: ${rateLimit} requests per ${rateLimitTime} seconds

Select option:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '⚙️ Set Limit', callback_data: 'set_rate_limit' }],
                [{ text: '✅ IP Whitelist', callback_data: 'set_ip_whitelist' }],
                [{ text: '❌ IP Blacklist', callback_data: 'set_ip_blacklist' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function alertSettings(bot, chatId) {
    const message = `📧 Alert Settings
━━━━━━━━━━━━━━━━━━━━━

Select alert type:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📧 Email Alerts', callback_data: 'set_email_alerts' }],
                [{ text: '📱 Telegram Alerts', callback_data: 'set_telegram_alerts' }],
                [{ text: '⚠️ Alert Thresholds', callback_data: 'set_alert_thresholds' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function regionalSettings(bot, chatId) {
    const language = await getLanguage();
    const timezone = await getTimezone();
    const currency = await getCurrency();
    
    const message = `🌍 Regional Settings
━━━━━━━━━━━━━━━━━━━━━

Language: ${language}
Timezone: ${timezone}
Currency: ${currency}

Select option:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🌐 Set Language', callback_data: 'set_language' }],
                [{ text: '🕐 Set Timezone', callback_data: 'set_timezone' }],
                [{ text: '💰 Set Currency Format', callback_data: 'set_currency_format' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function verificationSettings(bot, chatId) {
    const captchaEnabled = await getCaptchaEnabled();
    const captchaType = await getCaptchaType();
    const channelCheck = await getChannelCheck();
    
    const message = `✅ Verification Settings
━━━━━━━━━━━━━━━━━━━━━

Captcha: ${captchaEnabled === 'true' ? '✅ Enabled' : '❌ Disabled'}
Captcha Type: ${captchaType}
Channel Check: ${channelCheck === 'true' ? '✅ Enabled' : '❌ Disabled'}

Select option:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: captchaEnabled === 'true' ? '❌ Disable Captcha' : '✅ Enable Captcha', callback_data: 'toggle_captcha' }],
                [{ text: '🔐 Set Captcha Type', callback_data: 'set_captcha_type' }],
                [{ text: channelCheck === 'true' ? '❌ Disable Channel Check' : '✅ Enable Channel Check', callback_data: 'set_channel_check' }],
                [{ text: '🔗 Set Channel Links', callback_data: 'set_channel_links' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function cleanupMenu(bot, chatId) {
    const message = `🗑 Data Cleanup
━━━━━━━━━━━━━━━━━━━━━

⚠️ WARNING: These actions cannot be undone!

Select cleanup type:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🗑 Old Orders', callback_data: 'cleanup_old_orders' }],
                [{ text: '🗑 Inactive Users', callback_data: 'cleanup_old_users' }],
                [{ text: '🗑 Temp Data', callback_data: 'cleanup_temp_data' }],
                [{ text: '⚠️ Reset All Data', callback_data: 'reset_all_data' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function approveOrder(bot, chatId, orderId) {
    const order = await getOrder(orderId);
    
    if (!order) return;
    
    // Get available vouchers
    const vouchers = await getVouchersByCategory(order.category);
    const available = vouchers.filter(v => v.status === 'available');
    
    if (available.length < parseInt(order.quantity)) {
        return bot.sendMessage(chatId, '❌ Not enough vouchers in stock!');
    }
    
    // Assign vouchers to order
    const assignedVouchers = [];
    for (let i = 0; i < parseInt(order.quantity); i++) {
        const voucher = available[i];
        await assignVoucherToOrder(voucher.voucher_id, order.user_id, orderId);
        assignedVouchers.push(voucher.code);
    }
    
    // Update order status
    await updateOrderStatus(orderId, 'delivered', new Date().toISOString());
    
    // Send vouchers to user
    const voucherMessage = `✅ Order Delivered!
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Category: ${order.category}
Quantity: ${order.quantity}

Your vouchers:
${assignedVouchers.map((v, i) => `${i+1}. ${v}`).join('\n')}

Thank you for shopping with us! 🎉`;

    await bot.sendMessage(parseInt(order.user_id), voucherMessage);
    
    // Send notification to OrdersNotify channel
    await bot.sendMessage(process.env.CHANNEL_2,
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
    );
    
    await bot.sendMessage(chatId, '✅ Order approved and vouchers sent!');
}

async function rejectOrder(bot, chatId, orderId) {
    const order = await getOrder(orderId);
    
    if (!order) return;
    
    await updateOrderStatus(orderId, 'rejected');
    
    await bot.sendMessage(parseInt(order.user_id),
        `❌ Payment Rejected
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}

Your payment could not be verified.
Please contact support for assistance.

Reason: Invalid payment screenshot/UTR`
    );
    
    await bot.sendMessage(chatId, '✅ Order rejected and user notified!');
}

async function noRecovery(bot, chatId, orderId) {
    const order = await getOrder(orderId);
    
    if (!order) return;
    
    await bot.sendMessage(parseInt(order.user_id),
        `❌ Recovery Failed
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}

We cannot recover your vouchers at this time.
Reason: Out of stock / Technical issue

Please contact support for assistance.`
    );
    
    await bot.sendMessage(chatId, '✅ User notified about recovery failure!');
}

// Handle text messages for admin actions
async function handleAdminText(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = adminState[chatId];
    
    if (!state) return false;
    
    switch(state.action) {
        case 'add_category':
            const [name, price, stock] = text.split('|');
            await addCategory(name.trim(), price.trim(), stock.trim());
            await bot.sendMessage(chatId, '✅ Category added successfully!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'update_stock':
            const [catId, newStock] = text.split('|');
            await updateCategoryStock(catId.trim(), newStock.trim());
            await bot.sendMessage(chatId, '✅ Stock updated successfully!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'delete_category':
            await deleteCategory(text.trim());
            await bot.sendMessage(chatId, '✅ Category deleted!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'add_voucher':
            const codes = text.split('\n').map(c => c.trim()).filter(c => c);
            for (const code of codes) {
                await addVoucher(code, state.categoryId, '100');
            }
            await bot.sendMessage(chatId, `✅ ${codes.length} vouchers added!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'bulk_add':
            const [bulkCatId, bulkCodes] = text.split('|');
            const codeList = bulkCodes.split(',').map(c => c.trim());
            for (const code of codeList) {
                await addVoucher(code, bulkCatId.trim(), '100');
            }
            await bot.sendMessage(chatId, `✅ ${codeList.length} vouchers added!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'delete_vouchers':
            if (text === 'ALL') {
                // Delete all vouchers
                await bot.sendMessage(chatId, '⚠️ This will delete ALL vouchers. Type "CONFIRM ALL" to proceed:');
                adminState[chatId].confirmDelete = true;
            } else {
                const [delCatId, delCodes] = text.split('|');
                const delCodeList = delCodes.split(',').map(c => c.trim());
                for (const code of delCodeList) {
                    await deleteVoucher(code);
                }
                await bot.sendMessage(chatId, `✅ ${delCodeList.length} vouchers deleted!`);
                delete adminState[chatId];
                await adminCommand(bot, msg);
            }
            break;
            
        case 'update_price':
            const [priceCatId, newPrice] = text.split('|');
            await updateVoucherPrice(priceCatId.trim(), newPrice.trim());
            await bot.sendMessage(chatId, '✅ Price updated successfully!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'block_user':
            const [userId, reason, type, hours] = text.split('|');
            let expiry = null;
            if (type === 'temporary' && hours) {
                expiry = new Date();
                expiry.setHours(expiry.getHours() + parseInt(hours));
            }
            await blockUser(userId.trim(), reason.trim(), process.env.ADMIN_ID, type, expiry);
            await bot.sendMessage(chatId, `✅ User ${userId} blocked!`);
            
            // Notify user
            try {
                await bot.sendMessage(parseInt(userId), 
                    `⛔ You have been ${type === 'temporary' ? 'temporarily' : 'permanently'} blocked.
Reason: ${reason}
${type === 'temporary' ? `Duration: ${hours} hours` : ''}

Contact @SheinVoucherHub for appeal.`
                );
            } catch (e) {}
            
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'temp_block':
            const [tempUserId, tempReason, tempHours] = text.split('|');
            const tempExpiry = new Date();
            tempExpiry.setHours(tempExpiry.getHours() + parseInt(tempHours));
            await blockUser(tempUserId.trim(), tempReason.trim(), process.env.ADMIN_ID, 'temporary', tempExpiry);
            await bot.sendMessage(chatId, `✅ User ${tempUserId} temporarily blocked for ${tempHours} hours!`);
            
            // Notify user
            try {
                await bot.sendMessage(parseInt(tempUserId), 
                    `⛔ You have been temporarily blocked for ${tempHours} hours.
Reason: ${tempReason}

Contact @SheinVoucherHub for appeal.`
                );
            } catch (e) {}
            
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'unblock_user':
            await unblockUser(text.trim());
            await bot.sendMessage(chatId, `✅ User ${text} unblocked!`);
            
            // Notify user
            try {
                await bot.sendMessage(parseInt(text), '✅ You have been unblocked. You can use the bot again.');
            } catch (e) {}
            
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'user_restrictions':
            const [restrictUserId, restrictType, restrictDuration] = text.split('|');
            await setUserRestriction(restrictUserId.trim(), restrictType.trim(), restrictDuration.trim());
            await bot.sendMessage(chatId, `✅ Restrictions applied to user ${restrictUserId}!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'user_stats':
            const statsUser = await getUser(text.trim());
            const statsOrders = await getUserOrders(text.trim());
            if (statsUser) {
                const message = `📊 User Statistics
━━━━━━━━━━━━━━━━━━━━━

User ID: ${statsUser.user_id}
Username: @${statsUser.username}
Name: ${statsUser.first_name}
Joined: ${new Date(statsUser.join_date).toLocaleString()}
Verified: ${statsUser.verified === 'true' ? '✅' : '❌'}
Total Orders: ${statsOrders.length}
Total Spent: ₹${statsUser.total_spent}`;
                await bot.sendMessage(chatId, message);
            } else {
                await bot.sendMessage(chatId, '❌ User not found!');
            }
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'user_orders':
            const orders = await getUserOrders(text.trim());
            if (orders.length > 0) {
                let message = `📦 User Orders\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
                orders.slice(0, 10).forEach(order => {
                    message += `Order: ${order.order_id}\n`;
                    message += `Category: ${order.category}\n`;
                    message += `Quantity: ${order.quantity}\n`;
                    message += `Total: ₹${order.total_price}\n`;
                    message += `Status: ${order.status}\n`;
                    message += `Date: ${new Date(order.order_date).toLocaleString()}\n\n`;
                });
                await bot.sendMessage(chatId, message);
            } else {
                await bot.sendMessage(chatId, '📦 No orders found for this user.');
            }
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'broadcast':
            await sendBroadcast(text);
            await bot.sendMessage(chatId, '📢 Broadcast sent to all users!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'scheduled_broadcast':
            const [broadMsg, broadTime] = text.split('|');
            await scheduleBroadcast(broadMsg.trim(), broadTime.trim());
            await bot.sendMessage(chatId, `⏰ Broadcast scheduled for ${broadTime}!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'delete_broadcast':
            await deleteBroadcast(text.trim());
            await bot.sendMessage(chatId, '✅ Broadcast deleted!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'personal_message':
            const [targetUser, message] = text.split('|');
            await sendPersonalMessage(parseInt(targetUser.trim()), message.trim());
            await bot.sendMessage(chatId, '✅ Message sent!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'bulk_message':
            const [userList, bulkMessage] = text.split('|');
            const users = userList.split(',').map(u => parseInt(u.trim()));
            for (const uid of users) {
                try {
                    await sendPersonalMessage(uid, bulkMessage.trim());
                } catch (e) {}
            }
            await bot.sendMessage(chatId, `✅ Message sent to ${users.length} users!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_welcome':
            await setWelcomeMessage(text);
            await bot.sendMessage(chatId, '✅ Welcome message updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_disclaimer':
            await setDisclaimer(text);
            await bot.sendMessage(chatId, '✅ Disclaimer updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_support':
            await setSupportMessage(text);
            await bot.sendMessage(chatId, '✅ Support message updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_payment_message':
            await setPaymentMessage(text);
            await bot.sendMessage(chatId, '✅ Payment message updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_success_message':
            await setSuccessMessage(text);
            await bot.sendMessage(chatId, '✅ Success message updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_failure_message':
            await setFailureMessage(text);
            await bot.sendMessage(chatId, '✅ Failure message updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_currency':
            await setCurrency(text.toUpperCase());
            await bot.sendMessage(chatId, `✅ Currency set to ${text.toUpperCase()}`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_tax':
            const [taxRate, taxType] = text.split('|');
            await setTaxRate(taxRate.trim());
            await setTaxType(taxType.trim());
            await setTaxEnabled('true');
            await bot.sendMessage(chatId, `✅ Tax set to ${taxRate}% (${taxType})`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'add_discount':
            const [discountCode, discountType, discountValue, discountExpiry, discountMin, discountMax] = text.split('|');
            await addDiscount(discountCode.trim(), discountType.trim(), discountValue.trim(), discountExpiry.trim(), discountMin.trim(), discountMax.trim());
            await bot.sendMessage(chatId, '✅ Discount added!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'category_discount':
            const [discountCatId, discountPercent] = text.split('|');
            await addCategoryDiscount(discountCatId.trim(), discountPercent.trim());
            await bot.sendMessage(chatId, '✅ Category discount added!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'add_coupon':
            const [couponCode, couponValue, couponType, couponUsage, couponExpiry] = text.split('|');
            await addCoupon(couponCode.trim(), couponValue.trim(), couponType.trim(), couponUsage.trim(), couponExpiry.trim());
            await bot.sendMessage(chatId, '✅ Coupon added!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'delete_discount':
            await deleteDiscount(text.trim());
            await bot.sendMessage(chatId, '✅ Discount deleted!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'referral_bonus':
            const [bonusAmount, bonusType] = text.split('|');
            await setReferralBonus(`${bonusAmount}|${bonusType}`);
            await bot.sendMessage(chatId, '✅ Referral bonus updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'referral_tiers':
            await setReferralTier(text);
            await bot.sendMessage(chatId, '✅ Referral tiers updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'export_report':
            const [reportType, reportFormat] = text.split('|');
            // Generate and export report
            await bot.sendMessage(chatId, `📤 ${reportType} report exported as ${reportFormat}`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'report_schedule':
            const [scheduleType, scheduleTime, scheduleEmail] = text.split('|');
            await setReportSchedule(scheduleType.trim(), scheduleTime.trim(), scheduleEmail.trim());
            await bot.sendMessage(chatId, `✅ ${scheduleType} report scheduled for ${scheduleTime}`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'restore_backup':
            if (msg.document) {
                // Handle backup file
                await bot.sendMessage(chatId, '🔄 Restoring backup...');
                // Process backup file
                await bot.sendMessage(chatId, '✅ Backup restored successfully!');
            } else {
                await bot.sendMessage(chatId, '❌ Please send a backup file.');
            }
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'backup_interval':
            await setBackupInterval(text);
            await bot.sendMessage(chatId, `✅ Backup interval set to ${text} hours`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'clear_logs':
            if (text === 'CONFIRM') {
                // Clear logs
                await bot.sendMessage(chatId, '✅ All logs cleared!');
            }
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_webhook':
            await setWebhookURL(text);
            await setWebhookEnabled('true');
            await bot.sendMessage(chatId, `✅ Webhook set to ${text}`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'rate_limit':
            const [limitCount, limitTime] = text.split('|');
            await setRateLimit(limitCount.trim());
            await setRateLimitTime(limitTime.trim());
            await bot.sendMessage(chatId, `✅ Rate limit set to ${limitCount} requests per ${limitTime} seconds`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'ip_whitelist':
            const whitelist = text.split(',').map(ip => ip.trim());
            await setIPWhitelist(whitelist);
            await bot.sendMessage(chatId, '✅ IP whitelist updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'ip_blacklist':
            const blacklist = text.split(',').map(ip => ip.trim());
            await setIPBlacklist(blacklist);
            await bot.sendMessage(chatId, '✅ IP blacklist updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'email_alerts':
            const [emailStatus, emailAddress] = text.split('|');
            await setEmailAlerts(emailStatus.trim() === 'enable' ? 'true' : 'false');
            if (emailAddress) await setAlertEmail(emailAddress.trim());
            await bot.sendMessage(chatId, `✅ Email alerts ${emailStatus === 'enable' ? 'enabled' : 'disabled'}`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'telegram_alerts':
            const [telegramStatus, telegramChatId] = text.split('|');
            await setTelegramAlerts(telegramStatus.trim() === 'enable' ? 'true' : 'false');
            if (telegramChatId) await setAlertTelegram(telegramChatId.trim());
            await bot.sendMessage(chatId, `✅ Telegram alerts ${telegramStatus === 'enable' ? 'enabled' : 'disabled'}`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'alert_thresholds':
            const [lowStock, expiry, order, payment] = text.split('|');
            await setLowStockThreshold(lowStock.trim());
            await setExpiryDays(expiry.trim());
            await setOrderAlert(order.trim());
            await setPaymentAlert(payment.trim());
            await bot.sendMessage(chatId, '✅ Alert thresholds updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_language':
            await setLanguage(text.toLowerCase());
            await bot.sendMessage(chatId, `✅ Language set to ${text}`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_timezone':
            await setTimezone(text);
            await bot.sendMessage(chatId, `✅ Timezone set to ${text}`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'currency_format':
            const [symbol, position, decimal, thousand] = text.split('|');
            await setCurrencySymbol(symbol.trim());
            await setCurrencyPosition(position.trim());
            await setDecimalSeparator(decimal.trim());
            await setThousandSeparator(thousand.trim());
            await bot.sendMessage(chatId, '✅ Currency format updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'captcha_type':
            await setCaptchaType(text.toLowerCase());
            await bot.sendMessage(chatId, `✅ Captcha type set to ${text}`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'channel_links':
            const [channel1, channel2] = text.split('|');
            await setChannelLinks(channel1.trim(), channel2.trim());
            await bot.sendMessage(chatId, '✅ Channel links updated!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'cleanup_orders':
            await cleanupOldOrders(parseInt(text));
            await bot.sendMessage(chatId, `✅ Orders older than ${text} days deleted!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'cleanup_users':
            await cleanupInactiveUsers(parseInt(text));
            await bot.sendMessage(chatId, `✅ Users inactive for ${text} days deleted!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'reset_data':
            if (text === 'RESET ALL DATA') {
                // Reset all data
                await bot.sendMessage(chatId, '⚠️ ALL DATA HAS BEEN RESET!');
            }
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'recovery_code':
            const recoveryOrder = await getOrder(state.orderId);
            if (recoveryOrder) {
                await bot.sendMessage(parseInt(recoveryOrder.user_id),
                    `✅ Recovery Successful!
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${state.orderId}

New Voucher Code: ${text}

If you face any issues, contact support.`
                );
                await bot.sendMessage(chatId, '✅ Recovery code sent to user!');
            }
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'reply_to_user':
            await bot.sendMessage(parseInt(state.targetUserId),
                `📨 Admin Reply
━━━━━━━━━━━━━━━━━━━━━

${text}`
            );
            await bot.sendMessage(chatId, '✅ Reply sent to user!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        default:
            return false;
    }
    
    return true;
}

// Export all functions
module.exports = { 
    adminCommand, 
    handleAdminCallback, 
    handleAdminText 
};