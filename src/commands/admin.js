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
            // ✅ ERROR COMPLETELY DELETED - Admin panel-এ কিছু দেখানো হবে না
            console.log(`Admin typed: ${text} - silently ignored in admin mode`);
            return true;
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

// ==================== DASHBOARD ====================
async function showDashboard(bot, chatId) {
    try {
        const users = await getAllUsers();
        const orders = await getAllOrders();
        const categories = await getCategories();
        const blocked = await getBlockedUsers();
        
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active').length;
        const blockedUsers = blocked.length;
        
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending_approval' || o.status === 'pending').length;
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        
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
• Total Orders: ${totalOrders}

⏱️ **SYSTEM STATISTICS**
• Uptime: ${formatUptime(process.uptime())}
• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Admin Mode: ✅ Active

🕒 **Last Updated:** ${new Date().toLocaleString('en-IN')}`;

        await bot.sendMessage(chatId, dashboard, {
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// ==================== USER MANAGEMENT ====================
async function showUserManagement(bot, chatId) {
    try {
        const users = await getAllUsers();
        const blocked = await getBlockedUsers();
        
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active').length;
        const blockedUsers = blocked.length;
        
        const today = new Date().toDateString();
        const todayJoin = users.filter(u => {
            return u.join_date && new Date(u.join_date).toDateString() === today;
        }).length;
        
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
• Today's Join: ${todayJoin}

📋 **Recent Users**
${recentUsers.map((u, i) => `${i+1}. ${u.name} (@${u.username || 'N/A'}) - ${u.date}`).join('\n')}`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('User management error:', error);
    }
}

// ==================== CATEGORY MANAGEMENT ====================
async function showCategoryManagement(bot, chatId) {
    try {
        const categories = await getCategories();
        
        let message = `📁 **Category Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Current Categories**
${categories.map((c, i) => `${i+1}. ${c.name} - ₹${c.price_per_code} | Stock: ${c.stock} | Sold: ${c.total_sold}`).join('\n') || 'No categories found'}`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Category management error:', error);
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
• Sold: ${sold}`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Voucher management error:', error);
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
• Total Revenue: ₹${revenue}`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Order management error:', error);
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
• Total Amount: ₹${totalAmount}`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Payment management error:', error);
    }
}

// ==================== DISCOUNT MANAGEMENT ====================
async function showDiscountManagement(bot, chatId) {
    let message = `🏷️ **Discount Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Feature coming soon...`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
    });
}

// ==================== COUPON MANAGEMENT ====================
async function showCouponManagement(bot, chatId) {
    let message = `🎟️ **Coupon Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Feature coming soon...`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
    });
}

// ==================== REFERRAL MANAGEMENT ====================
async function showReferralManagement(bot, chatId) {
    let message = `🤝 **Referral Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Feature coming soon...`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
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
• Conversion Rate: ${users.length ? ((orders.filter(o => o.status === 'delivered').length / users.length) * 100).toFixed(2) : 0}%`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Analytics error:', error);
    }
}

// ==================== SETTINGS ====================
async function showSettings(bot, chatId) {
    const botStatus = await getBotStatus();
    
    let message = `⚙️ **Settings**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 **Bot Status:** ${botStatus === 'active' ? '✅ Active' : '❌ Inactive'}`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
    });
}

// ==================== BACKUP MANAGEMENT ====================
async function showBackupManagement(bot, chatId) {
    let message = `🔄 **Backup Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Feature coming soon...`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
    });
}

// ==================== SECURITY MANAGEMENT ====================
async function showSecurityManagement(bot, chatId) {
    let message = `🔐 **Security Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Feature coming soon...`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
    });
}

// ==================== BROADCAST MANAGEMENT ====================
async function showBroadcastManagement(bot, chatId) {
    let message = `📢 **Broadcast Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Feature coming soon...`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
    });
}

// ==================== INTEGRATION MANAGEMENT ====================
async function showIntegrationManagement(bot, chatId) {
    let message = `🔌 **Integration Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Feature coming soon...`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
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
• Admin Mode: ✅ Active`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
    });
}

// ==================== HELP ====================
async function showHelp(bot, chatId) {
    const message = `❓ **Admin Help Center**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Dashboard** - View live statistics
👥 **Users** - Manage users
📁 **Categories** - Manage categories
🎫 **Vouchers** - Manage vouchers
📋 **Orders** - Manage orders
💰 **Payments** - Manage payments
⚙️ **Settings** - Bot settings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 **Admin Mode Active** - Click 'Exit Admin' to return`;

    await bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown'
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
            
        case 'admin_security':
            await showSecurityManagement(bot, chatId);
            break;
            
        case 'admin_broadcast':
            await showBroadcastManagement(bot, chatId);
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
            // ❌ কোন error message দেখানো হবে না
            console.log(`Admin callback ${data} - silently ignored`);
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
    isAdminMode
};
