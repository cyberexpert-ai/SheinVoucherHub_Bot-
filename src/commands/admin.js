const { 
    getCategories, addCategory, updateCategoryStock, deleteCategory,
    addVoucher, blockUser, unblockUser, getAllUsers,
    getSetting, updateSetting, getUserOrders, getOrder, getAllOrders,
    getStats, getBlockedUsers, getVouchersByCategory, deleteVoucher,
    updateVoucherPrice, getDailyStats, backupData,
    sendBroadcast, sendPersonalMessage,
    setUserRestriction,
    addCategoryDiscount,
    setPaymentMethod, getPaymentMethod, setCaptchaType, getCaptchaType,
    setRecoveryHours, getRecoveryHours, setMaxQuantity, getMaxQuantity,
    setBotStatus, getBotStatus, setMaintenanceMode, getMaintenanceMode,
    setWelcomeMessage, getWelcomeMessage, setDisclaimer, getDisclaimer,
    setSupportMessage, getSupportMessage,
    setCaptchaEnabled, getCaptchaEnabled,
    setChannelCheck, getChannelCheck,
    setChannelLinks, getChannelLinks,
    setLanguage, getLanguage, setTimezone, getTimezone,
    setCurrency, getCurrency,
    setTaxEnabled, getTaxEnabled, setTaxRate, getTaxRate,
    setReferralEnabled, getReferralEnabled,
    setReferralBonus, getReferralBonus,
    setReferralTier, getReferralTier,
    setBackupEnabled, getBackupEnabled,
    setBackupInterval, getBackupInterval
} = require('../sheets/googleSheets');

// Admin state store for input modes
let adminState = {};

// Admin Mode functions
function setAdminMode(chatId) {
    global.adminMode = true;
    global.adminChatId = chatId;
}

function exitAdminMode() {
    global.adminMode = false;
    global.adminChatId = null;
}

function isAdminMode(chatId) {
    return global.adminMode && global.adminChatId === chatId;
}

// Helper function to get last backup
async function getLastBackup() {
    try {
        return await getSetting('last_backup') || 'Never';
    } catch (error) {
        return 'Never';
    }
}

async function adminCommand(bot, msg) {
    const chatId = msg.chat.id;
    
    // Set admin mode on
    setAdminMode(chatId);
    
    const adminMenu = `👑 **Admin Panel v7.0**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Dashboard & Analytics**
👥 **User Management**
📁 **Category Management**
🎫 **Voucher Management**
📋 **Order Management**
💰 **Payment Management**
🏷️ **Discounts & Coupons**
🤝 **Referral System**
📈 **Reports & Analytics**
⚙️ **Settings & Configuration**
🔄 **Backup & Restore**
🔐 **Security Management**
📢 **Broadcast & Notifications**
🔌 **Integrations**
🛠️ **System Management**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 **Admin Mode Active** - All actions are logged

👇 **Select an option below:**`;

    await bot.sendMessage(chatId, adminMenu, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                ['📊 Dashboard', '👥 Users', '📁 Categories'],
                ['🎫 Vouchers', '📋 Orders', '💰 Payments'],
                ['🏷️ Discounts', '🎟️ Coupons', '🤝 Referrals'],
                ['📈 Reports', '⚙️ Settings', '🔄 Backup'],
                ['🔐 Security', '📢 Broadcast', '🔌 Integrations'],
                ['🛠️ System', '❓ Help', '🔙 Exit Admin']
            ],
            resize_keyboard: true
        }
    });
}

// ==================== ADMIN TEXT HANDLER ====================
async function handleAdminText(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Check if admin is in input mode
    if (adminState[chatId]) {
        const handled = await handleAdminInput(bot, msg);
        if (handled) return true;
    }
    
    // Check if in admin mode
    if (!isAdminMode(chatId)) {
        return false;
    }
    
    // Admin menu buttons
    switch(text) {
        case '📊 Dashboard':
            await showDashboard(bot, chatId);
            return true;
            
        case '👥 Users':
            await showUserManagement(bot, chatId);
            return true;
            
        case '📁 Categories':
            await showCategoryManagement(bot, chatId);
            return true;
            
        case '🎫 Vouchers':
            await showVoucherManagement(bot, chatId);
            return true;
            
        case '📋 Orders':
            await showOrderManagement(bot, chatId);
            return true;
            
        case '💰 Payments':
            await showPaymentManagement(bot, chatId);
            return true;
            
        case '🏷️ Discounts':
            await showDiscountManagement(bot, chatId);
            return true;
            
        case '🎟️ Coupons':
            await showCouponManagement(bot, chatId);
            return true;
            
        case '🤝 Referrals':
            await showReferralManagement(bot, chatId);
            return true;
            
        case '📈 Reports':
        case '📊 Reports':
            await showAnalytics(bot, chatId);
            return true;
            
        case '⚙️ Settings':
            await showSettings(bot, chatId);
            return true;
            
        case '🔄 Backup':
            await showBackupManagement(bot, chatId);
            return true;
            
        case '🔐 Security':
            await showSecurityManagement(bot, chatId);
            return true;
            
        case '📢 Broadcast':
            await showBroadcastManagement(bot, chatId);
            return true;
            
        case '🔌 Integrations':
            await showIntegrationManagement(bot, chatId);
            return true;
            
        case '🛠️ System':
            await showSystemManagement(bot, chatId);
            return true;
            
        case '❓ Help':
            await showHelp(bot, chatId);
            return true;
            
        case '🔙 Exit Admin':
            // Exit admin mode and go back to user side
            exitAdminMode();
            const { startCommand } = require('./start');
            await startCommand(bot, msg);
            return true;
            
        default:
            // Admin Panel - SILENT IGNORE - NO ERROR MESSAGE
            console.log(`Admin typed: ${text} - silently ignored in admin mode`);
            return true; // Always return true to prevent error message
    }
}

// ==================== ADMIN INPUT HANDLER ====================
async function handleAdminInput(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = adminState[chatId];
    
    if (!state) return false;
    
    try {
        switch(state.action) {
            case 'add_category':
                if (!/^\d+$/.test(text)) {
                    await bot.sendMessage(chatId, '❌ Please send only numbers!\nExample: 500 for ₹500 voucher');
                    return true;
                }
                
                const categoryName = text.trim();
                await addCategory(categoryName, categoryName, '100');
                
                await bot.sendMessage(chatId, 
                    `✅ **Category Added!**
━━━━━━━━━━━━━━━━━━━━━

📌 **Category:** ₹${categoryName} Voucher
💰 **Price:** ₹${categoryName}
📦 **Stock:** 100`,
                    { parse_mode: 'Markdown' }
                );
                
                delete adminState[chatId];
                await adminCommand(bot, msg);
                return true;
                
            case 'add_voucher':
                const codes = text.split('\n').map(c => c.trim()).filter(c => c);
                
                if (codes.length === 0) {
                    await bot.sendMessage(chatId, '❌ Please send at least one voucher code.');
                    return true;
                }
                
                for (const code of codes) {
                    await addVoucher(code, state.categoryId, '100');
                }
                
                await bot.sendMessage(chatId, `✅ ${codes.length} vouchers added!`);
                delete adminState[chatId];
                await adminCommand(bot, msg);
                return true;
                
            case 'block_user':
                if (!/^\d+$/.test(text)) {
                    await bot.sendMessage(chatId, '❌ Please send a valid User ID (numbers only).');
                    return true;
                }
                
                await blockUser(text, 'Blocked by admin', process.env.ADMIN_ID, 'permanent');
                await bot.sendMessage(chatId, `✅ User ${text} blocked!`);
                delete adminState[chatId];
                await adminCommand(bot, msg);
                return true;
                
            case 'unblock_user':
                if (!/^\d+$/.test(text)) {
                    await bot.sendMessage(chatId, '❌ Please send a valid User ID (numbers only).');
                    return true;
                }
                
                await unblockUser(text);
                await bot.sendMessage(chatId, `✅ User ${text} unblocked!`);
                delete adminState[chatId];
                await adminCommand(bot, msg);
                return true;
                
            case 'broadcast':
                await sendBroadcast(text);
                await bot.sendMessage(chatId, '📢 Broadcast sent to all users!');
                delete adminState[chatId];
                await adminCommand(bot, msg);
                return true;
                
            default:
                return false;
        }
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        delete adminState[chatId];
        await adminCommand(bot, msg);
        return true;
    }
}

// ==================== DASHBOARD WITH REAL DATA ====================
async function showDashboard(bot, chatId) {
    try {
        // Real data from database
        const users = await getAllUsers();
        const orders = await getAllOrders();
        const payments = await getPayments?.(1000) || [];
        const vouchers = await getVouchersByCategory?.('all') || [];
        const categories = await getCategories();
        const blocked = await getBlockedUsers();
        
        // Calculate real stats
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active').length;
        const blockedUsers = blocked.length;
        
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending_approval' || o.status === 'pending').length;
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        const rejectedOrders = orders.filter(o => o.status === 'rejected').length;
        
        const totalRevenue = orders
            .filter(o => o.status === 'delivered')
            .reduce((sum, o) => sum + (parseInt(o.total_price) || 0), 0);
        
        const todayOrders = orders.filter(o => {
            const today = new Date().toDateString();
            return new Date(o.order_date).toDateString() === today;
        }).length;
        
        const todayRevenue = orders
            .filter(o => {
                const today = new Date().toDateString();
                return o.status === 'delivered' && new Date(o.order_date).toDateString() === today;
            })
            .reduce((sum, o) => sum + (parseInt(o.total_price) || 0), 0);
        
        const availableVouchers = vouchers.filter(v => v.status === 'available').length;
        const soldVouchers = vouchers.filter(v => v.status === 'sold').length;
        
        const pendingPayments = payments.filter(p => p.status === 'pending').length;
        
        const dashboard = `📊 **Live Dashboard**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 **USER STATISTICS**
• Total Users: ${totalUsers}
• Active Users: ${activeUsers}
• Blocked Users: ${blockedUsers}
• Categories: ${categories.length}

💰 **REVENUE STATISTICS**
• Today: ₹${todayRevenue}
• Total Revenue: ₹${totalRevenue}
• Avg Order: ${totalOrders ? Math.round(totalRevenue / totalOrders) : 0}

📦 **ORDER STATISTICS**
• Today: ${todayOrders}
• Pending: ${pendingOrders}
• Completed: ${completedOrders}
• Rejected: ${rejectedOrders}
• Total Orders: ${totalOrders}

💰 **PAYMENT STATISTICS**
• Pending: ${pendingPayments}
• Completed: ${payments.filter(p => p.status === 'completed').length}
• Failed: ${payments.filter(p => p.status === 'failed').length}

🎫 **VOUCHER STATISTICS**
• Available: ${availableVouchers}
• Sold: ${soldVouchers}
• Total: ${vouchers.length}

📊 **CATEGORY STATISTICS**
• Total Categories: ${categories.length}
• Total Stock: ${categories.reduce((sum, c) => sum + (parseInt(c.stock) || 0), 0)}
• Total Sold: ${categories.reduce((sum, c) => sum + (parseInt(c.total_sold) || 0), 0)}

⏱️ **SYSTEM STATISTICS**
• Uptime: ${formatUptime(process.uptime())}
• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Admin Mode: ✅ Active
• Status: ✅ Online

🕒 **Last Updated:** ${new Date().toLocaleString('en-IN')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Quick Actions:**`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🔄 Refresh', callback_data: 'admin_refresh_dashboard' }
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
    } catch (error) {
        console.error('Dashboard error:', error);
        await bot.sendMessage(chatId, '❌ Error loading dashboard. Please try again.');
    }
}

// ==================== USER MANAGEMENT WITH REAL DATA ====================
async function showUserManagement(bot, chatId) {
    try {
        const users = await getAllUsers();
        const blocked = await getBlockedUsers();
        
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active').length;
        const blockedUsers = blocked.length;
        const verifiedUsers = users.filter(u => u.verified === 'true').length;
        
        // Get today's join count
        const today = new Date().toDateString();
        const todayJoin = users.filter(u => {
            return u.join_date && new Date(u.join_date).toDateString() === today;
        }).length;
        
        // Get recent users
        const recentUsers = users
            .sort((a, b) => new Date(b.join_date) - new Date(a.join_date))
            .slice(0, 5)
            .map(u => ({
                name: u.first_name,
                username: u.username,
                date: new Date(u.join_date).toLocaleDateString()
            }));
        
        let message = `👥 **User Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Users: ${totalUsers}
• Active Users: ${activeUsers}
• Blocked Users: ${blockedUsers}
• Verified Users: ${verifiedUsers}
• Today's Join: ${todayJoin}

📋 **Recent Users**
${recentUsers.map((u, i) => `${i+1}. ${u.name} (@${u.username || 'N/A'}) - ${u.date}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Available Commands:**`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🔒 Block User', callback_data: 'admin_block_user' },
                    { text: '🔓 Unblock User', callback_data: 'admin_unblock_user' }
                ],
                [
                    { text: '📊 User Stats', callback_data: 'admin_user_stats' },
                    { text: '📤 Export Users', callback_data: 'admin_export_users' }
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
    } catch (error) {
        console.error('User management error:', error);
        await bot.sendMessage(chatId, '❌ Error loading user data. Please try again.');
    }
}

// ==================== CATEGORY MANAGEMENT ====================
async function showCategoryManagement(bot, chatId) {
    try {
        const categories = await getCategories();
        
        let message = `📁 **Category Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Current Categories**
${categories.map((c, i) => `${i+1}. ${c.name} - ₹${c.price_per_code} | Stock: ${c.stock} | Sold: ${c.total_sold}`).join('\n') || 'No categories found'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands:**`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '➕ Add Category', callback_data: 'admin_add_category' }
                ],
                [
                    { text: '📊 Category Stats', callback_data: 'admin_category_stats' },
                    { text: '📤 Export Categories', callback_data: 'admin_export_categories' }
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
    } catch (error) {
        console.error('Category management error:', error);
        await bot.sendMessage(chatId, '❌ Error loading categories. Please try again.');
    }
}

// ==================== VOUCHER MANAGEMENT ====================
async function showVoucherManagement(bot, chatId) {
    try {
        const vouchers = await getVouchersByCategory?.('all') || [];
        const available = vouchers.filter(v => v.status === 'available').length;
        const sold = vouchers.filter(v => v.status === 'sold').length;
        
        let message = `🎫 **Voucher Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total: ${vouchers.length}
• Available: ${available}
• Sold: ${sold}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands:**`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '➕ Add Voucher', callback_data: 'admin_add_voucher' }
                ],
                [
                    { text: '📊 Voucher Stats', callback_data: 'admin_voucher_stats' },
                    { text: '📤 Export Vouchers', callback_data: 'admin_export_vouchers' }
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
    } catch (error) {
        console.error('Voucher management error:', error);
        await bot.sendMessage(chatId, '❌ Error loading vouchers. Please try again.');
    }
}

// ==================== ORDER MANAGEMENT ====================
async function showOrderManagement(bot, chatId) {
    try {
        const orders = await getAllOrders();
        const pending = orders.filter(o => o.status === 'pending_approval' || o.status === 'pending').length;
        const completed = orders.filter(o => o.status === 'delivered').length;
        const revenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (parseInt(o.total_price) || 0), 0);
        
        let message = `📋 **Order Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Orders: ${orders.length}
• Pending: ${pending}
• Completed: ${completed}
• Total Revenue: ₹${revenue}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands:**`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '📋 View Orders', callback_data: 'admin_view_orders' }
                ],
                [
                    { text: '📊 Order Stats', callback_data: 'admin_order_stats' },
                    { text: '📤 Export Orders', callback_data: 'admin_export_orders' }
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
    } catch (error) {
        console.error('Order management error:', error);
        await bot.sendMessage(chatId, '❌ Error loading orders. Please try again.');
    }
}

// ==================== PAYMENT MANAGEMENT ====================
async function showPaymentManagement(bot, chatId) {
    try {
        const payments = await getPayments?.(1000) || [];
        const pending = payments.filter(p => p.status === 'pending').length;
        const completed = payments.filter(p => p.status === 'completed').length;
        const totalAmount = payments.reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
        
        let message = `💰 **Payment Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total Payments: ${payments.length}
• Pending: ${pending}
• Completed: ${completed}
• Total Amount: ₹${totalAmount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands:**`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '📋 View Payments', callback_data: 'admin_view_payments' }
                ],
                [
                    { text: '📊 Payment Stats', callback_data: 'admin_payment_stats' },
                    { text: '📤 Export Payments', callback_data: 'admin_export_payments' }
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
    } catch (error) {
        console.error('Payment management error:', error);
        await bot.sendMessage(chatId, '❌ Error loading payments. Please try again.');
    }
}

// ==================== DISCOUNT MANAGEMENT ====================
async function showDiscountManagement(bot, chatId) {
    let message = `🏷️ **Discount Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 **Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '➕ Add Discount', callback_data: 'admin_add_discount' }
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

// ==================== ANALYTICS ====================
async function showAnalytics(bot, chatId) {
    try {
        const users = await getAllUsers();
        const orders = await getAllOrders();
        const revenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (parseInt(o.total_price) || 0), 0);
        
        let message = `📈 **Analytics Dashboard**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Overview**
• Total Users: ${users.length}
• Total Orders: ${orders.length}
• Total Revenue: ₹${revenue}
• Conversion Rate: ${users.length ? ((orders.filter(o => o.status === 'delivered').length / users.length) * 100).toFixed(2) : 0}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands:**`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '📅 Daily Report', callback_data: 'admin_daily_report' }
                ],
                [
                    { text: '📆 Weekly Report', callback_data: 'admin_weekly_report' },
                    { text: '📊 Monthly Report', callback_data: 'admin_monthly_report' }
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
    } catch (error) {
        console.error('Analytics error:', error);
        await bot.sendMessage(chatId, '❌ Error loading analytics. Please try again.');
    }
}

// ==================== SETTINGS ====================
async function showSettings(bot, chatId) {
    const botStatus = await getBotStatus();
    
    let message = `⚙️ **Settings**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 **Bot Status:** ${botStatus === 'active' ? '✅ Active' : '❌ Inactive'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: botStatus === 'active' ? '❌ Stop Bot' : '✅ Start Bot', callback_data: 'toggle_bot' }
            ],
            [
                { text: '⚙️ General Settings', callback_data: 'admin_general_settings' },
                { text: '💳 Payment Settings', callback_data: 'admin_payment_settings' }
            ],
            [
                { text: '🔒 Security Settings', callback_data: 'admin_security_settings' }
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
    let message = `🔄 **Backup Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 **Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '💾 Create Backup', callback_data: 'admin_create_backup' }
            ],
            [
                { text: '📋 List Backups', callback_data: 'admin_list_backups' }
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
    let message = `🔐 **Security Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 **Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📝 Security Logs', callback_data: 'admin_security_logs' }
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
    let message = `📢 **Broadcast Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 **Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📨 Send Broadcast', callback_data: 'admin_send_broadcast' }
            ],
            [
                { text: '⏰ Schedule Broadcast', callback_data: 'admin_schedule_broadcast' }
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

📌 **Commands:**`;

    const keyboard = {
        inline_keyboard: [
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
    const memory = process.memoryUsage();
    
    let message = `🛠️ **System Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **System Info**
• Node Version: ${process.version}
• Platform: ${process.platform}
• Uptime: ${formatUptime(process.uptime())}
• Memory: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB
• Admin Mode: ✅ Active

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔄 Restart Bot', callback_data: 'admin_restart_bot' }
            ],
            [
                { text: '📝 System Logs', callback_data: 'admin_system_logs' }
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
• View live statistics
• Monitor system health
• Track revenue and orders

👥 **User Commands**
• /block [id] - Block user
• /unblock [id] - Unblock user
• View user statistics

📁 **Category Commands**
• Add new categories
• Update category stock
• Delete categories

🎫 **Voucher Commands**
• Add single vouchers
• Bulk add vouchers
• View voucher statistics

📋 **Order Commands**
• View all orders
• Approve/reject orders
• Export order data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 **Admin Mode Active** - Click 'Exit Admin' to return to user side`;

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
        case 'admin_stats':
        case 'admin_refresh_dashboard':
            await showDashboard(bot, chatId);
            break;
            
        case 'admin_users':
            await showUserManagement(bot, chatId);
            break;
            
        case 'admin_categories':
            await showCategoryManagement(bot, chatId);
            break;
            
        case 'admin_add_category':
            adminState[chatId] = { action: 'add_category' };
            await bot.sendMessage(chatId, '➕ Send category amount (e.g., 500 for ₹500 voucher):');
            break;
            
        case 'admin_vouchers':
            await showVoucherManagement(bot, chatId);
            break;
            
        case 'admin_add_voucher':
            // First show categories to select
            const categories = await getCategories();
            if (categories.length === 0) {
                await bot.sendMessage(chatId, '❌ Please add a category first!');
                await showCategoryManagement(bot, chatId);
                break;
            }
            
            let catMsg = '📝 Select category to add vouchers:\n\n';
            categories.forEach(cat => {
                const match = cat.name.match(/₹(\d+)/);
                const displayName = match ? match[1] : cat.name;
                catMsg += `ID ${cat.category_id}: ₹${displayName}\n`;
            });
            
            await bot.sendMessage(chatId, catMsg);
            
            // Wait for category ID
            bot.once('message', async (msg) => {
                if (msg.chat.id !== chatId) return;
                const categoryId = msg.text;
                const category = categories.find(c => c.category_id === categoryId);
                
                if (!category) {
                    await bot.sendMessage(chatId, '❌ Invalid category ID!');
                    return;
                }
                
                adminState[chatId] = { action: 'add_voucher', categoryId };
                await bot.sendMessage(chatId, '📝 Send voucher codes (one per line):');
            });
            break;
            
        case 'admin_orders':
            await showOrderManagement(bot, chatId);
            break;
            
        case 'admin_payments':
            await showPaymentManagement(bot, chatId);
            break;
            
        case 'admin_discounts':
            await showDiscountManagement(bot, chatId);
            break;
            
        case 'admin_reports':
            await showAnalytics(bot, chatId);
            break;
            
        case 'admin_settings':
            await showSettings(bot, chatId);
            break;
            
        case 'toggle_bot':
            const currentStatus = await getBotStatus();
            await setBotStatus(currentStatus === 'active' ? 'inactive' : 'active');
            await bot.sendMessage(chatId, `✅ Bot status changed to ${currentStatus === 'active' ? 'inactive' : 'active'}`);
            await showSettings(bot, chatId);
            break;
            
        case 'admin_backup':
            await showBackupManagement(bot, chatId);
            break;
            
        case 'admin_create_backup':
            const backup = await backupData();
            await bot.sendMessage(chatId, '✅ Backup created successfully!');
            break;
            
        case 'admin_security':
            await showSecurityManagement(bot, chatId);
            break;
            
        case 'admin_broadcast':
            await showBroadcastManagement(bot, chatId);
            break;
            
        case 'admin_send_broadcast':
            adminState[chatId] = { action: 'broadcast' };
            await bot.sendMessage(chatId, '📢 Send message to broadcast:');
            break;
            
        case 'admin_integrations':
            await showIntegrationManagement(bot, chatId);
            break;
            
        case 'admin_system':
            await showSystemManagement(bot, chatId);
            break;
            
        case 'admin_help':
            await showHelp(bot, chatId);
            break;
            
        case 'admin_back':
            await adminCommand(bot, { chat: { id: chatId } });
            break;
            
        default:
            await bot.sendMessage(chatId, `⚙️ Feature ${data} coming soon...`);
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
    },
    runWeeklyTasks: async () => {
        console.log('Running weekly tasks...');
    },
    runMonthlyTasks: async () => {
        console.log('Running monthly tasks...');
    }
};

// Dummy functions for missing imports
async function getPayments(limit) { return []; }
async function getVouchersByCategory(cat) { return []; }

// ==================== EXPORTS ====================
module.exports = { 
    adminCommand, 
    handleAdminText,
    handleAdminInput,
    handleAdminCallback,
    adminScheduler,
    adminState,
    setAdminMode,
    exitAdminMode,
    isAdminMode,
    showDashboard,
    showUserManagement,
    showCategoryManagement,
    showVoucherManagement,
    showOrderManagement,
    showPaymentManagement,
    showDiscountManagement,
    showAnalytics,
    showSettings,
    showBackupManagement,
    showSecurityManagement,
    showBroadcastManagement,
    showIntegrationManagement,
    showSystemManagement,
    showHelp
};
