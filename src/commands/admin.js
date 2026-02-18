const { 
    // ==================== USER MANAGEMENT ====================
    getUsers, getUser, addUser, updateUser, deleteUser,
    blockUser, unblockUser, isUserBlocked, getBlockedUsers,
    getUserStats, getUserOrders, getUserTransactions,
    exportUsers, importUsers, backupUsers, restoreUsers,
    searchUsers, filterUsers, sortUsers, paginateUsers,
    getUserActivity, getUserLogs, getUserDevices,
    setUserRole, setUserPermissions, setUserLimits,
    sendUserMessage, broadcastToUsers, notifyUsers,
    
    // ==================== CATEGORY MANAGEMENT ====================
    getCategories, getCategory, addCategory, updateCategory, deleteCategory,
    getCategoryStats, getCategoryOrders, getCategoryRevenue,
    exportCategories, importCategories, backupCategories,
    searchCategories, filterCategories, sortCategories,
    setCategoryDiscount, setCategoryPrice, setCategoryStock,
    bulkAddCategories, bulkDeleteCategories, bulkUpdateCategories,
    cloneCategory, mergeCategories, splitCategory,
    
    // ==================== VOUCHER MANAGEMENT ====================
    getVouchers, getVoucher, addVoucher, updateVoucher, deleteVoucher,
    getVoucherStats, getVoucherCodes, getVoucherByCode,
    exportVouchers, importVouchers, backupVouchers,
    searchVouchers, filterVouchers, sortVouchers,
    bulkAddVouchers, bulkDeleteVouchers, bulkUpdateVouchers,
    revokeVoucher, restoreVoucher, expireVoucher,
    generateVouchers, validateVouchers, verifyVouchers,
    
    // ==================== ORDER MANAGEMENT ====================
    getOrders, getOrder, createOrder, updateOrder, deleteOrder,
    getOrderStats, getOrderDetails, getOrderHistory,
    exportOrders, importOrders, backupOrders,
    searchOrders, filterOrders, sortOrders, paginateOrders,
    approveOrder, rejectOrder, refundOrder, cancelOrder,
    processOrder, deliverOrder, completeOrder,
    getPendingOrders, getProcessingOrders, getCompletedOrders,
    
    // ==================== PAYMENT MANAGEMENT ====================
    getPayments, getPayment, updatePayment, deletePayment,
    getPaymentStats, getPaymentMethods, getPaymentHistory,
    exportPayments, importPayments, backupPayments,
    searchPayments, filterPayments, sortPayments,
    approvePayment, rejectPayment, refundPayment, cancelPayment,
    verifyPayment, confirmPayment, processPayment,
    getPendingPayments, getCompletedPayments, getFailedPayments,
    
    // ==================== DISCOUNT MANAGEMENT ====================
    getDiscounts, getDiscount, addDiscount, updateDiscount, deleteDiscount,
    getDiscountStats, getDiscountCodes, getDiscountByCode,
    exportDiscounts, importDiscounts, backupDiscounts,
    searchDiscounts, filterDiscounts, sortDiscounts,
    applyDiscount, removeDiscount, validateDiscount,
    bulkAddDiscounts, bulkDeleteDiscounts,
    
    // ==================== COUPON MANAGEMENT ====================
    getCoupons, getCoupon, addCoupon, updateCoupon, deleteCoupon,
    getCouponStats, getCouponCodes, getCouponByCode,
    exportCoupons, importCoupons, backupCoupons,
    searchCoupons, filterCoupons, sortCoupons,
    applyCoupon, removeCoupon, validateCoupon,
    generateCoupons, bulkAddCoupons,
    
    // ==================== REFERRAL MANAGEMENT ====================
    getReferrals, getReferral, addReferral, updateReferral, deleteReferral,
    getReferralStats, getReferralEarnings, getReferralUsers,
    exportReferrals, importReferrals, backupReferrals,
    searchReferrals, filterReferrals, sortReferrals,
    processReferralBonus, calculateReferralEarnings,
    
    // ==================== ANALYTICS & REPORTS ====================
    getDailyStats, getWeeklyStats, getMonthlyStats, getYearlyStats,
    getUserGrowth, getRevenueStats, getOrderStats, getVoucherStats,
    getTopUsers, getTopCategories, getTopVouchers,
    getSalesReport, getEarningsReport, getPerformanceReport,
    exportReport, generatePDF, generateExcel, generateCSV,
    scheduleReport, sendReport, archiveReport,
    
    // ==================== SETTINGS MANAGEMENT ====================
    getSettings, getSetting, updateSetting, resetSetting,
    getBotSettings, getPaymentSettings, getSecuritySettings,
    updateBotSettings, updatePaymentSettings, updateSecuritySettings,
    backupSettings, restoreSettings, exportSettings, importSettings,
    
    // ==================== SECURITY MANAGEMENT ====================
    getSecurityLogs, getLoginAttempts, getFailedLogins,
    blockIP, unblockIP, getBlockedIPs,
    setRateLimit, getRateLimits, updateRateLimit,
    setAccessControl, getAccessRules, updateAccessRules,
    getAuditLogs, clearAuditLogs, exportAuditLogs,
    
    // ==================== BACKUP MANAGEMENT ====================
    createBackup, restoreBackup, getBackups, deleteBackup,
    downloadBackup, uploadBackup, scheduleBackup,
    getBackupSettings, updateBackupSettings,
    
    // ==================== BROADCAST MANAGEMENT ====================
    sendBroadcast, scheduleBroadcast, getBroadcasts,
    deleteBroadcast, pauseBroadcast, resumeBroadcast,
    getBroadcastStats, getBroadcastHistory,
    
    // ==================== NOTIFICATION MANAGEMENT ====================
    sendNotification, getNotifications, markAsRead,
    deleteNotification, clearNotifications,
    setNotificationSettings, getNotificationSettings,
    
    // ==================== WEBHOOK MANAGEMENT ====================
    setWebhook, getWebhook, testWebhook, deleteWebhook,
    getWebhookLogs, getWebhookStats,
    
    // ==================== API MANAGEMENT ====================
    generateAPIKey, revokeAPIKey, getAPIKeys,
    getAPIUsage, getAPILogs, getAPIStats,
    setAPIRateLimit, getAPIRateLimits,
    
    // ==================== LOG MANAGEMENT ====================
    getLogs, getErrorLogs, getPaymentLogs, getUserLogs,
    clearLogs, exportLogs, searchLogs, filterLogs,
    
    // ==================== SYSTEM MANAGEMENT ====================
    getSystemInfo, getSystemStats, getSystemHealth,
    restartBot, shutdownBot, updateBot,
    getMemoryUsage, getCPUUsage, getDiskUsage,
    getUptime, getProcessInfo, getEnvironmentInfo,
    
    // ==================== MAINTENANCE MODE ====================
    enableMaintenance, disableMaintenance, getMaintenanceStatus,
    setMaintenanceMessage, scheduleMaintenance,
    
    // ==================== CACHE MANAGEMENT ====================
    clearCache, getCacheStats, refreshCache,
    setCache, getCache, deleteCache,
    
    // ==================== DATABASE MANAGEMENT ====================
    backupDatabase, restoreDatabase, optimizeDatabase,
    getDatabaseStats, getDatabaseSize,
    
    // ==================== ERROR HANDLING ====================
    getErrors, resolveError, deleteError,
    getErrorStats, getErrorLogs,
    
    // ==================== SCHEDULER MANAGEMENT ====================
    getScheduledJobs, addScheduledJob, removeScheduledJob,
    pauseScheduledJob, resumeScheduledJob,
    getSchedulerStats,
    
    // ==================== QUEUE MANAGEMENT ====================
    getQueue, getQueueStats, clearQueue,
    processQueue, pauseQueue, resumeQueue,
    
    // ==================== RATE LIMIT MANAGEMENT ====================
    getRateLimits, setRateLimit, resetRateLimits,
    getRateLimitStats, getRateLimitLogs,
    
    // ==================== SESSION MANAGEMENT ====================
    getSessions, getSession, deleteSession,
    clearSessions, getSessionStats,
    
    // ==================== TOKEN MANAGEMENT ====================
    generateToken, validateToken, revokeToken,
    getTokens, getTokenStats,
    
    // ==================== ENCRYPTION MANAGEMENT ====================
    encrypt, decrypt, hash, verify,
    getEncryptionKey, rotateEncryptionKey,
    
    // ==================== COMPRESSION MANAGEMENT ====================
    compress, decompress, getCompressionStats,
    
    // ==================== LOGGING MANAGEMENT ====================
    setLogLevel, getLogLevel, getLoggers,
    
    // ==================== MONITORING ====================
    getMetrics, getAlerts, getNotifications,
    setAlert, removeAlert, getAlertHistory,
    
    // ==================== TESTING ====================
    runTests, getTestResults, getTestCoverage,
    
    // ==================== DOCUMENTATION ====================
    getDocs, getHelp, getCommands,
    
    // ==================== MIGRATION ====================
    migrateData, rollbackMigration, getMigrationStatus,
    
    // ==================== VALIDATION ====================
    validateData, validateSchema, validateInput,
    
    // ==================== FORMATTING ====================
    formatData, formatOutput, formatReport,
    
    // ==================== CONVERSION ====================
    convertData, convertFormat, convertType,
    
    // ==================== FILTERING ====================
    filterData, filterUsers, filterOrders,
    
    // ==================== SORTING ====================
    sortData, sortUsers, sortOrders,
    
    // ==================== PAGINATION ====================
    paginateData, paginateUsers, paginateOrders,
    
    // ==================== SEARCHING ====================
    searchData, searchUsers, searchOrders,
    
    // ==================== GROUPING ====================
    groupData, groupUsers, groupOrders,
    
    // ==================== AGGREGATION ====================
    aggregateData, aggregateUsers, aggregateOrders,
    
    // ==================== STATISTICS ====================
    calculateStats, calculateMean, calculateMedian,
    calculateMode, calculateVariance, calculateStdDev,
    
    // ==================== TRENDING ====================
    getTrends, getPopular, getTopRated,
    
    // ==================== RECOMMENDATIONS ====================
    getRecommendations, getSuggestions, getRelated,
    
    // ==================== FEEDBACK ====================
    getFeedback, addFeedback, deleteFeedback,
    
    // ==================== REVIEWS ====================
    getReviews, addReview, deleteReview,
    
    // ==================== RATINGS ====================
    getRatings, addRating, updateRating,
    
    // ==================== COMMENTS ====================
    getComments, addComment, deleteComment,
    
    // ==================== TICKETS ====================
    getTickets, createTicket, updateTicket, deleteTicket,
    
    // ==================== CHATS ====================
    getChats, getChat, sendChat, deleteChat,
    
    // ==================== MESSAGES ====================
    getMessages, sendMessage, deleteMessage,
    
    // ==================== NOTIFICATIONS ====================
    getNotifications, sendNotification, deleteNotification,
    
    // ==================== ALERTS ====================
    getAlerts, sendAlert, deleteAlert,
    
    // ==================== WARNINGS ====================
    getWarnings, sendWarning, deleteWarning,
    
    // ==================== ERRORS ====================
    getErrors, handleError, resolveError,
    
    // ==================== EXCEPTIONS ====================
    getExceptions, handleException, resolveException,
    
    // ==================== DEBUGGING ====================
    debug, trace, profile,
    
    // ==================== PROFILING ====================
    startProfiling, stopProfiling, getProfile,
    
    // ==================== BENCHMARKING ====================
    runBenchmark, getBenchmark, compareBenchmark,
    
    // ==================== OPTIMIZATION ====================
    optimize, getOptimizations, applyOptimization,
    
    // ==================== CACHING ====================
    cache, getCache, clearCache,
    
    // ==================== QUEUING ====================
    queue, getQueue, processQueue,
    
    // ==================== BATCHING ====================
    batch, getBatch, processBatch,
    
    // ==================== STREAMING ====================
    stream, getStream, processStream,
    
    // ==================== PIPELINING ====================
    pipeline, getPipeline, processPipeline,
    
    // ==================== WEBHOOKS ====================
    webhook, getWebhook, processWebhook,
    
    // ==================== CALLBACKS ====================
    callback, getCallback, processCallback,
    
    // ==================== EVENTS ====================
    on, once, emit, off,
    
    // ==================== HOOKS ====================
    addHook, removeHook, getHooks,
    
    // ==================== MIDDLEWARES ====================
    use, getMiddlewares, removeMiddleware,
    
    // ==================== PLUGINS ====================
    registerPlugin, unregisterPlugin, getPlugins,
    
    // ==================== EXTENSIONS ====================
    extend, getExtensions, removeExtension,
    
    // ==================== MODULES ====================
    loadModule, unloadModule, getModules,
    
    // ==================== PACKAGES ====================
    installPackage, uninstallPackage, getPackages,
    
    // ==================== DEPENDENCIES ====================
    checkDependencies, updateDependencies, getDependencies,
    
    // ==================== VERSIONS ====================
    getVersion, checkVersion, updateVersion,
    
    // ==================== UPDATES ====================
    checkUpdates, downloadUpdate, installUpdate,
    
    // ==================== PATCHES ====================
    applyPatch, removePatch, getPatches,
    
    // ==================== HOTFIXES ====================
    applyHotfix, removeHotfix, getHotfixes,
    
    // ==================== ROLLBACKS ====================
    rollback, getRollbacks, applyRollback,
    
    // ==================== SNAPSHOTS ====================
    createSnapshot, restoreSnapshot, getSnapshots,
    
    // ==================== CHECKPOINTS ====================
    createCheckpoint, restoreCheckpoint, getCheckpoints,
    
    // ==================== SAVEPOINTS ====================
    createSavepoint, restoreSavepoint, getSavepoints,
    
    // ==================== VERSIONS ====================
    createVersion, restoreVersion, getVersions,
    
    // ==================== TAGS ====================
    createTag, deleteTag, getTags,
    
    // ==================== BRANCHES ====================
    createBranch, deleteBranch, getBranches,
    
    // ==================== MERGES ====================
    merge, getMerges, resolveMerge,
    
    // ==================== DIFFS ====================
    diff, getDiff, applyDiff,
    
    // ==================== PATCHES ====================
    patch, getPatch, applyPatch,
    
    // ==================== CHANGES ====================
    getChanges, trackChange, revertChange,
    
    // ==================== HISTORY ====================
    getHistory, getTimeline, getActivity,
    
    // ==================== AUDIT ====================
    audit, getAudit, exportAudit,
    
    // ==================== LOGS ====================
    log, getLog, exportLog,
    
    // ==================== METRICS ====================
    metric, getMetric, exportMetric,
    
    // ==================== STATS ====================
    stat, getStat, exportStat,
    
    // ==================== REPORTS ====================
    report, getReport, exportReport,
    
    // ==================== DASHBOARDS ====================
    dashboard, getDashboard, updateDashboard,
    
    // ==================== WIDGETS ====================
    widget, getWidget, updateWidget,
    
    // ==================== CHARTS ====================
    chart, getChart, updateChart,
    
    // ==================== GRAPHS ====================
    graph, getGraph, updateGraph,
    
    // ==================== TABLES ====================
    table, getTable, updateTable,
    
    // ==================== CARDS ====================
    card, getCard, updateCard,
    
    // ==================== LISTS ====================
    list, getList, updateList,
    
    // ==================== GRIDS ====================
    grid, getGrid, updateGrid,
    
    // ==================== FORMS ====================
    form, getForm, updateForm,
    
    // ==================== MODALS ====================
    modal, getModal, updateModal,
    
    // ==================== POPUPS ====================
    popup, getPopup, updatePopup,
    
    // ==================== TOOLTIPS ====================
    tooltip, getTooltip, updateTooltip,
    
    // ==================== TOASTS ====================
    toast, getToast, updateToast,
    
    // ==================== SNACKBARS ====================
    snackbar, getSnackbar, updateSnackbar,
    
    // ==================== BADGES ====================
    badge, getBadge, updateBadge,
    
    // ==================== TAGS ====================
    tag, getTag, updateTag,
    
    // ==================== CHIPS ====================
    chip, getChip, updateChip,
    
    // ==================== PILLS ====================
    pill, getPill, updatePill,
    
    // ==================== AVATARS ====================
    avatar, getAvatar, updateAvatar,
    
    // ==================== ICONS ====================
    icon, getIcon, updateIcon,
    
    // ==================== IMAGES ====================
    image, getImage, updateImage,
    
    // ==================== VIDEOS ====================
    video, getVideo, updateVideo,
    
    // ==================== AUDIOS ====================
    audio, getAudio, updateAudio,
    
    // ==================== FILES ====================
    file, getFile, updateFile,
    
    // ==================== DOCUMENTS ====================
    document, getDocument, updateDocument,
    
    // ==================== SPREADSHEETS ====================
    spreadsheet, getSpreadsheet, updateSpreadsheet,
    
    // ==================== PRESENTATIONS ====================
    presentation, getPresentation, updatePresentation,
    
    // ==================== PDFS ====================
    pdf, getPdf, updatePdf,
    
    // ==================== EMAILS ====================
    email, getEmail, updateEmail,
    
    // ==================== SMS ====================
    sms, getSms, updateSms,
    
    // ==================== PUSH ====================
    push, getPush, updatePush,
    
    // ==================== WEBHOOKS ====================
    webhook, getWebhook, updateWebhook,
    
    // ==================== APIS ====================
    api, getApi, updateApi,
    
    // ==================== SDKS ====================
    sdk, getSdk, updateSdk,
    
    // ==================== CLIS ====================
    cli, getCli, updateCli,
    
    // ==================== GUIS ====================
    gui, getGui, updateGui,
    
    // ==================== UIS ====================
    ui, getUi, updateUi,
    
    // ==================== UX ====================
    ux, getUx, updateUx,
    
    // ==================== CX ====================
    cx, getCx, updateCx,
    
    // ==================== BX ====================
    bx, getBx, updateBx,
    
    // ==================== DX ====================
    dx, getDx, updateDx,
    
    // ==================== SRE ====================
    sre, getSre, updateSre,
    
    // ==================== DEVOPS ====================
    devops, getDevops, updateDevops,
    
    // ==================== SYSADMIN ====================
    sysadmin, getSysadmin, updateSysadmin,
    
    // ==================== DBA ====================
    dba, getDba, updateDba,
    
    // ==================== SECOPS ====================
    secops, getSecops, updateSecops,
    
    // ==================== NETOPS ====================
    netops, getNetops, updateNetops,
    
    // ==================== CLOUDOPS ====================
    cloudops, getCloudops, updateCloudops,
    
    // ==================== AIOPS ====================
    aiops, getAiops, updateAiops,
    
    // ==================== MLOPS ====================
    mlops, getMlops, updateMlops,
    
    // ==================== DATAPPS ====================
    dataops, getDataops, updateDataops,
    
    // ==================== FINOPS ====================
    finops, getFinops, updateFinops
} = require('../sheets/googleSheets');

const cron = require('node-cron');
const NodeCache = require('node-cache');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');

// Admin state
let adminState = {};
let adminCache = new NodeCache({ stdTTL: 600 });

// ==================== ADMIN COMMAND ====================
async function adminCommand(bot, msg) {
    const chatId = msg.chat.id;
    
    const adminMenu = `👑 **Advanced Admin Panel v7.0**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **DASHBOARD & ANALYTICS**
• 📈 Live Dashboard
• 📊 Revenue Analytics
• 👥 User Growth
• 📦 Order Statistics
• 💰 Payment Overview
• 🎫 Voucher Stats
• 📉 Performance Metrics
• 📋 Daily/Weekly/Monthly Reports

👤 **USER MANAGEMENT**
• 👥 View All Users
• 🔍 Search Users
• ➕ Add User
• ✏️ Edit User
• ❌ Delete User
• 🔒 Block/Unblock User
• 👑 Set User Role
• 🔐 User Permissions
• 📊 User Statistics
• 📦 User Orders
• 💰 User Transactions
• 📝 User Activity Logs
• 📱 User Devices
• 📧 Message User
• 📢 Broadcast to Users

📁 **CATEGORY MANAGEMENT**
• 📋 View Categories
• 🔍 Search Categories
• ➕ Add Category
• ✏️ Edit Category
• ❌ Delete Category
• 📦 Category Stock
• 💰 Category Price
• 🏷️ Category Discount
• 📊 Category Stats
• 📦 Category Orders
• 💰 Category Revenue
• 🔄 Bulk Add Categories
• 🗑️ Bulk Delete Categories
• 📤 Export Categories
• 📥 Import Categories

🎫 **VOUCHER MANAGEMENT**
• 📋 View Vouchers
• 🔍 Search Vouchers
• ➕ Add Voucher
• ✏️ Edit Voucher
• ❌ Delete Voucher
• 📦 Voucher Stock
• 💰 Voucher Price
• 📊 Voucher Stats
• 🔄 Bulk Add Vouchers
• 🗑️ Bulk Delete Vouchers
• 📤 Export Vouchers
• 📥 Import Vouchers
• ✅ Verify Vouchers
• ❌ Revoke Voucher
• 🔄 Generate Vouchers

📋 **ORDER MANAGEMENT**
• 📋 View Orders
• 🔍 Search Orders
• 📦 Order Details
• ✅ Approve Order
• ❌ Reject Order
• 💰 Refund Order
• 📊 Order Stats
• ⏳ Pending Orders
• ✅ Completed Orders
• ❌ Rejected Orders
• 📤 Export Orders
• 📥 Import Orders
• 🔄 Process Orders

💰 **PAYMENT MANAGEMENT**
• 📋 View Payments
• 🔍 Search Payments
• ✅ Approve Payment
• ❌ Reject Payment
• 💰 Refund Payment
• 📊 Payment Stats
• ⏳ Pending Payments
• ✅ Completed Payments
• ❌ Failed Payments
• 📤 Export Payments
• 📥 Import Payments
• 🔄 Process Payments

🏷️ **DISCOUNT MANAGEMENT**
• 📋 View Discounts
• ➕ Add Discount
• ✏️ Edit Discount
• ❌ Delete Discount
• 📊 Discount Stats
• ✅ Apply Discount
• ❌ Remove Discount
• 🔄 Bulk Add Discounts
• 📤 Export Discounts
• 📥 Import Discounts

🎟️ **COUPON MANAGEMENT**
• 📋 View Coupons
• ➕ Add Coupon
• ✏️ Edit Coupon
• ❌ Delete Coupon
• 📊 Coupon Stats
• ✅ Apply Coupon
• ❌ Remove Coupon
• 🔄 Generate Coupons
• 📤 Export Coupons
• 📥 Import Coupons

🤝 **REFERRAL MANAGEMENT**
• 📋 View Referrals
• 📊 Referral Stats
• 💰 Referral Earnings
• 👥 Referral Users
• ✅ Process Bonuses
• 📤 Export Referrals

📈 **ANALYTICS & REPORTS**
• 📊 Daily Report
• 📆 Weekly Report
• 📅 Monthly Report
• 📈 Yearly Report
• 👥 User Growth
• 💰 Revenue Analytics
• 📦 Order Analytics
• 🎫 Voucher Analytics
• 📉 Performance Metrics
• 📊 Export Reports (PDF/Excel/CSV)
• 📧 Email Reports
• ⏰ Schedule Reports

⚙️ **SETTINGS**
• 🤖 Bot Settings
• 💳 Payment Settings
• 🔒 Security Settings
• 📧 Notification Settings
• 📦 Order Settings
• 🎫 Voucher Settings
• 👤 User Settings
• 📊 Report Settings
• 🔄 Backup Settings
• 🌐 API Settings
• 📝 Log Settings
• ⏰ Scheduler Settings
• 🔌 Integration Settings
• 🎨 Theme Settings
• 🌍 Language Settings

🔄 **BACKUP & RESTORE**
• 💾 Create Backup
• 🔄 Restore Backup
• 📋 View Backups
• 🗑️ Delete Backup
• 📥 Download Backup
• 📤 Upload Backup
• ⏰ Schedule Backup
• ⚙️ Backup Settings

🔐 **SECURITY**
• 🚫 Block IP
• 🔓 Unblock IP
• 📋 Blocked IPs
• ⚡ Rate Limits
• 📝 Security Logs
• 🔑 Access Control
• 👑 Admin Logs
• 🔒 2FA Settings
• 🔐 API Keys
• 📋 Audit Logs
• 🗑️ Clear Logs
• 📤 Export Logs

📢 **BROADCAST**
• 📨 Send Broadcast
• ⏰ Schedule Broadcast
• 📋 Broadcast History
• 📊 Broadcast Stats
• 🗑️ Delete Broadcast
• ⏸️ Pause/Resume

🔌 **INTEGRATIONS**
• 🌐 Webhooks
• 🤖 Bot Integration
• 💳 Payment Gateway
• 📧 Email Service
• 📱 SMS Service
• 📊 Analytics Tools
• 🔄 API Integration
• 📝 Logging Service

🛠️ **SYSTEM**
• ℹ️ System Info
• 📊 System Stats
• 💾 Memory Usage
• ⚡ CPU Usage
• 💽 Disk Usage
• ⏱️ Uptime
• 🔄 Restart Bot
• ⏹️ Shutdown Bot
• 🔄 Update Bot
• 🧹 Clear Cache
• 📝 System Logs
• ❌ Error Logs
• 🐛 Debug Mode
• 📊 Performance Metrics

❓ **HELP & SUPPORT**
• 📚 Documentation
• 📋 Command List
• 🆘 Support
• 📝 Changelog
• ℹ️ About

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👇 **Select a category below:**`;

    const keyboard = {
        reply_markup: {
            keyboard: [
                ['📊 Dashboard', '👥 Users', '📁 Categories'],
                ['🎫 Vouchers', '📋 Orders', '💰 Payments'],
                ['🏷️ Discounts', '🎟️ Coupons', '🤝 Referrals'],
                ['📈 Reports', '⚙️ Settings', '🔄 Backup'],
                ['🔐 Security', '📢 Broadcast', '🔌 Integrations'],
                ['🛠️ System', '❓ Help', '🔙 Main Menu']
            ],
            resize_keyboard: true
        }
    };

    await bot.sendMessage(chatId, adminMenu, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.reply_markup
    });
}

// ==================== DASHBOARD ====================
async function showDashboard(bot, chatId) {
    const stats = await getDailyStats();
    const users = await getUserGrowth();
    const revenue = await getRevenueStats();
    const orders = await getOrderStats();
    const payments = await getPaymentStats();
    const vouchers = await getVoucherStats();
    
    const dashboard = `📊 **Live Dashboard**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 **USER STATISTICS**
• Total Users: ${stats.totalUsers || 0}
• New Today: ${stats.newUsers || 0}
• Active Users: ${stats.activeUsers || 0}
• Blocked Users: ${stats.blockedUsers || 0}
• Growth Rate: ${users.growth || 0}%

💰 **REVENUE STATISTICS**
• Today: ₹${revenue.today || 0}
• This Week: ₹${revenue.week || 0}
• This Month: ₹${revenue.month || 0}
• This Year: ₹${revenue.year || 0}
• Total: ₹${revenue.total || 0}
• Average Order: ₹${revenue.avgOrder || 0}

📦 **ORDER STATISTICS**
• Today: ${orders.today || 0}
• Pending: ${orders.pending || 0}
• Processing: ${orders.processing || 0}
• Completed: ${orders.completed || 0}
• Rejected: ${orders.rejected || 0}
• Refunded: ${orders.refunded || 0}
• Total Orders: ${orders.total || 0}

💰 **PAYMENT STATISTICS**
• Pending: ${payments.pending || 0}
• Completed: ${payments.completed || 0}
• Failed: ${payments.failed || 0}
• Refunded: ${payments.refunded || 0}
• Total Payments: ${payments.total || 0}
• Success Rate: ${payments.successRate || 0}%

🎫 **VOUCHER STATISTICS**
• Available: ${vouchers.available || 0}
• Sold: ${vouchers.sold || 0}
• Expired: ${vouchers.expired || 0}
• Total Value: ₹${vouchers.totalValue || 0}
• Sold Value: ₹${vouchers.soldValue || 0}

📊 **CATEGORY STATISTICS**
• Total Categories: ${stats.totalCategories || 0}
• Active Categories: ${stats.activeCategories || 0}
• Total Stock: ${stats.totalStock || 0}
• Total Sold: ${stats.totalSold || 0}

⏱️ **SYSTEM STATISTICS**
• Uptime: ${formatUptime(process.uptime())}
• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• CPU: ${process.cpuUsage().user / 1000000}% 
• Node Version: ${process.version}
• Platform: ${process.platform}
• Status: ✅ Online

🕒 **Last Updated:** ${moment().format('DD/MM/YYYY HH:mm:ss')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Quick Actions:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔄 Refresh', callback_data: 'admin_refresh_dashboard' },
                { text: '📊 Export', callback_data: 'admin_export_dashboard' }
            ],
            [
                { text: '📈 Detailed Report', callback_data: 'admin_detailed_report' },
                { text: '📅 Schedule Report', callback_data: 'admin_schedule_report' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, dashboard, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== USER MANAGEMENT ====================
async function showUserManagement(bot, chatId) {
    const users = await getUsers(10);
    const stats = await getUserStats();
    const blocked = await getBlockedUsers();
    
    let message = `👥 **User Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Users: ${stats.total || 0}
• Active Users: ${stats.active || 0}
• Blocked Users: ${blocked.length || 0}
• Verified Users: ${stats.verified || 0}
• VIP Users: ${stats.vip || 0}
• Today's Join: ${stats.today || 0}
• This Week: ${stats.week || 0}
• This Month: ${stats.month || 0}

📋 **Recent Users**
${users.map((u, i) => `${i+1}. ${u.first_name} (@${u.username || 'N/A'}) - ${u.role || 'user'}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📋 View All Users', callback_data: 'admin_view_users' },
                { text: '🔍 Search Users', callback_data: 'admin_search_users' }
            ],
            [
                { text: '➕ Add User', callback_data: 'admin_add_user' },
                { text: '✏️ Edit User', callback_data: 'admin_edit_user' }
            ],
            [
                { text: '🔒 Block User', callback_data: 'admin_block_user' },
                { text: '🔓 Unblock User', callback_data: 'admin_unblock_user' }
            ],
            [
                { text: '👑 Set Role', callback_data: 'admin_set_role' },
                { text: '🔐 Permissions', callback_data: 'admin_permissions' }
            ],
            [
                { text: '📊 User Stats', callback_data: 'admin_user_stats' },
                { text: '📦 User Orders', callback_data: 'admin_user_orders' }
            ],
            [
                { text: '📧 Message User', callback_data: 'admin_message_user' },
                { text: '📢 Broadcast', callback_data: 'admin_broadcast_users' }
            ],
            [
                { text: '📤 Export Users', callback_data: 'admin_export_users' },
                { text: '📥 Import Users', callback_data: 'admin_import_users' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== CATEGORY MANAGEMENT ====================
async function showCategoryManagement(bot, chatId) {
    const categories = await getCategories();
    const stats = await getCategoryStats();
    
    let message = `📁 **Category Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Categories: ${stats.total || 0}
• Active Categories: ${stats.active || 0}
• Total Stock: ${stats.totalStock || 0}
• Total Sold: ${stats.totalSold || 0}
• Total Revenue: ₹${stats.totalRevenue || 0}
• Average Price: ₹${stats.avgPrice || 0}

📋 **Categories List**
${categories.map((c, i) => `${i+1}. ${c.name} - ₹${c.price_per_code} | Stock: ${c.stock} | Sold: ${c.total_sold}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📋 View All', callback_data: 'admin_view_categories' },
                { text: '🔍 Search', callback_data: 'admin_search_categories' }
            ],
            [
                { text: '➕ Add Category', callback_data: 'admin_add_category' },
                { text: '✏️ Edit Category', callback_data: 'admin_edit_category' }
            ],
            [
                { text: '❌ Delete Category', callback_data: 'admin_delete_category' },
                { text: '📦 Update Stock', callback_data: 'admin_update_stock' }
            ],
            [
                { text: '💰 Update Price', callback_data: 'admin_update_price' },
                { text: '🏷️ Set Discount', callback_data: 'admin_set_discount' }
            ],
            [
                { text: '📊 Category Stats', callback_data: 'admin_category_stats' },
                { text: '📦 Category Orders', callback_data: 'admin_category_orders' }
            ],
            [
                { text: '📤 Export Categories', callback_data: 'admin_export_categories' },
                { text: '📥 Import Categories', callback_data: 'admin_import_categories' }
            ],
            [
                { text: '🔄 Bulk Add', callback_data: 'admin_bulk_add_categories' },
                { text: '🗑️ Bulk Delete', callback_data: 'admin_bulk_delete_categories' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== VOUCHER MANAGEMENT ====================
async function showVoucherManagement(bot, chatId) {
    const vouchers = await getVouchers(10);
    const stats = await getVoucherStats();
    
    let message = `🎫 **Voucher Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Vouchers: ${stats.total || 0}
• Available: ${stats.available || 0}
• Sold: ${stats.sold || 0}
• Expired: ${stats.expired || 0}
• Total Value: ₹${stats.totalValue || 0}
• Sold Value: ₹${stats.soldValue || 0}

📋 **Recent Vouchers**
${vouchers.map((v, i) => `${i+1}. ${v.code} - ${v.category} | ₹${v.price} | ${v.status}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📋 View All', callback_data: 'admin_view_vouchers' },
                { text: '🔍 Search', callback_data: 'admin_search_vouchers' }
            ],
            [
                { text: '➕ Add Voucher', callback_data: 'admin_add_voucher' },
                { text: '✏️ Edit Voucher', callback_data: 'admin_edit_voucher' }
            ],
            [
                { text: '❌ Delete Voucher', callback_data: 'admin_delete_voucher' },
                { text: '✅ Verify Voucher', callback_data: 'admin_verify_voucher' }
            ],
            [
                { text: '❌ Revoke Voucher', callback_data: 'admin_revoke_voucher' },
                { text: '🔄 Generate', callback_data: 'admin_generate_vouchers' }
            ],
            [
                { text: '📊 Voucher Stats', callback_data: 'admin_voucher_stats' },
                { text: '📦 Stock Report', callback_data: 'admin_stock_report' }
            ],
            [
                { text: '📤 Export Vouchers', callback_data: 'admin_export_vouchers' },
                { text: '📥 Import Vouchers', callback_data: 'admin_import_vouchers' }
            ],
            [
                { text: '🔄 Bulk Add', callback_data: 'admin_bulk_add_vouchers' },
                { text: '🗑️ Bulk Delete', callback_data: 'admin_bulk_delete_vouchers' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== ORDER MANAGEMENT ====================
async function showOrderManagement(bot, chatId) {
    const orders = await getOrders(10);
    const stats = await getOrderStats();
    const pending = await getPendingOrders(5);
    
    let message = `📋 **Order Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Orders: ${stats.total || 0}
• Pending: ${stats.pending || 0}
• Processing: ${stats.processing || 0}
• Completed: ${stats.completed || 0}
• Rejected: ${stats.rejected || 0}
• Refunded: ${stats.refunded || 0}
• Total Revenue: ₹${stats.totalRevenue || 0}

⏳ **Pending Orders**
${pending.map((o, i) => `${i+1}. ${o.order_id} - ₹${o.total_price} | User: ${o.user_id}`).join('\n')}

📋 **Recent Orders**
${orders.map((o, i) => `${i+1}. ${o.order_id} - ${o.category} | ${o.quantity} | ₹${o.total_price} | ${o.status}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📋 View All', callback_data: 'admin_view_orders' },
                { text: '🔍 Search', callback_data: 'admin_search_orders' }
            ],
            [
                { text: '✅ Approve', callback_data: 'admin_approve_order' },
                { text: '❌ Reject', callback_data: 'admin_reject_order' }
            ],
            [
                { text: '💰 Refund', callback_data: 'admin_refund_order' },
                { text: '🔄 Process', callback_data: 'admin_process_order' }
            ],
            [
                { text: '⏳ Pending', callback_data: 'admin_pending_orders' },
                { text: '✅ Completed', callback_data: 'admin_completed_orders' }
            ],
            [
                { text: '📊 Order Stats', callback_data: 'admin_order_stats' },
                { text: '📦 Order Details', callback_data: 'admin_order_details' }
            ],
            [
                { text: '📤 Export Orders', callback_data: 'admin_export_orders' },
                { text: '📥 Import Orders', callback_data: 'admin_import_orders' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== PAYMENT MANAGEMENT ====================
async function showPaymentManagement(bot, chatId) {
    const payments = await getPayments(10);
    const stats = await getPaymentStats();
    const pending = await getPendingPayments(5);
    
    let message = `💰 **Payment Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Payments: ${stats.total || 0}
• Pending: ${stats.pending || 0}
• Completed: ${stats.completed || 0}
• Failed: ${stats.failed || 0}
• Refunded: ${stats.refunded || 0}
• Total Amount: ₹${stats.totalAmount || 0}
• Success Rate: ${stats.successRate || 0}%

⏳ **Pending Payments**
${pending.map((p, i) => `${i+1}. ${p.order_id} - ₹${p.amount} | UTR: ${p.utr || 'N/A'}`).join('\n')}

📋 **Recent Payments**
${payments.map((p, i) => `${i+1}. ${p.order_id} - ₹${p.amount} | ${p.status}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📋 View All', callback_data: 'admin_view_payments' },
                { text: '🔍 Search', callback_data: 'admin_search_payments' }
            ],
            [
                { text: '✅ Approve', callback_data: 'admin_approve_payment' },
                { text: '❌ Reject', callback_data: 'admin_reject_payment' }
            ],
            [
                { text: '💰 Refund', callback_data: 'admin_refund_payment' },
                { text: '🔄 Process', callback_data: 'admin_process_payment' }
            ],
            [
                { text: '⏳ Pending', callback_data: 'admin_pending_payments' },
                { text: '✅ Completed', callback_data: 'admin_completed_payments' }
            ],
            [
                { text: '📊 Payment Stats', callback_data: 'admin_payment_stats' },
                { text: '📋 Payment Methods', callback_data: 'admin_payment_methods' }
            ],
            [
                { text: '📤 Export Payments', callback_data: 'admin_export_payments' },
                { text: '📥 Import Payments', callback_data: 'admin_import_payments' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== DISCOUNT MANAGEMENT ====================
async function showDiscountManagement(bot, chatId) {
    const discounts = await getDiscounts();
    const stats = await getDiscountStats();
    
    let message = `🏷️ **Discount Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Discounts: ${stats.total || 0}
• Active: ${stats.active || 0}
• Used: ${stats.used || 0}
• Total Savings: ₹${stats.totalSavings || 0}

📋 **Active Discounts**
${discounts.map((d, i) => `${i+1}. ${d.code} - ${d.value}% off | Used: ${d.used}/${d.limit}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📋 View All', callback_data: 'admin_view_discounts' },
                { text: '🔍 Search', callback_data: 'admin_search_discounts' }
            ],
            [
                { text: '➕ Add Discount', callback_data: 'admin_add_discount' },
                { text: '✏️ Edit Discount', callback_data: 'admin_edit_discount' }
            ],
            [
                { text: '❌ Delete Discount', callback_data: 'admin_delete_discount' },
                { text: '✅ Apply Discount', callback_data: 'admin_apply_discount' }
            ],
            [
                { text: '📊 Discount Stats', callback_data: 'admin_discount_stats' },
                { text: '📤 Export Discounts', callback_data: 'admin_export_discounts' }
            ],
            [
                { text: '🔄 Bulk Add', callback_data: 'admin_bulk_add_discounts' },
                { text: '🗑️ Bulk Delete', callback_data: 'admin_bulk_delete_discounts' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== COUPON MANAGEMENT ====================
async function showCouponManagement(bot, chatId) {
    const coupons = await getCoupons();
    const stats = await getCouponStats();
    
    let message = `🎟️ **Coupon Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Coupons: ${stats.total || 0}
• Active: ${stats.active || 0}
• Used: ${stats.used || 0}
• Total Savings: ₹${stats.totalSavings || 0}

📋 **Active Coupons**
${coupons.map((c, i) => `${i+1}. ${c.code} - ₹${c.value} off | Exp: ${c.expiry}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📋 View All', callback_data: 'admin_view_coupons' },
                { text: '🔍 Search', callback_data: 'admin_search_coupons' }
            ],
            [
                { text: '➕ Add Coupon', callback_data: 'admin_add_coupon' },
                { text: '✏️ Edit Coupon', callback_data: 'admin_edit_coupon' }
            ],
            [
                { text: '❌ Delete Coupon', callback_data: 'admin_delete_coupon' },
                { text: '✅ Apply Coupon', callback_data: 'admin_apply_coupon' }
            ],
            [
                { text: '🔄 Generate', callback_data: 'admin_generate_coupons' },
                { text: '📊 Coupon Stats', callback_data: 'admin_coupon_stats' }
            ],
            [
                { text: '📤 Export Coupons', callback_data: 'admin_export_coupons' },
                { text: '📥 Import Coupons', callback_data: 'admin_import_coupons' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== REFERRAL MANAGEMENT ====================
async function showReferralManagement(bot, chatId) {
    const referrals = await getReferrals(10);
    const stats = await getReferralStats();
    
    let message = `🤝 **Referral Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Referrals: ${stats.total || 0}
• Successful: ${stats.successful || 0}
• Pending: ${stats.pending || 0}
• Total Earnings: ₹${stats.totalEarnings || 0}
• Avg Earnings: ₹${stats.avgEarnings || 0}

📋 **Recent Referrals**
${referrals.map((r, i) => `${i+1}. User ${r.referrer} referred ${r.referred} - Earned ₹${r.earnings}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📋 View All', callback_data: 'admin_view_referrals' },
                { text: '📊 Referral Stats', callback_data: 'admin_referral_stats' }
            ],
            [
                { text: '💰 Process Bonuses', callback_data: 'admin_process_bonuses' },
                { text: '⚙️ Settings', callback_data: 'admin_referral_settings' }
            ],
            [
                { text: '📤 Export Referrals', callback_data: 'admin_export_referrals' },
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== ANALYTICS & REPORTS ====================
async function showAnalytics(bot, chatId) {
    const daily = await getDailyStats();
    const weekly = await getWeeklyStats();
    const monthly = await getMonthlyStats();
    const yearly = await getYearlyStats();
    const topUsers = await getTopUsers(5);
    const topCategories = await getTopCategories(5);
    
    let message = `📈 **Analytics & Reports**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 **Daily Report - ${moment().format('DD/MM/YYYY')}**
• New Users: ${daily.newUsers || 0}
• New Orders: ${daily.newOrders || 0}
• Revenue: ₹${daily.revenue || 0}
• Profit: ₹${daily.profit || 0}
• Conversion: ${daily.conversion || 0}%

📆 **Weekly Report (${moment().startOf('week').format('DD/MM')} - ${moment().endOf('week').format('DD/MM')})**
• New Users: ${weekly.newUsers || 0}
• New Orders: ${weekly.newOrders || 0}
• Revenue: ₹${weekly.revenue || 0}
• Growth: ${weekly.growth || 0}%

📊 **Monthly Report - ${moment().format('MMMM YYYY')}**
• New Users: ${monthly.newUsers || 0}
• New Orders: ${monthly.newOrders || 0}
• Revenue: ₹${monthly.revenue || 0}
• Avg Order: ₹${monthly.avgOrder || 0}

📈 **Yearly Report - ${moment().format('YYYY')}**
• New Users: ${yearly.newUsers || 0}
• New Orders: ${yearly.newOrders || 0}
• Revenue: ₹${yearly.revenue || 0}
• Growth: ${yearly.growth || 0}%

🏆 **Top Users**
${topUsers.map((u, i) => `${i+1}. ${u.name} - ${u.orders} orders | ₹${u.spent}`).join('\n')}

🔥 **Top Categories**
${topCategories.map((c, i) => `${i+1}. ${c.name} - ${c.sold} sold | ₹${c.revenue}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Reports:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📅 Daily', callback_data: 'admin_daily_report' },
                { text: '📆 Weekly', callback_data: 'admin_weekly_report' }
            ],
            [
                { text: '📊 Monthly', callback_data: 'admin_monthly_report' },
                { text: '📈 Yearly', callback_data: 'admin_yearly_report' }
            ],
            [
                { text: '👥 User Growth', callback_data: 'admin_user_growth' },
                { text: '💰 Revenue', callback_data: 'admin_revenue_report' }
            ],
            [
                { text: '📦 Orders', callback_data: 'admin_orders_report' },
                { text: '🎫 Vouchers', callback_data: 'admin_vouchers_report' }
            ],
            [
                { text: '📊 Export PDF', callback_data: 'admin_export_pdf' },
                { text: '📊 Export Excel', callback_data: 'admin_export_excel' }
            ],
            [
                { text: '📊 Export CSV', callback_data: 'admin_export_csv' },
                { text: '📧 Email Report', callback_data: 'admin_email_report' }
            ],
            [
                { text: '⏰ Schedule', callback_data: 'admin_schedule_report' },
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== SETTINGS MANAGEMENT ====================
async function showSettings(bot, chatId) {
    const settings = await getSettings();
    
    let message = `⚙️ **Settings Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 **Bot Settings**
• Status: ${settings.botStatus || 'active'}
• Maintenance: ${settings.maintenance || 'off'}
• Version: ${settings.version || '7.0.0'}
• Environment: ${settings.environment || 'production'}
• Language: ${settings.language || 'en'}
• Timezone: ${settings.timezone || 'Asia/Kolkata'}

💳 **Payment Settings**
• Method: ${settings.paymentMethod || 'manual'}
• Currency: ${settings.currency || 'INR'}
• Min Amount: ₹${settings.minAmount || 10}
• Max Amount: ₹${settings.maxAmount || 100000}
• Auto Approve: ${settings.autoApprove || 'false'}
• Payment Timeout: ${settings.paymentTimeout || 30} min

🔒 **Security Settings**
• Captcha: ${settings.captcha || 'true'}
• 2FA: ${settings.twoFA || 'false'}
• Rate Limit: ${settings.rateLimit || 30}/min
• Session Timeout: ${settings.sessionTimeout || 30} min
• Max Login Attempts: ${settings.maxLoginAttempts || 5}
• Login Timeout: ${settings.loginTimeout || 15} min

📧 **Notification Settings**
• Email Alerts: ${settings.emailAlerts || 'true'}
• Telegram Alerts: ${settings.telegramAlerts || 'true'}
• SMS Alerts: ${settings.smsAlerts || 'false'}
• Order Notifications: ${settings.orderNotifications || 'true'}
• Payment Notifications: ${settings.paymentNotifications || 'true'}
• User Notifications: ${settings.userNotifications || 'true'}

📦 **Order Settings**
• Min Quantity: ${settings.minQuantity || 1}
• Max Quantity: ${settings.maxQuantity || 100}
• Recovery Hours: ${settings.recoveryHours || 2}
• Auto Delivery: ${settings.autoDelivery || 'false'}
• Order Prefix: ${settings.orderPrefix || 'SVH'}
• Order Timeout: ${settings.orderTimeout || 30} min

🎫 **Voucher Settings**
• Voucher Prefix: ${settings.voucherPrefix || 'VCH'}
• Voucher Expiry: ${settings.voucherExpiry || 30} days
• Auto Generate: ${settings.autoGenerate || 'false'}
• Stock Alert: ${settings.stockAlert || 10}

👤 **User Settings**
• Default Role: ${settings.defaultRole || 'user'}
• Allow Registration: ${settings.allowRegistration || 'true'}
• Require Verification: ${settings.requireVerification || 'true'}
• Welcome Bonus: ${settings.welcomeBonus || 0}

📊 **Report Settings**
• Auto Report: ${settings.autoReport || 'false'}
• Report Time: ${settings.reportTime || '00:00'}
• Report Email: ${settings.reportEmail || 'admin@sheinvoucher.com'}
• Report Format: ${settings.reportFormat || 'pdf'}

🔄 **Backup Settings**
• Auto Backup: ${settings.autoBackup || 'false'}
• Backup Interval: ${settings.backupInterval || 24} hours
• Backup Retention: ${settings.backupRetention || 30} days
• Backup Location: ${settings.backupLocation || 'cloud'}

🌐 **API Settings**
• API Enabled: ${settings.apiEnabled || 'false'}
• Rate Limit: ${settings.apiRateLimit || 100}/min
• JWT Expiry: ${settings.jwtExpiry || 24} hours
• Webhook URL: ${settings.webhookUrl || 'not set'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Settings:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🤖 Bot', callback_data: 'admin_bot_settings' },
                { text: '💳 Payment', callback_data: 'admin_payment_settings' }
            ],
            [
                { text: '🔒 Security', callback_data: 'admin_security_settings' },
                { text: '📧 Notifications', callback_data: 'admin_notification_settings' }
            ],
            [
                { text: '📦 Order', callback_data: 'admin_order_settings' },
                { text: '🎫 Voucher', callback_data: 'admin_voucher_settings' }
            ],
            [
                { text: '👤 User', callback_data: 'admin_user_settings' },
                { text: '📊 Report', callback_data: 'admin_report_settings' }
            ],
            [
                { text: '🔄 Backup', callback_data: 'admin_backup_settings' },
                { text: '🌐 API', callback_data: 'admin_api_settings' }
            ],
            [
                { text: '🔄 Reset All', callback_data: 'admin_reset_settings' },
                { text: '📤 Export Settings', callback_data: 'admin_export_settings' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== BACKUP MANAGEMENT ====================
async function showBackupManagement(bot, chatId) {
    const backups = await getBackups();
    const settings = await getBackupSettings();
    
    let message = `🔄 **Backup Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Settings**
• Auto Backup: ${settings.autoBackup || 'false'}
• Interval: ${settings.interval || 24} hours
• Retention: ${settings.retention || 30} days
• Location: ${settings.location || 'cloud'}
• Last Backup: ${settings.lastBackup || 'Never'}

📋 **Available Backups**
${backups.map((b, i) => `${i+1}. ${b.name} - ${b.size} | ${b.date}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '💾 Create Backup', callback_data: 'admin_create_backup' },
                { text: '🔄 Restore', callback_data: 'admin_restore_backup' }
            ],
            [
                { text: '📋 View All', callback_data: 'admin_list_backups' },
                { text: '🗑️ Delete', callback_data: 'admin_delete_backup' }
            ],
            [
                { text: '📥 Download', callback_data: 'admin_download_backup' },
                { text: '📤 Upload', callback_data: 'admin_upload_backup' }
            ],
            [
                { text: '⚙️ Settings', callback_data: 'admin_backup_settings' },
                { text: '⏰ Schedule', callback_data: 'admin_schedule_backup' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== SECURITY MANAGEMENT ====================
async function showSecurityManagement(bot, chatId) {
    const blockedIPs = await getBlockedIPs();
    const rateLimits = await getRateLimits();
    const logs = await getSecurityLogs(10);
    
    let message = `🔐 **Security Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚫 **Blocked IPs**
${blockedIPs.map((ip, i) => `${i+1}. ${ip.address} - ${ip.reason} | ${ip.date}`).join('\n') || 'None'}

⚡ **Rate Limits**
• General: ${rateLimits.general || 30}/min
• Login: ${rateLimits.login || 5}/min
• Payment: ${rateLimits.payment || 10}/min
• API: ${rateLimits.api || 100}/min

📝 **Recent Security Logs**
${logs.map((l, i) => `${i+1}. [${l.time}] ${l.event} - ${l.ip}`).join('\n') || 'None'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🚫 Block IP', callback_data: 'admin_block_ip' },
                { text: '🔓 Unblock IP', callback_data: 'admin_unblock_ip' }
            ],
            [
                { text: '📋 Blocked IPs', callback_data: 'admin_list_blocked_ips' },
                { text: '⚡ Rate Limits', callback_data: 'admin_rate_limits' }
            ],
            [
                { text: '🔑 Access Control', callback_data: 'admin_access_control' },
                { text: '🔒 2FA Settings', callback_data: 'admin_2fa_settings' }
            ],
            [
                { text: '📝 Security Logs', callback_data: 'admin_security_logs' },
                { text: '👑 Admin Logs', callback_data: 'admin_admin_logs' }
            ],
            [
                { text: '🔐 API Keys', callback_data: 'admin_api_keys' },
                { text: '📋 Audit Logs', callback_data: 'admin_audit_logs' }
            ],
            [
                { text: '🗑️ Clear Logs', callback_data: 'admin_clear_security_logs' },
                { text: '📤 Export Logs', callback_data: 'admin_export_security_logs' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== BROADCAST MANAGEMENT ====================
async function showBroadcastManagement(bot, chatId) {
    const broadcasts = await getBroadcasts(10);
    const stats = await getBroadcastStats();
    
    let message = `📢 **Broadcast Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Broadcasts: ${stats.total || 0}
• Sent: ${stats.sent || 0}
• Scheduled: ${stats.scheduled || 0}
• Failed: ${stats.failed || 0}
• Avg Reach: ${stats.avgReach || 0}

📋 **Recent Broadcasts**
${broadcasts.map((b, i) => `${i+1}. ${b.message.substring(0, 30)}... - ${b.status} | ${b.date}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📨 Send Now', callback_data: 'admin_send_broadcast' },
                { text: '⏰ Schedule', callback_data: 'admin_schedule_broadcast' }
            ],
            [
                { text: '📋 History', callback_data: 'admin_broadcast_history' },
                { text: '📊 Stats', callback_data: 'admin_broadcast_stats' }
            ],
            [
                { text: '🗑️ Delete', callback_data: 'admin_delete_broadcast' },
                { text: '⏸️ Pause/Resume', callback_data: 'admin_pause_broadcast' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== INTEGRATION MANAGEMENT ====================
async function showIntegrationManagement(bot, chatId) {
    let message = `🔌 **Integration Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 **Webhooks**
• Payment Webhook: ✅ Active
• Order Webhook: ❌ Inactive
• User Webhook: ❌ Inactive

🤖 **Bot Integrations**
• Payment Bot: ✅ Connected
• Log Bot: ❌ Not Connected
• Analytics Bot: ❌ Not Connected

💳 **Payment Gateways**
• Manual Payment: ✅ Active
• UPI QR: ✅ Active
• Razorpay: ❌ Disabled

📧 **Email Service**
• SMTP: ✅ Configured
• Templates: 5 Available

📱 **SMS Service**
• Provider: ❌ Not Configured

📊 **Analytics**
• Google Analytics: ❌ Not Connected
• Mixpanel: ❌ Not Connected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🌐 Webhooks', callback_data: 'admin_webhooks' },
                { text: '🤖 Bots', callback_data: 'admin_bots' }
            ],
            [
                { text: '💳 Payment', callback_data: 'admin_payment_gateways' },
                { text: '📧 Email', callback_data: 'admin_email_service' }
            ],
            [
                { text: '📱 SMS', callback_data: 'admin_sms_service' },
                { text: '📊 Analytics', callback_data: 'admin_analytics_tools' }
            ],
            [
                { text: '🔌 API', callback_data: 'admin_api_integration' },
                { text: '🔄 Sync', callback_data: 'admin_sync' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== SYSTEM MANAGEMENT ====================
async function showSystemManagement(bot, chatId) {
    const info = await getSystemInfo();
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    
    let message = `🛠️ **System Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️ **System Information**
• Node Version: ${process.version}
• Platform: ${process.platform}
• Architecture: ${process.arch}
• PID: ${process.pid}
• Uptime: ${formatUptime(process.uptime())}
• Status: ✅ Online

📊 **Resource Usage**
• Memory: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB
• CPU: ${(cpu.user / 1000000).toFixed(2)}% user / ${(cpu.system / 1000000).toFixed(2)}% system
• RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB
• External: ${(memory.external / 1024 / 1024).toFixed(2)} MB

📦 **Environment**
• NODE_ENV: ${process.env.NODE_ENV || 'development'}
• Port: ${process.env.PORT || 3000}
• Database: Google Sheets

⏱️ **Performance**
• Response Time: ${info.responseTime || 0}ms
• Requests/Min: ${info.requestsPerMinute || 0}
• Active Sessions: ${info.activeSessions || 0}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔄 Restart Bot', callback_data: 'admin_restart_bot' },
                { text: '⏹️ Shutdown', callback_data: 'admin_shutdown_bot' }
            ],
            [
                { text: '🔄 Update Bot', callback_data: 'admin_update_bot' },
                { text: '🧹 Clear Cache', callback_data: 'admin_clear_cache' }
            ],
            [
                { text: '📝 System Logs', callback_data: 'admin_system_logs' },
                { text: '❌ Error Logs', callback_data: 'admin_error_logs' }
            ],
            [
                { text: '🐛 Debug Mode', callback_data: 'admin_debug_mode' },
                { text: '📊 Performance', callback_data: 'admin_performance' }
            ],
            [
                { text: '🔙 Back to Admin', callback_data: 'admin_back' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== HELP ====================
async function showHelp(bot, chatId) {
    const message = `❓ **Admin Help Center**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Dashboard Commands**
• /dashboard - View live dashboard
• /stats - System statistics
• /uptime - Bot uptime
• /status - Bot status

👥 **User Commands**
• /users - List users
• /user [id] - User details
• /block [id] - Block user
• /unblock [id] - Unblock user
• /adduser [data] - Add user
• /export_users - Export users

📁 **Category Commands**
• /categories - List categories
• /addcat [name] [price] [stock] - Add category
• /updatecat [id] [field] [value] - Update category
• /delcat [id] - Delete category
• /export_cats - Export categories

🎫 **Voucher Commands**
• /vouchers - List vouchers
• /addvoucher [cat] [code] - Add voucher
• /bulkvoucher [cat] [codes...] - Bulk add
• /delvoucher [code] - Delete voucher
• /export_vouchers - Export vouchers

📋 **Order Commands**
• /orders - List orders
• /order [id] - View order
• /approve [id] - Approve order
• /reject [id] - Reject order
• /refund [id] - Refund order
• /export_orders - Export orders

💰 **Payment Commands**
• /payments - List payments
• /payment [id] - View payment
• /approvepay [id] - Approve payment
• /rejectpay [id] - Reject payment
• /export_payments - Export payments

📢 **Broadcast Commands**
• /broadcast [msg] - Send broadcast
• /schedule [time] [msg] - Schedule broadcast

⚙️ **Settings Commands**
• /settings - View settings
• /set [key] [value] - Update setting
• /reset - Reset settings

🔄 **Backup Commands**
• /backup - Create backup
• /restore [id] - Restore backup
• /backups - List backups

🔐 **Security Commands**
• /blockip [ip] - Block IP
• /unblockip [ip] - Unblock IP
• /ratelimit [type] [limit] - Set rate limit
• /logs - View security logs

📝 **Log Commands**
• /logs - View logs
• /error_logs - View error logs
• /clearlogs - Clear logs

🛠️ **System Commands**
• /restart - Restart bot
• /update - Update bot
• /clear_cache - Clear cache

❓ **Need More Help?**
Contact @SheinVoucherHub for support`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 Back to Admin', callback_data: 'admin_back' }]
            ]
        }
    });
}

// ==================== CALLBACK HANDLER ====================
async function handleAdminCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    
    switch(data) {
        // Dashboard
        case 'admin_stats':
            await showDashboard(bot, chatId);
            break;
        case 'admin_refresh_dashboard':
            await showDashboard(bot, chatId);
            break;
            
        // User Management
        case 'admin_users':
            await showUserManagement(bot, chatId);
            break;
        case 'admin_view_users':
            await showUserManagement(bot, chatId);
            break;
            
        // Category Management
        case 'admin_categories':
            await showCategoryManagement(bot, chatId);
            break;
        case 'admin_view_categories':
            await showCategoryManagement(bot, chatId);
            break;
            
        // Voucher Management
        case 'admin_vouchers':
            await showVoucherManagement(bot, chatId);
            break;
        case 'admin_view_vouchers':
            await showVoucherManagement(bot, chatId);
            break;
            
        // Order Management
        case 'admin_orders':
            await showOrderManagement(bot, chatId);
            break;
        case 'admin_view_orders':
            await showOrderManagement(bot, chatId);
            break;
            
        // Payment Management
        case 'admin_payments':
            await showPaymentManagement(bot, chatId);
            break;
        case 'admin_view_payments':
            await showPaymentManagement(bot, chatId);
            break;
            
        // Discount Management
        case 'admin_discounts':
            await showDiscountManagement(bot, chatId);
            break;
            
        // Coupon Management
        case 'admin_coupons':
            await showCouponManagement(bot, chatId);
            break;
            
        // Referral Management
        case 'admin_referrals':
            await showReferralManagement(bot, chatId);
            break;
            
        // Analytics
        case 'admin_analytics':
            await showAnalytics(bot, chatId);
            break;
        case 'admin_reports':
            await showAnalytics(bot, chatId);
            break;
            
        // Settings
        case 'admin_settings':
            await showSettings(bot, chatId);
            break;
            
        // Backup
        case 'admin_backup':
            await showBackupManagement(bot, chatId);
            break;
            
        // Security
        case 'admin_security':
            await showSecurityManagement(bot, chatId);
            break;
            
        // Broadcast
        case 'admin_broadcast':
            await showBroadcastManagement(bot, chatId);
            break;
            
        // Integrations
        case 'admin_integrations':
            await showIntegrationManagement(bot, chatId);
            break;
            
        // System
        case 'admin_system':
            await showSystemManagement(bot, chatId);
            break;
            
        // Help
        case 'admin_help':
            await showHelp(bot, chatId);
            break;
            
        case 'admin_back':
            await adminCommand(bot, { chat: { id: chatId } });
            break;
            
        default:
            if (data.startsWith('admin_')) {
                await bot.sendMessage(chatId, `⚙️ Feature ${data} is under development...`);
            }
    }
}

// ==================== HELPER FUNCTIONS ====================
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
    const secs = Math.floor(((seconds % 86400) % 3600) % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);
    
    return parts.join(' ') || '0s';
}

// ==================== SCHEDULER ====================
const adminScheduler = {
    runDailyTasks: async () => {
        console.log('Running daily tasks...');
        await createBackup('daily');
        await sendDailyReport();
    },
    runWeeklyTasks: async () => {
        console.log('Running weekly tasks...');
        await createBackup('weekly');
        await sendWeeklyReport();
    },
    runMonthlyTasks: async () => {
        console.log('Running monthly tasks...');
        await createBackup('monthly');
        await sendMonthlyReport();
    }
};

// ==================== EXPORTS ====================
module.exports = { 
    adminCommand, 
    handleAdminCallback,
    adminScheduler,
    showDashboard,
    showUserManagement,
    showCategoryManagement,
    showVoucherManagement,
    showOrderManagement,
    showPaymentManagement,
    showDiscountManagement,
    showCouponManagement,
    showReferralManagement,
    showAnalytics,
    showSettings,
    showBackupManagement,
    showSecurityManagement,
    showBroadcastManagement,
    showIntegrationManagement,
    showSystemManagement,
    showHelp
};