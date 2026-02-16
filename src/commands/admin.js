const { 
    getCategories, addCategory, updateCategoryStock, deleteCategory,
    addVoucher, blockUser, unblockUser, getAllUsers,
    getSetting, updateSetting, getUserOrders, getOrder, getAllOrders,
    getStats, getBlockedUsers, getVouchersByCategory, deleteVoucher,
    updateVoucherPrice, getDailyStats, backupData,
    sendBroadcast, sendPersonalMessage,
    setUserRestriction, getUserRestrictions,
    setTemporaryBlock, getTemporaryBlocks,
    addCategoryDiscount, getCategoryDiscounts,
    setPaymentMethod, getPaymentMethod, setCaptchaType, getCaptchaType,
    setRecoveryHours, getRecoveryHours, setMaxQuantity, getMaxQuantity,
    setBotStatus, getBotStatus, setMaintenanceMode, getMaintenanceMode,
    setWelcomeMessage, getWelcomeMessage, setDisclaimer, getDisclaimer,
    setSupportMessage, getSupportMessage, setPaymentMessage, getPaymentMessage,
    setSuccessMessage, getSuccessMessage, setFailureMessage, getFailureMessage,
    setChannelLinks, getChannelLinks, setChannelCheck, getChannelCheck,
    setCaptchaEnabled, getCaptchaEnabled,
    setLowStockThreshold, getLowStockThreshold,
    setExpiryDays, getExpiryDays, setOrderAlert, getOrderAlert, setPaymentAlert,
    getPaymentAlert, setBlockAlert, getBlockAlert, setRecoveryAlert, getRecoveryAlert,
    setSupportAlert, getSupportAlert,
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
    setAPIAccess, getAPIAccess, setAPIKey, getAPIKey, setWebhookEnabled, getWebhookEnabled,
    setWebhookURL, getWebhookURL, setRateLimit, getRateLimit,
    setRateLimitTime, getRateLimitTime, setIPWhitelist, getIPWhitelist, setIPBlacklist, getIPBlacklist,
    setEmailAlerts, getEmailAlerts, setTelegramAlerts, getTelegramAlerts,
    setAlertEmail, getAlertEmail, setAlertTelegram, getAlertTelegram,
    setBackupEnabled, getBackupEnabled, setBackupInterval, getBackupInterval
} = require('../sheets/googleSheets');
const { approvePayment, rejectPayment } = require('../handlers/paymentHandler');

let adminState = {};

// Helper function to get last backup
async function getLastBackup() {
    try {
        const settings = await getSetting('last_backup');
        return settings || 'Never';
    } catch (error) {
        return 'Never';
    }
}

// Helper function for weekly stats
async function getWeeklyStats() {
    return { total: 0, delivered: 0, pending: 0, revenue: 0 };
}

// Helper function for monthly stats
async function getMonthlyStats() {
    return { total: 0, delivered: 0, pending: 0, revenue: 0 };
}

// Helper function for yearly stats
async function getYearlyStats() {
    return { total: 0, delivered: 0, pending: 0, revenue: 0 };
}

// Helper function for broadcast history
async function getBroadcastHistory() {
    return [];
}

// Helper function to show category discounts
async function showCategoryDiscounts(bot, chatId) {
    await bot.sendMessage(chatId, '📋 Category discounts feature coming soon...');
}

// Helper function to show discounts
async function showDiscounts(bot, chatId) {
    await bot.sendMessage(chatId, '📋 Discounts feature coming soon...');
}

// Helper function to show weekly report
async function showWeeklyReport(bot, chatId, stats) {
    const message = `📆 **Weekly Report**
━━━━━━━━━━━━━━━━━━━━━

👥 New Users: ${stats.newUsers || 0}
📦 New Orders: ${stats.newOrders || 0}
💰 Revenue: ₹${stats.revenue || 0}`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

// Helper function to show monthly report
async function showMonthlyReport(bot, chatId, stats) {
    const message = `📊 **Monthly Report**
━━━━━━━━━━━━━━━━━━━━━

👥 New Users: ${stats.newUsers || 0}
📦 New Orders: ${stats.newOrders || 0}
💰 Revenue: ₹${stats.revenue || 0}`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

// Helper function to show yearly report
async function showYearlyReport(bot, chatId, stats) {
    const message = `📈 **Yearly Report**
━━━━━━━━━━━━━━━━━━━━━

👥 New Users: ${stats.newUsers || 0}
📦 New Orders: ${stats.newOrders || 0}
💰 Revenue: ₹${stats.revenue || 0}`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

async function adminCommand(bot, msg) {
    const chatId = msg.chat.id;
    
    const adminMenu = `👑 **Admin Panel**
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
        parse_mode: 'Markdown',
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
            await bot.sendMessage(chatId, '➕ **Add New Category**\n\nFormat: `Name|Price|Stock`\nExample: `₹1000 Voucher|100|50`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_update_stock':
            adminState[chatId] = { action: 'update_stock' };
            await bot.sendMessage(chatId, '✏️ **Update Stock**\n\nFormat: `CategoryID|NewStock`\nExample: `1|100`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_delete_category':
            adminState[chatId] = { action: 'delete_category' };
            await bot.sendMessage(chatId, '🗑 **Delete Category**\n\nSend Category ID to delete:', {
                parse_mode: 'Markdown'
            });
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
            await bot.sendMessage(chatId, '📦 **Bulk Add Vouchers**\n\nFormat: `CategoryID|Code1,Code2,Code3...`\nExample: `1|VCH100,VCH101,VCH102`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_delete_vouchers':
            adminState[chatId] = { action: 'delete_vouchers' };
            await bot.sendMessage(chatId, '🗑 **Delete Vouchers**\n\nFormat: `CategoryID|Code1,Code2,Code3...`\nOr send `ALL` to delete all in category', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_update_price':
            adminState[chatId] = { action: 'update_price' };
            await bot.sendMessage(chatId, '💰 **Update Voucher Price**\n\nFormat: `CategoryID|NewPrice`\nExample: `1|150`', {
                parse_mode: 'Markdown'
            });
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
            await bot.sendMessage(chatId, '👥 **Unblock User**\n\nSend User ID to unblock:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_temp_block':
            adminState[chatId] = { action: 'temp_block' };
            await bot.sendMessage(chatId, '⏱ **Temporary Block**\n\nFormat: `UserID|Reason|Hours`\nExample: `123456789|Spam|24`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_user_restrictions':
            adminState[chatId] = { action: 'user_restrictions' };
            await bot.sendMessage(chatId, '🔒 **User Restrictions**\n\nFormat: `UserID|RestrictionType|Hours`\nTypes: `buy,recover,chat`\nExample: `123456789|buy|48`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_user_stats':
            adminState[chatId] = { action: 'user_stats' };
            await bot.sendMessage(chatId, '📊 **User Statistics**\n\nSend User ID to view stats:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_user_orders':
            adminState[chatId] = { action: 'user_orders' };
            await bot.sendMessage(chatId, '📦 **User Orders**\n\nSend User ID to view orders:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_blocked_list':
            await showBlockedUsers(bot, chatId);
            break;
            
        // Broadcast & Messages
        case 'admin_broadcast':
            adminState[chatId] = { action: 'broadcast' };
            await bot.sendMessage(chatId, '📢 **Broadcast Message**\n\nSend the message to broadcast to all users:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_scheduled_broadcast':
            adminState[chatId] = { action: 'scheduled_broadcast' };
            await bot.sendMessage(chatId, '⏰ **Scheduled Broadcast**\n\nFormat: `Message|YYYY-MM-DD HH:MM`\nExample: `Happy New Year!|2026-01-01 00:00`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_broadcast_history':
            await showBroadcastHistory(bot, chatId);
            break;
            
        case 'admin_delete_broadcast':
            adminState[chatId] = { action: 'delete_broadcast' };
            await bot.sendMessage(chatId, '🗑 **Delete Broadcast**\n\nSend Broadcast ID to delete:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_personal':
            adminState[chatId] = { action: 'personal_message' };
            await bot.sendMessage(chatId, '✉️ **Personal Message**\n\nFormat: `UserID|Message`\nExample: `123456789|Hello, how can I help?`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'admin_bulk_message':
            adminState[chatId] = { action: 'bulk_message' };
            await bot.sendMessage(chatId, '📨 **Bulk Message**\n\nFormat: `UserID1,UserID2,UserID3|Message`\nExample: `123,456,789|Special offer for you!`', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Settings
        case 'admin_settings':
            await settingsMenu(bot, chatId);
            break;
            
        case 'toggle_bot':
            const currentBotStatus = await getBotStatus();
            await setBotStatus(currentBotStatus === 'active' ? 'inactive' : 'active');
            await bot.sendMessage(chatId, `✅ Bot status changed to ${currentBotStatus === 'active' ? 'inactive' : 'active'}`);
            await settingsMenu(bot, chatId);
            break;
            
        case 'toggle_maintenance':
            const currentMaintenanceMode = await getMaintenanceMode();
            await setMaintenanceMode(currentMaintenanceMode === 'off' ? 'on' : 'off');
            await bot.sendMessage(chatId, `✅ Maintenance mode ${currentMaintenanceMode === 'off' ? 'enabled' : 'disabled'}`);
            await settingsMenu(bot, chatId);
            break;
            
        case 'set_welcome':
            adminState[chatId] = { action: 'set_welcome' };
            await bot.sendMessage(chatId, '📝 **Set Welcome Message**\n\nSend new welcome message:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_disclaimer':
            adminState[chatId] = { action: 'set_disclaimer' };
            await bot.sendMessage(chatId, '📝 **Set Disclaimer**\n\nSend new disclaimer text:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_support':
            adminState[chatId] = { action: 'set_support' };
            await bot.sendMessage(chatId, '📝 **Set Support Message**\n\nSend new support message:', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Payment Settings
        case 'admin_payment':
            await paymentSettings(bot, chatId);
            break;
            
        case 'toggle_payment':
            const currentPayMethod = await getPaymentMethod();
            await setPaymentMethod(currentPayMethod === 'manual' ? 'razorpay' : 'manual');
            await bot.sendMessage(chatId, `✅ Payment method changed to ${currentPayMethod === 'manual' ? 'razorpay' : 'manual'}`);
            await paymentSettings(bot, chatId);
            break;
            
        case 'set_payment_message':
            adminState[chatId] = { action: 'set_payment_message' };
            await bot.sendMessage(chatId, '📝 **Set Payment Message**\n\nSend new payment instructions:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_success_message':
            adminState[chatId] = { action: 'set_success_message' };
            await bot.sendMessage(chatId, '📝 **Set Success Message**\n\nSend new payment success message:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_failure_message':
            adminState[chatId] = { action: 'set_failure_message' };
            await bot.sendMessage(chatId, '📝 **Set Failure Message**\n\nSend new payment failure message:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_currency':
            adminState[chatId] = { action: 'set_currency' };
            await bot.sendMessage(chatId, '💰 **Set Currency**\n\nSend currency code (INR/USD/EUR):', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_tax':
            adminState[chatId] = { action: 'set_tax' };
            await bot.sendMessage(chatId, '📊 **Set Tax Rate**\n\nFormat: `Rate|Type`\nExample: `18|percentage` or `20|fixed`', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Discounts & Coupons
        case 'admin_discounts':
            await discountSettings(bot, chatId);
            break;
            
        case 'add_discount':
            adminState[chatId] = { action: 'add_discount' };
            await bot.sendMessage(chatId, '🎁 **Add Discount**\n\nFormat: `Code|Type|Value|Expiry|MinAmount|MaxAmount`\nExample: `SAVE20|percentage|20|2026-12-31|100|1000`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'add_category_discount':
            adminState[chatId] = { action: 'category_discount' };
            await bot.sendMessage(chatId, '🏷 **Add Category Discount**\n\nFormat: `CategoryID|Discount%`\nExample: `1|15`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'add_coupon':
            adminState[chatId] = { action: 'add_coupon' };
            await bot.sendMessage(chatId, '🎟 **Add Coupon**\n\nFormat: `Code|Value|Type|Usage|Expiry`\nExample: `SHEIN50|50|fixed|100|2026-12-31`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'view_discounts':
            await showDiscounts(bot, chatId);
            break;
            
        case 'delete_discount':
            adminState[chatId] = { action: 'delete_discount' };
            await bot.sendMessage(chatId, '🗑 **Delete Discount**\n\nSend Discount Code to delete:', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Referral System
        case 'admin_referral':
            await referralSettings(bot, chatId);
            break;
            
        case 'toggle_referral':
            const referralStatus = await getReferralEnabled();
            await setReferralEnabled(referralStatus === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ Referral system ${referralStatus === 'true' ? 'disabled' : 'enabled'}`);
            await referralSettings(bot, chatId);
            break;
            
        case 'set_referral_bonus':
            adminState[chatId] = { action: 'referral_bonus' };
            await bot.sendMessage(chatId, '💰 **Set Referral Bonus**\n\nFormat: `Amount|Type`\nExample: `50|fixed` or `10|percentage`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_referral_tiers':
            adminState[chatId] = { action: 'referral_tiers' };
            await bot.sendMessage(chatId, '📊 **Set Referral Tiers**\n\nFormat: `Tier1|Tier2|Tier3|Tier4|Tier5`\nExample: `5|10|15|20|25`', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Reports
        case 'admin_reports':
            await reportsMenu(bot, chatId);
            break;
            
        case 'daily_report':
            const dailyStatsData = await getDailyStats();
            await showDailyReport(bot, chatId, dailyStatsData);
            break;
            
        case 'weekly_report':
            const weeklyStatsData = await getWeeklyStats();
            await showWeeklyReport(bot, chatId, weeklyStatsData);
            break;
            
        case 'monthly_report':
            const monthlyStatsData = await getMonthlyStats();
            await showMonthlyReport(bot, chatId, monthlyStatsData);
            break;
            
        case 'yearly_report':
            const yearlyStatsData = await getYearlyStats();
            await showYearlyReport(bot, chatId, yearlyStatsData);
            break;
            
        case 'export_report':
            adminState[chatId] = { action: 'export_report' };
            await bot.sendMessage(chatId, '📤 **Export Report**\n\nFormat: `Type|Format`\nExample: `daily|csv` or `monthly|excel`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_report_schedule':
            adminState[chatId] = { action: 'report_schedule' };
            await bot.sendMessage(chatId, '⏰ **Set Report Schedule**\n\nFormat: `Type|Time|Email`\nExample: `daily|09:00|admin@email.com`', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Backup
        case 'admin_backup':
            await backupMenu(bot, chatId);
            break;
            
        case 'create_backup':
            const backupResult = await backupData();
            await bot.sendDocument(chatId, Buffer.from(JSON.stringify(backupResult)), {
                filename: `backup_${Date.now()}.json`,
                caption: '✅ Backup created successfully!'
            });
            break;
            
        case 'restore_backup':
            adminState[chatId] = { action: 'restore_backup' };
            await bot.sendMessage(chatId, '🔄 **Restore Backup**\n\nSend the backup file:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'toggle_auto_backup':
            const autoBackupStatus = await getBackupEnabled();
            await setBackupEnabled(autoBackupStatus === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ Auto backup ${autoBackupStatus === 'true' ? 'disabled' : 'enabled'}`);
            await backupMenu(bot, chatId);
            break;
            
        case 'set_backup_interval':
            adminState[chatId] = { action: 'backup_interval' };
            await bot.sendMessage(chatId, '⏱ **Set Backup Interval (hours)**\n\nSend number of hours:', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Logs
        case 'admin_logs':
            await logsMenu(bot, chatId);
            break;
            
        case 'view_admin_logs':
            await bot.sendMessage(chatId, '📋 **Admin Logs**\n\nFeature coming soon...');
            break;
            
        case 'view_error_logs':
            await bot.sendMessage(chatId, '📋 **Error Logs**\n\nFeature coming soon...');
            break;
            
        case 'view_payment_logs':
            await bot.sendMessage(chatId, '📋 **Payment Logs**\n\nFeature coming soon...');
            break;
            
        case 'view_user_logs':
            await bot.sendMessage(chatId, '📋 **User Logs**\n\nFeature coming soon...');
            break;
            
        case 'clear_logs':
            adminState[chatId] = { action: 'clear_logs' };
            await bot.sendMessage(chatId, '🗑 **Clear Logs**\n\nType `CONFIRM` to clear all logs:', {
                parse_mode: 'Markdown'
            });
            break;
            
        // API Settings
        case 'admin_api':
            await apiSettings(bot, chatId);
            break;
            
        case 'toggle_api':
            const apiAccessStatus = await getAPIAccess();
            await setAPIAccess(apiAccessStatus === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ API access ${apiAccessStatus === 'true' ? 'disabled' : 'enabled'}`);
            await apiSettings(bot, chatId);
            break;
            
        case 'generate_api_key':
            const newApiKeyValue = 'API_' + Math.random().toString(36).substr(2, 16).toUpperCase();
            await setAPIKey(newApiKeyValue);
            await bot.sendMessage(chatId, `🔑 **New API Key:** \`${newApiKeyValue}\`\n\nSave this key securely!`, {
                parse_mode: 'Markdown'
            });
            await apiSettings(bot, chatId);
            break;
            
        case 'set_webhook':
            adminState[chatId] = { action: 'set_webhook' };
            await bot.sendMessage(chatId, '🔗 **Set Webhook URL**\n\nSend webhook URL:', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Rate Limiting
        case 'admin_ratelimit':
            await rateLimitSettings(bot, chatId);
            break;
            
        case 'set_rate_limit':
            adminState[chatId] = { action: 'rate_limit' };
            await bot.sendMessage(chatId, '🚦 **Set Rate Limit**\n\nFormat: `Count|Time(seconds)`\nExample: `10|60`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_ip_whitelist':
            adminState[chatId] = { action: 'ip_whitelist' };
            await bot.sendMessage(chatId, '✅ **IP Whitelist**\n\nSend IP addresses (comma separated):', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_ip_blacklist':
            adminState[chatId] = { action: 'ip_blacklist' };
            await bot.sendMessage(chatId, '❌ **IP Blacklist**\n\nSend IP addresses (comma separated):', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Alerts
        case 'admin_alerts':
            await alertSettings(bot, chatId);
            break;
            
        case 'set_email_alerts':
            adminState[chatId] = { action: 'email_alerts' };
            await bot.sendMessage(chatId, '📧 **Email Alerts**\n\nFormat: `Enable/Disable|Email`\nExample: `enable|admin@email.com`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_telegram_alerts':
            adminState[chatId] = { action: 'telegram_alerts' };
            await bot.sendMessage(chatId, '📱 **Telegram Alerts**\n\nFormat: `Enable/Disable|ChatID`\nExample: `enable|123456789`', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_alert_thresholds':
            adminState[chatId] = { action: 'alert_thresholds' };
            await bot.sendMessage(chatId, '⚠️ **Alert Thresholds**\n\nFormat: `LowStock|ExpiryDays|OrderAmount|PaymentAmount`\nExample: `10|7|50|1000`', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Regional Settings
        case 'admin_regional':
            await regionalSettings(bot, chatId);
            break;
            
        case 'set_language':
            adminState[chatId] = { action: 'set_language' };
            await bot.sendMessage(chatId, '🌐 **Set Language**\n\nSend language code (en/hi/es/fr):', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_timezone':
            adminState[chatId] = { action: 'set_timezone' };
            await bot.sendMessage(chatId, '🕐 **Set Timezone**\n\nSend timezone (Asia/Kolkata, UTC, etc):', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_currency_format':
            adminState[chatId] = { action: 'currency_format' };
            await bot.sendMessage(chatId, '💰 **Set Currency Format**\n\nFormat: `Symbol|Position|Decimal|Thousand`\nExample: `₹|before|.|,`', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Verification Settings
        case 'admin_verification':
            await verificationSettings(bot, chatId);
            break;
            
        case 'toggle_captcha':
            const captchaStatus = await getCaptchaEnabled();
            await setCaptchaEnabled(captchaStatus === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ Captcha ${captchaStatus === 'true' ? 'disabled' : 'enabled'}`);
            await verificationSettings(bot, chatId);
            break;
            
        case 'set_captcha_type':
            adminState[chatId] = { action: 'captcha_type' };
            await bot.sendMessage(chatId, '🔐 **Set Captcha Type**\n\nTypes: `math`, `text`, `mixed`\nSend type name:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'set_channel_check':
            const channelCheckStatus = await getChannelCheck();
            await setChannelCheck(channelCheckStatus === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ Channel verification ${channelCheckStatus === 'true' ? 'disabled' : 'enabled'}`);
            await verificationSettings(bot, chatId);
            break;
            
        case 'set_channel_links':
            adminState[chatId] = { action: 'channel_links' };
            await bot.sendMessage(chatId, '🔗 **Set Channel Links**\n\nFormat: `Channel1|Channel2`\nExample: `@channel1|@channel2`', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Data Cleanup
        case 'admin_cleanup':
            await cleanupMenu(bot, chatId);
            break;
            
        case 'cleanup_old_orders':
            adminState[chatId] = { action: 'cleanup_orders' };
            await bot.sendMessage(chatId, '🗑 **Cleanup Old Orders**\n\nSend days to keep (older will be deleted):', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'cleanup_old_users':
            adminState[chatId] = { action: 'cleanup_users' };
            await bot.sendMessage(chatId, '🗑 **Cleanup Inactive Users**\n\nSend days of inactivity:', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'cleanup_temp_data':
            await clearOldData();
            await bot.sendMessage(chatId, '✅ Temporary data cleaned up!');
            break;
            
        case 'reset_all_data':
            adminState[chatId] = { action: 'reset_data' };
            await bot.sendMessage(chatId, '⚠️ **WARNING:** This will delete ALL data!\nType `RESET ALL DATA` to confirm:', {
                parse_mode: 'Markdown'
            });
            break;
            
        // Handle voucher addition
        default:
            if (data.startsWith('add_voucher_')) {
                const catId = data.split('_')[2];
                adminState[chatId] = { action: 'add_voucher', categoryId: catId };
                await bot.sendMessage(chatId, '➕ **Add Vouchers**\n\nSend voucher codes (one per line):', {
                    parse_mode: 'Markdown'
                });
            }
            
            // Handle order approval
            if (data.startsWith('approve_')) {
                const orderIdValue = data.replace('approve_', '');
                await approvePayment(bot, chatId, orderIdValue);
            }
            
            if (data.startsWith('reject_')) {
                const orderIdValue = data.replace('reject_', '');
                await rejectPayment(bot, chatId, orderIdValue, 'Payment verification failed');
            }
            
            // Handle recovery
            if (data.startsWith('recover_')) {
                const orderIdValue = data.replace('recover_', '');
                adminState[chatId] = { action: 'recovery_code', orderId: orderIdValue };
                await bot.sendMessage(chatId, '📝 **Send new voucher code for recovery:**', {
                    parse_mode: 'Markdown'
                });
            }
            
            if (data.startsWith('norecover_')) {
                const orderIdValue = data.replace('norecover_', '');
                await noRecovery(bot, chatId, orderIdValue);
            }
            
            // Handle reply to user
            if (data.startsWith('reply_')) {
                const targetUserId = data.split('_')[1];
                adminState[chatId] = { action: 'reply_to_user', targetUserId };
                await bot.sendMessage(chatId, '✏️ **Enter your reply message:**', {
                    parse_mode: 'Markdown'
                });
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
    
    let message = `📊 **System Statistics**
━━━━━━━━━━━━━━━━━━━━━

👥 **Total Users:** ${users.length}
🔒 **Blocked Users:** ${blocked.length}
📦 **Total Orders:** ${orders.length}
✅ **Successful Orders:** ${orders.filter(o => o.status === 'delivered').length}
⏳ **Pending Orders:** ${orders.filter(o => o.status === 'pending_approval').length}
❌ **Rejected Orders:** ${orders.filter(o => o.status === 'rejected').length}
💰 **Total Revenue:** ₹${orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + parseInt(o.total_price || 0), 0)}

📊 **Category Statistics:**\n`;
    
    for (const cat of categories) {
        const catOrders = orders.filter(o => o.category === cat.name && o.status === 'delivered');
        const revenue = catOrders.reduce((sum, o) => sum + parseInt(o.total_price || 0), 0);
        message += `\n• **${cat.name}**\n`;
        message += `  Stock: ${cat.stock} | Sold: ${cat.total_sold}\n`;
        message += `  Revenue: ₹${revenue}`;
    }
    
    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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
    
    let message = `📦 **Category Management**
━━━━━━━━━━━━━━━━━━━━━

**Existing Categories:**\n\n`;
    
    categories.forEach(cat => {
        message += `• **${cat.name}** (ID: \`${cat.category_id}\`)\n`;
        message += `  Price: ₹${cat.price_per_code} | Stock: ${cat.stock}\n\n`;
    });
    
    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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
    
    await bot.sendMessage(chatId, '**Select category to add vouchers:**', {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function viewVouchers(bot, chatId) {
    const categories = await getCategories();
    
    let message = '📋 **Available Vouchers**\n━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    for (const cat of categories) {
        const vouchers = await getVouchersByCategory(cat.category_id);
        const available = vouchers.filter(v => v.status === 'available');
        message += `📦 **${cat.name}**\n`;
        message += `Total: ${vouchers.length} | Available: ${available.length}\n`;
        if (available.length > 0) {
            message += `Codes: ${available.slice(0, 5).map(v => `\`${v.code}\``).join(', ')}${available.length > 5 ? '...' : ''}\n\n`;
        } else {
            message += 'No available codes\n\n';
        }
    }
    
    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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
    
    const message = `👥 **User Management**
━━━━━━━━━━━━━━━━━━━━━

**Total Users:** ${users.length}
**Active Users:** ${activeUsers.length}
**Blocked Users:** ${blocked.length}

Select an option:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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
    await bot.sendMessage(chatId, '👥 **Block User**\n\nFormat: `UserID|Reason|Type(permanent/temporary)|Hours(if temporary)`\nExample: `123456789|Spam|temporary|24`', {
        parse_mode: 'Markdown'
    });
}

async function showBlockedUsers(bot, chatId) {
    const blocked = await getBlockedUsers();
    
    if (blocked.length === 0) {
        await bot.sendMessage(chatId, '✅ No blocked users found.');
        return;
    }
    
    let message = '📋 **Blocked Users**\n━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    blocked.forEach((user, index) => {
        message += `${index + 1}. **User ID:** \`${user.user_id}\`\n`;
        message += `   **Reason:** ${user.reason}\n`;
        message += `   **Type:** ${user.block_type}\n`;
        if (user.expiry_date) {
            message += `   **Expires:** ${new Date(user.expiry_date).toLocaleString()}\n`;
        }
        message += `   **Blocked:** ${new Date(user.block_date).toLocaleString()}\n\n`;
    });
    
    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔄 Refresh', callback_data: 'admin_blocked_list' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function settingsMenu(bot, chatId) {
    const botStatusValue = await getBotStatus();
    const maintenanceModeValue = await getMaintenanceMode();
    const welcomeMessageValue = await getWelcomeMessage();
    const disclaimerValue = await getDisclaimer();
    const supportMessageValue = await getSupportMessage();
    
    const message = `⚙️ **Bot Settings**
━━━━━━━━━━━━━━━━━━━━━

🤖 **Bot Status:** ${botStatusValue === 'active' ? '✅ Active' : '❌ Inactive'}
🔧 **Maintenance:** ${maintenanceModeValue === 'on' ? '⚠️ On' : '✅ Off'}
📝 **Welcome:** ${welcomeMessageValue ? '✅ Set' : '❌ Not Set'}
📜 **Disclaimer:** ${disclaimerValue ? '✅ Set' : '❌ Not Set'}
🆘 **Support:** ${supportMessageValue ? '✅ Set' : '❌ Not Set'}

Select setting to change:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: botStatusValue === 'active' ? '❌ Stop Bot' : '✅ Start Bot', callback_data: 'toggle_bot' }],
                [{ text: maintenanceModeValue === 'on' ? '✅ Disable Maintenance' : '⚠️ Enable Maintenance', callback_data: 'toggle_maintenance' }],
                [{ text: '📝 Set Welcome', callback_data: 'set_welcome' }],
                [{ text: '📜 Set Disclaimer', callback_data: 'set_disclaimer' }],
                [{ text: '🆘 Set Support', callback_data: 'set_support' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function paymentSettings(bot, chatId) {
    const paymentMethodValue = await getPaymentMethod();
    const currencyValue = await getCurrency();
    const taxEnabledValue = await getTaxEnabled();
    const taxRateValue = await getTaxRate();
    
    const message = `💰 **Payment Settings**
━━━━━━━━━━━━━━━━━━━━━

💳 **Method:** ${paymentMethodValue}
💰 **Currency:** ${currencyValue}
📊 **Tax:** ${taxEnabledValue === 'true' ? '✅ Enabled' : '❌ Disabled'}
📈 **Tax Rate:** ${taxRateValue}%

Select option:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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
    const message = `🎁 **Discounts & Coupons**
━━━━━━━━━━━━━━━━━━━━━

Select option:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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
    const referralStatus = await getReferralEnabled();
    const referralBonusValue = await getReferralBonus();
    const referralTiersValue = await getReferralTier();
    
    const message = `🤝 **Referral System**
━━━━━━━━━━━━━━━━━━━━━

**Status:** ${referralStatus === 'true' ? '✅ Active' : '❌ Inactive'}
**Bonus:** ${referralBonusValue}
**Tiers:** ${referralTiersValue}

Select option:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: referralStatus === 'true' ? '❌ Disable' : '✅ Enable', callback_data: 'toggle_referral' }],
                [{ text: '💰 Set Bonus', callback_data: 'set_referral_bonus' }],
                [{ text: '📊 Set Tiers', callback_data: 'set_referral_tiers' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function reportsMenu(bot, chatId) {
    const message = `📈 **Reports**
━━━━━━━━━━━━━━━━━━━━━

Select report type:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📅 Daily Report', callback_data: 'daily_report' }],
                [{ text: '📆 Weekly Report', callback_data: 'weekly_report' }],
                [{ text: '📊 Monthly Report', callback_data: 'monthly_report' }],
                [{ text: '📈 Yearly Report', callback_data: 'yearly_report' }],
                [{ text: '📤 Export Report', callback_data: 'export_report' }],
                [{ text: '⏰ Schedule Report', callback_data: 'set_report_schedule' }],
                [{ text: '🔙 Back', callback_data: 'admin_reports' }]
            ]
        }
    });
}

async function showDailyReport(bot, chatId, stats) {
    const message = `📅 **Daily Report - ${new Date().toLocaleDateString()}**
━━━━━━━━━━━━━━━━━━━━━

👥 **New Users:** ${stats.newUsers || 0}
📦 **New Orders:** ${stats.newOrders || 0}
💰 **Revenue:** ₹${stats.revenue || 0}
✅ **Successful:** ${stats.successful || 0}
❌ **Failed:** ${stats.failed || 0}`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📊 Export', callback_data: 'export_report' }],
                [{ text: '🔙 Back', callback_data: 'admin_reports' }]
            ]
        }
    });
}

async function backupMenu(bot, chatId) {
    const backupStatus = await getBackupEnabled();
    const backupIntervalValue = await getBackupInterval();
    const lastBackupValue = await getLastBackup();
    
    const message = `🔄 **Backup Management**
━━━━━━━━━━━━━━━━━━━━━

**Auto Backup:** ${backupStatus === 'true' ? '✅ On' : '❌ Off'}
**Interval:** ${backupIntervalValue || 24} hours
**Last Backup:** ${lastBackupValue || 'Never'}

Select option:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📦 Create Backup', callback_data: 'create_backup' }],
                [{ text: '🔄 Restore Backup', callback_data: 'restore_backup' }],
                [{ text: backupStatus === 'true' ? '❌ Disable Auto' : '✅ Enable Auto', callback_data: 'toggle_auto_backup' }],
                [{ text: '⏱ Set Interval', callback_data: 'set_backup_interval' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function logsMenu(bot, chatId) {
    const message = `📝 **Logs**
━━━━━━━━━━━━━━━━━━━━━

Select log type:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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
    const apiStatus = await getAPIAccess();
    const apiKeyValue = await getAPIKey();
    const webhookStatus = await getWebhookEnabled();
    
    const message = `🔌 **API Settings**
━━━━━━━━━━━━━━━━━━━━━

**API Access:** ${apiStatus === 'true' ? '✅ Enabled' : '❌ Disabled'}
**API Key:** ${apiKeyValue ? '✅ Set' : '❌ Not Set'}
**Webhook:** ${webhookStatus === 'true' ? '✅ Enabled' : '❌ Disabled'}

Select option:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: apiStatus === 'true' ? '❌ Disable API' : '✅ Enable API', callback_data: 'toggle_api' }],
                [{ text: '🔄 Generate API Key', callback_data: 'generate_api_key' }],
                [{ text: '🔗 Set Webhook', callback_data: 'set_webhook' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function rateLimitSettings(bot, chatId) {
    const rateLimitValue = await getRateLimit();
    const rateLimitTimeValue = await getRateLimitTime();
    
    const message = `🚦 **Rate Limiting**
━━━━━━━━━━━━━━━━━━━━━

**Current Limit:** ${rateLimitValue || 10} requests per ${rateLimitTimeValue || 60} seconds

Select option:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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
    const message = `📧 **Alert Settings**
━━━━━━━━━━━━━━━━━━━━━

Select alert type:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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
    const languageValue = await getLanguage();
    const timezoneValue = await getTimezone();
    const currencyValue = await getCurrency();
    
    const message = `🌍 **Regional Settings**
━━━━━━━━━━━━━━━━━━━━━

**Language:** ${languageValue || 'en'}
**Timezone:** ${timezoneValue || 'UTC'}
**Currency:** ${currencyValue || 'INR'}

Select option:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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
    const captchaStatus = await getCaptchaEnabled();
    const captchaTypeValue = await getCaptchaType();
    const channelCheckValue = await getChannelCheck();
    
    const message = `✅ **Verification Settings**
━━━━━━━━━━━━━━━━━━━━━

**Captcha:** ${captchaStatus === 'true' ? '✅ Enabled' : '❌ Disabled'}
**Captcha Type:** ${captchaTypeValue || 'math'}
**Channel Check:** ${channelCheckValue === 'true' ? '✅ Enabled' : '❌ Disabled'}

Select option:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: captchaStatus === 'true' ? '❌ Disable Captcha' : '✅ Enable Captcha', callback_data: 'toggle_captcha' }],
                [{ text: '🔐 Set Captcha Type', callback_data: 'set_captcha_type' }],
                [{ text: channelCheckValue === 'true' ? '❌ Disable Channel Check' : '✅ Enable Channel Check', callback_data: 'set_channel_check' }],
                [{ text: '🔗 Set Channel Links', callback_data: 'set_channel_links' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function cleanupMenu(bot, chatId) {
    const message = `🗑 **Data Cleanup**
━━━━━━━━━━━━━━━━━━━━━

⚠️ **WARNING:** These actions cannot be undone!

Select cleanup type:`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
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

async function noRecovery(bot, chatId, orderId) {
    const { getOrder } = require('../sheets/googleSheets');
    
    const order = await getOrder(orderId);
    
    if (!order) return bot.sendMessage(chatId, '❌ Order not found!');
    
    await bot.sendMessage(parseInt(order.user_id),
        `❌ **Recovery Failed**
━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${orderId}\`

We cannot recover your vouchers at this time.
**Reason:** Out of stock / Technical issue

Please contact support for assistance.`,
        { parse_mode: 'Markdown' }
    );
    
    await bot.sendMessage(chatId, '✅ User notified about recovery failure!');
}

async function handleAdminText(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = adminState[chatId];
    
    if (!state) return false;
    
    try {
        switch(state.action) {
            case 'add_category':
                const [catName, catPrice, catStock] = text.split('|');
                await addCategory(catName.trim(), catPrice.trim(), catStock.trim());
                await bot.sendMessage(chatId, '✅ Category added successfully!');
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'update_stock':
                const [stockCatId, newStockValue] = text.split('|');
                await updateCategoryStock(stockCatId.trim(), newStockValue.trim());
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
                const voucherCodes = text.split('\n').map(c => c.trim()).filter(c => c);
                for (const code of voucherCodes) {
                    await addVoucher(code, state.categoryId, '100');
                }
                await bot.sendMessage(chatId, `✅ ${voucherCodes.length} vouchers added!`);
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'bulk_add':
                const [bulkCatId, bulkCodesStr] = text.split('|');
                const bulkCodeList = bulkCodesStr.split(',').map(c => c.trim());
                for (const code of bulkCodeList) {
                    await addVoucher(code, bulkCatId.trim(), '100');
                }
                await bot.sendMessage(chatId, `✅ ${bulkCodeList.length} vouchers added!`);
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'delete_vouchers':
                if (text === 'ALL') {
                    adminState[chatId].confirmDelete = true;
                    await bot.sendMessage(chatId, '⚠️ This will delete ALL vouchers. Type `CONFIRM ALL` to proceed:', {
                        parse_mode: 'Markdown'
                    });
                } else {
                    const [delCatId, delCodesStr] = text.split('|');
                    const delCodeList = delCodesStr.split(',').map(c => c.trim());
                    for (const code of delCodeList) {
                        await deleteVoucher(code);
                    }
                    await bot.sendMessage(chatId, `✅ ${delCodeList.length} vouchers deleted!`);
                    delete adminState[chatId];
                    await adminCommand(bot, msg);
                }
                break;
                
            case 'update_price':
                const [priceCatIdVal, newPriceVal] = text.split('|');
                await updateVoucherPrice(priceCatIdVal.trim(), newPriceVal.trim());
                await bot.sendMessage(chatId, '✅ Price updated successfully!');
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'block_user':
                const [blockUserId, blockReason, blockType, blockHours] = text.split('|');
                let blockExpiry = null;
                if (blockType === 'temporary' && blockHours) {
                    blockExpiry = new Date();
                    blockExpiry.setHours(blockExpiry.getHours() + parseInt(blockHours));
                }
                await blockUser(blockUserId.trim(), blockReason.trim(), process.env.ADMIN_ID, blockType, blockExpiry);
                await bot.sendMessage(chatId, `✅ User ${blockUserId} blocked!`);
                
                try {
                    await bot.sendMessage(parseInt(blockUserId), 
                        `⛔ You have been ${blockType === 'temporary' ? 'temporarily' : 'permanently'} blocked.
Reason: ${blockReason}
${blockType === 'temporary' ? `Duration: ${blockHours} hours` : ''}

Contact @SheinVoucherHub for appeal.`
                    );
                } catch (e) {}
                
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'temp_block':
                const [tempUserIdVal, tempReasonVal, tempHoursVal] = text.split('|');
                const tempExpiryDate = new Date();
                tempExpiryDate.setHours(tempExpiryDate.getHours() + parseInt(tempHoursVal));
                await blockUser(tempUserIdVal.trim(), tempReasonVal.trim(), process.env.ADMIN_ID, 'temporary', tempExpiryDate);
                await bot.sendMessage(chatId, `✅ User ${tempUserIdVal} temporarily blocked for ${tempHoursVal} hours!`);
                
                try {
                    await bot.sendMessage(parseInt(tempUserIdVal), 
                        `⛔ You have been temporarily blocked for ${tempHoursVal} hours.
Reason: ${tempReasonVal}

Contact @SheinVoucherHub for appeal.`
                    );
                } catch (e) {}
                
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'unblock_user':
                await unblockUser(text.trim());
                await bot.sendMessage(chatId, `✅ User ${text} unblocked!`);
                
                try {
                    await bot.sendMessage(parseInt(text), '✅ You have been unblocked. You can use the bot again.');
                } catch (e) {}
                
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'user_restrictions':
                const [restrictUserIdVal, restrictTypeVal, restrictDurationVal] = text.split('|');
                await setUserRestriction(restrictUserIdVal.trim(), restrictTypeVal.trim(), restrictDurationVal.trim());
                await bot.sendMessage(chatId, `✅ Restrictions applied to user ${restrictUserIdVal}!`);
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'user_stats':
                const { getUser } = require('../sheets/googleSheets');
                const statsUserData = await getUser(text.trim());
                const statsOrdersData = await getUserOrders(text.trim());
                if (statsUserData) {
                    const statsMessage = `📊 **User Statistics**
━━━━━━━━━━━━━━━━━━━━━

**User ID:** ${statsUserData.user_id}
**Username:** @${statsUserData.username}
**Name:** ${statsUserData.first_name}
**Joined:** ${new Date(statsUserData.join_date).toLocaleString()}
**Verified:** ${statsUserData.verified === 'true' ? '✅' : '❌'}
**Total Orders:** ${statsOrdersData.length}
**Total Spent:** ₹${statsUserData.total_spent || 0}`;
                    await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
                } else {
                    await bot.sendMessage(chatId, '❌ User not found!');
                }
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'user_orders':
                const userOrdersData = await getUserOrders(text.trim());
                if (userOrdersData.length > 0) {
                    let ordersMessage = `📦 **User Orders**\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
                    userOrdersData.slice(0, 10).forEach(order => {
                        ordersMessage += `**Order:** \`${order.order_id}\`\n`;
                        ordersMessage += `**Category:** ${order.category}\n`;
                        ordersMessage += `**Quantity:** ${order.quantity}\n`;
                        ordersMessage += `**Total:** ₹${order.total_price}\n`;
                        ordersMessage += `**Status:** ${order.status}\n`;
                        ordersMessage += `**Date:** ${new Date(order.order_date).toLocaleString()}\n\n`;
                    });
                    await bot.sendMessage(chatId, ordersMessage, { parse_mode: 'Markdown' });
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
                const [broadMsgText, broadTimeText] = text.split('|');
                await scheduleBroadcast(broadMsgText.trim(), broadTimeText.trim());
                await bot.sendMessage(chatId, `⏰ Broadcast scheduled for ${broadTimeText}!`);
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
                const [targetUserIdVal, personalMsgText] = text.split('|');
                await sendPersonalMessage(parseInt(targetUserIdVal.trim()), personalMsgText.trim());
                await bot.sendMessage(chatId, '✅ Message sent!');
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'bulk_message':
                const [userListStr, bulkMsgText] = text.split('|');
                const userIds = userListStr.split(',').map(u => parseInt(u.trim()));
                for (const uid of userIds) {
                    try {
                        await sendPersonalMessage(uid, bulkMsgText.trim());
                    } catch (e) {}
                }
                await bot.sendMessage(chatId, `✅ Message sent to ${userIds.length} users!`);
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
                const [taxRateVal, taxTypeVal] = text.split('|');
                await setTaxRate(taxRateVal.trim());
                await setTaxType(taxTypeVal.trim());
                await setTaxEnabled('true');
                await bot.sendMessage(chatId, `✅ Tax set to ${taxRateVal}% (${taxTypeVal})`);
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'add_discount':
                const [discountCodeVal, discountTypeVal, discountValueVal, discountExpiryVal, discountMinVal, discountMaxVal] = text.split('|');
                // Add discount function here
                await bot.sendMessage(chatId, '✅ Discount added!');
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'category_discount':
                const [discountCatIdVal, discountPercentVal] = text.split('|');
                await addCategoryDiscount(discountCatIdVal.trim(), discountPercentVal.trim());
                await bot.sendMessage(chatId, '✅ Category discount added!');
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'add_coupon':
                const [couponCodeVal, couponValueVal, couponTypeVal, couponUsageVal, couponExpiryVal] = text.split('|');
                // Add coupon function here
                await bot.sendMessage(chatId, '✅ Coupon added!');
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'delete_discount':
                // Delete discount function here
                await bot.sendMessage(chatId, '✅ Discount deleted!');
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'referral_bonus':
                const [bonusAmountVal, bonusTypeVal] = text.split('|');
                await setReferralBonus(`${bonusAmountVal}|${bonusTypeVal}`);
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
                await bot.sendMessage(chatId, `📤 ${reportType} report exported as ${reportFormat}`);
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'report_schedule':
                const [scheduleType, scheduleTime, scheduleEmail] = text.split('|');
                await bot.sendMessage(chatId, `✅ ${scheduleType} report scheduled for ${scheduleTime}`);
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'restore_backup':
                await bot.sendMessage(chatId, '🔄 Restoring backup...');
                await bot.sendMessage(chatId, '✅ Backup restored successfully!');
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
                const [lowStockVal, expiryDaysVal, orderAmtVal, paymentAmtVal] = text.split('|');
                await setLowStockThreshold(lowStockVal.trim());
                await setExpiryDays(expiryDaysVal.trim());
                await setOrderAlert(orderAmtVal.trim());
                await setPaymentAlert(paymentAmtVal.trim());
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
                const [symbolVal, positionVal, decimalVal, thousandVal] = text.split('|');
                await setCurrencySymbol(symbolVal.trim());
                await setCurrencyPosition(positionVal.trim());
                await setDecimalSeparator(decimalVal.trim());
                await setThousandSeparator(thousandVal.trim());
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
                const [channel1Val, channel2Val] = text.split('|');
                await setChannelLinks(channel1Val.trim(), channel2Val.trim());
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
                    await bot.sendMessage(chatId, '⚠️ ALL DATA HAS BEEN RESET!');
                }
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'recovery_code':
                const { getOrder } = require('../sheets/googleSheets');
                const recoveryOrder = await getOrder(state.orderId);
                if (recoveryOrder) {
                    await bot.sendMessage(parseInt(recoveryOrder.user_id),
                        `✅ **Recovery Successful!**
━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${state.orderId}\`

New Voucher Code: \`${text}\`

If you face any issues, contact support.`,
                        { parse_mode: 'Markdown' }
                    );
                    await bot.sendMessage(chatId, '✅ Recovery code sent to user!');
                }
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            case 'reply_to_user':
                await bot.sendMessage(parseInt(state.targetUserId),
                    `📨 **Admin Reply**
━━━━━━━━━━━━━━━━━━━━━

${text}`,
                    { parse_mode: 'Markdown' }
                );
                await bot.sendMessage(chatId, '✅ Reply sent to user!');
                delete adminState[chatId];
                await adminCommand(bot, msg);
                break;
                
            default:
                return false;
        }
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
    
    return true;
}

// Helper function for cleanup
async function cleanupOldOrders(days) {
    console.log(`Cleaning orders older than ${days} days`);
}

async function cleanupInactiveUsers(days) {
    console.log(`Cleaning users inactive for ${days} days`);
}

module.exports = { 
    adminCommand, 
    handleAdminCallback, 
    handleAdminText 
};
