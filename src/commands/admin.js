const { 
    getCategories, addCategory, updateCategoryStock, deleteCategory,
    addVoucher, blockUser, unblockUser, getAllUsers,
    getSetting, updateSetting, getUserOrders, getOrder, getAllOrders,
    getBlockedUsers, getVouchersByCategory, deleteVoucher,
    updateVoucherPrice, getDailyStats, backupData,
    sendBroadcast
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

async function adminCommand(bot, msg) {
    const chatId = msg.chat.id;
    
    // Set admin mode on
    setAdminMode(chatId);
    
    const adminMenu = `👑 **Admin Panel v7.0**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Dashboard**
👥 **User Management**
📁 **Category Management**
🎫 **Voucher Management**
📋 **Order Management**
💰 **Payment Management**
⚙️ **Settings**
🔄 **Backup**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 **Admin Mode Active** - Click 'Exit Admin' to return to user side

👇 **Select an option:**`;

    await bot.sendMessage(chatId, adminMenu, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                ['📊 Dashboard', '👥 Users', '📁 Categories'],
                ['🎫 Vouchers', '📋 Orders', '💰 Payments'],
                ['⚙️ Settings', '🔄 Backup', '🔙 Exit Admin']
            ],
            resize_keyboard: true
        }
    });
}

// ==================== ADMIN TEXT HANDLER ====================
async function handleAdminText(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Check if in admin mode
    if (!isAdminMode(chatId)) {
        return false;
    }
    
    // Check if admin is in input mode
    if (adminState[chatId]) {
        const handled = await handleAdminInput(bot, msg);
        if (handled) return true;
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
            
        case '⚙️ Settings':
            await showSettings(bot, chatId);
            return true;
            
        case '🔄 Backup':
            await showBackupManagement(bot, chatId);
            return true;
            
        case '🔙 Exit Admin':
            exitAdminMode();
            const { startCommand } = require('./start');
            await startCommand(bot, msg);
            return true;
            
        default:
            // ❌ No error message - silent ignore
            console.log(`Admin typed: ${text} - ignored`);
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
                    await bot.sendMessage(chatId, '❌ Please send only numbers!\nExample: 500');
                    return true;
                }
                
                const categoryName = text.trim();
                await addCategory(categoryName, categoryName, '100');
                
                await bot.sendMessage(chatId, 
                    `✅ **Category Added!**\n📌 ₹${categoryName} Voucher`,
                    { parse_mode: 'Markdown' }
                );
                
                delete adminState[chatId];
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
                return true;
                
            case 'block_user':
                if (!/^\d+$/.test(text)) {
                    await bot.sendMessage(chatId, '❌ Please send a valid User ID.');
                    return true;
                }
                
                await blockUser(text, 'Blocked by admin', process.env.ADMIN_ID, 'permanent');
                await bot.sendMessage(chatId, `✅ User ${text} blocked!`);
                delete adminState[chatId];
                return true;
                
            case 'unblock_user':
                if (!/^\d+$/.test(text)) {
                    await bot.sendMessage(chatId, '❌ Please send a valid User ID.');
                    return true;
                }
                
                await unblockUser(text);
                await bot.sendMessage(chatId, `✅ User ${text} unblocked!`);
                delete adminState[chatId];
                return true;
                
            case 'broadcast':
                await sendBroadcast(text);
                await bot.sendMessage(chatId, '📢 Broadcast sent!');
                delete adminState[chatId];
                return true;
                
            default:
                return false;
        }
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        delete adminState[chatId];
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
        
        const dashboard = `📊 **Dashboard**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 **Users:** ${totalUsers} (Active: ${activeUsers}, Blocked: ${blockedUsers})
📦 **Orders:** ${totalOrders} (Pending: ${pendingOrders}, Completed: ${completedOrders})
💰 **Revenue Today:** ₹${todayRevenue}
💰 **Total Revenue:** ₹${totalRevenue}
📁 **Categories:** ${categories.length}

🕒 **Updated:** ${new Date().toLocaleString('en-IN')}`;

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
            .slice(0, 3)
            .map(u => `• ${u.first_name} (@${u.username || 'N/A'})`);
        
        let message = `👥 **User Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total: ${totalUsers}
• Active: ${activeUsers}
• Blocked: ${blockedUsers}
• Joined Today: ${todayJoin}

📋 **Recent Users**
${recentUsers.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commands: /block [id], /unblock [id]`;

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        if (categories.length === 0) {
            message += 'No categories found.\n\nUse "➕ Add Category" to add.';
        } else {
            categories.forEach((c, i) => {
                const match = c.name.match(/₹(\d+)/);
                const displayName = match ? match[1] : c.name;
                message += `${i+1}. ₹${displayName} - ₹${c.price_per_code} | Stock: ${c.stock}\n`;
            });
        }
        
        message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To add: Send category amount (e.g., 500)`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        });
        
        // Set state for adding category
        adminState[chatId] = { action: 'add_category' };
        
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
• Sold: ${sold}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To add: Send voucher codes (one per line)`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        });
        
        // Ask for category first
        const categories = await getCategories();
        if (categories.length === 0) {
            await bot.sendMessage(chatId, '❌ Please add a category first!');
            return;
        }
        
        let catMsg = 'Select category ID:\n';
        categories.forEach(cat => {
            const match = cat.name.match(/₹(\d+)/);
            const displayName = match ? match[1] : cat.name;
            catMsg += `ID ${cat.category_id}: ₹${displayName}\n`;
        });
        
        await bot.sendMessage(chatId, catMsg);
        
        // Set up category selection
        const response = await new Promise(resolve => {
            const handler = (msg) => {
                if (msg.chat.id === chatId) {
                    bot.removeListener('message', handler);
                    resolve(msg.text);
                }
            };
            bot.on('message', handler);
        });
        
        const categoryId = response;
        const category = categories.find(c => c.category_id === categoryId);
        
        if (!category) {
            await bot.sendMessage(chatId, '❌ Invalid category ID');
            return;
        }
        
        adminState[chatId] = { action: 'add_voucher', categoryId };
        await bot.sendMessage(chatId, '📝 Send voucher codes (one per line):');
        
    } catch (error) {
        console.error('Voucher management error:', error);
    }
}

// ==================== ORDER MANAGEMENT ====================
async function showOrderManagement(bot, chatId) {
    try {
        const orders = await getAllOrders();
        const pending = orders.filter(o => o.status === 'pending_approval').length;
        const processing = orders.filter(o => o.status === 'processing').length;
        const completed = orders.filter(o => o.status === 'delivered').length;
        const revenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (parseInt(o.total_price) || 0), 0);
        
        let message = `📋 **Order Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Total: ${orders.length}
• Pending Approval: ${pending}
• Processing: ${processing}
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
        let message = `💰 **Payment Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Manual Payment Only**
• Users upload screenshot + UTR
• Admin approves/rejects
• Vouchers delivered after approval`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Payment management error:', error);
    }
}

// ==================== SETTINGS ====================
async function showSettings(bot, chatId) {
    const botStatus = await getBotStatus();
    const maintenance = await getSetting('maintenance_mode') || 'false';
    
    let message = `⚙️ **Settings**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 **Bot Status:** ${botStatus === 'active' ? '✅ Active' : '❌ Inactive'}
🔧 **Maintenance:** ${maintenance === 'true' ? '⚠️ On' : '✅ Off'}`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
    });
}

// ==================== BACKUP MANAGEMENT ====================
async function showBackupManagement(bot, chatId) {
    let message = `🔄 **Backup Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Use /backup to create backup
📌 Use /restore [id] to restore`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
    });
}

// ==================== GET FUNCTIONS ====================
async function getBotStatus() {
    return await getSetting('bot_status') || 'active';
}

// ==================== EXPORTS ====================
module.exports = { 
    adminCommand, 
    handleAdminText,
    handleAdminInput,
    adminState,
    setAdminMode,
    exitAdminMode,
    isAdminMode
};
