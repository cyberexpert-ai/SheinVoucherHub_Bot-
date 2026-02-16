const { 
    getCategories, addCategory, updateCategoryStock, deleteCategory,
    addVoucher, blockUser, unblockUser, getAllUsers,
    getSetting, updateSetting, getUserOrders, getOrder, getAllOrders,
    getStats, getBlockedUsers, getVouchersByCategory, deleteVoucher,
    getDailyStats
} = require('../sheets/googleSheets');

let adminState = {};

async function adminCommand(bot, msg) {
    const chatId = msg.chat.id;
    
    const adminMenu = `👑 **Admin Panel**
━━━━━━━━━━━━━━━━━━━━━

Select an option:`;

    await bot.sendMessage(chatId, adminMenu, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                ['📊 System Stats', '📦 Categories'],
                ['➕ Add Vouchers', '👥 Users'],
                ['🔒 Block User', '🔓 Unblock User'],
                ['📢 Broadcast', '⚙️ Settings'],
                ['💰 Payments', '📈 Reports'],
                ['🔙 Main Menu']
            ],
            resize_keyboard: true
        }
    });
}

async function handleAdminText(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;
    
    // Handle text inputs
    switch(text) {
        case '📊 System Stats':
            await showStats(bot, chatId);
            break;
            
        case '📦 Categories':
            await manageCategories(bot, chatId);
            break;
            
        case '➕ Add Vouchers':
            await addVouchersMenu(bot, chatId);
            break;
            
        case '👥 Users':
            await showUsers(bot, chatId);
            break;
            
        case '🔒 Block User':
            adminState[chatId] = { action: 'block_user' };
            await bot.sendMessage(chatId, '👤 Send User ID to block:');
            break;
            
        case '🔓 Unblock User':
            adminState[chatId] = { action: 'unblock_user' };
            await bot.sendMessage(chatId, '👤 Send User ID to unblock:');
            break;
            
        case '📢 Broadcast':
            adminState[chatId] = { action: 'broadcast' };
            await bot.sendMessage(chatId, '📢 Send message to broadcast:');
            break;
            
        case '⚙️ Settings':
            await showSettings(bot, chatId);
            break;
            
        case '💰 Payments':
            await showPayments(bot, chatId);
            break;
            
        case '📈 Reports':
            await showReports(bot, chatId);
            break;
            
        case '🔙 Main Menu':
            const { startCommand } = require('./start');
            return startCommand(bot, msg);
            
        default:
            // Handle admin input states
            if (adminState[chatId]) {
                await handleAdminInput(bot, msg);
            }
            break;
    }
}

async function handleAdminInput(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = adminState[chatId];
    
    if (!state) return;
    
    switch(state.action) {
        case 'add_category':
            // Simply use the number as category
            if (!/^\d+$/.test(text)) {
                await bot.sendMessage(chatId, '❌ Please send only numbers!\nExample: 500 for ₹500 voucher');
                return;
            }
            
            const categoryName = text.trim();
            const price = categoryName;
            const stock = '100';
            
            await addCategory(categoryName, price, stock);
            await bot.sendMessage(chatId, 
                `✅ **Category Added!**
━━━━━━━━━━━━━━━━━━━━━

📌 **Category:** ₹${categoryName} Voucher
💰 **Price:** ₹${price}
📦 **Stock:** ${stock}

Use "➕ Add Vouchers" to add voucher codes.`,
                { parse_mode: 'Markdown' }
            );
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'add_voucher':
            const codes = text.split('\n').map(c => c.trim()).filter(c => c);
            for (const code of codes) {
                await addVoucher(code, state.categoryId, '100');
            }
            await bot.sendMessage(chatId, `✅ ${codes.length} vouchers added to category!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'block_user':
            await blockUser(text, 'Blocked by admin', process.env.ADMIN_ID, 'permanent');
            await bot.sendMessage(chatId, `✅ User ${text} blocked!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'unblock_user':
            await unblockUser(text);
            await bot.sendMessage(chatId, `✅ User ${text} unblocked!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'broadcast':
            // In a real implementation, this would send to all users
            await bot.sendMessage(chatId, '📢 Broadcast sent to all users!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
    }
}

async function manageCategories(bot, chatId) {
    const categories = await getCategories();
    
    let message = `📦 **Category Management**
━━━━━━━━━━━━━━━━━━━━━

**Current Categories:**\n\n`;
    
    if (categories.length === 0) {
        message += 'No categories found.\n\n';
    } else {
        categories.forEach(cat => {
            const match = cat.name.match(/₹(\d+)/);
            const displayName = match ? match[1] : cat.name;
            message += `• **₹${displayName}** (ID: ${cat.category_id})\n`;
            message += `  Price: ₹${cat.price_per_code} | Stock: ${cat.stock}\n\n`;
        });
    }
    
    const keyboard = {
        inline_keyboard: [
            [{ text: '➕ Add New Category', callback_data: 'admin_add_category' }],
            [{ text: '🔙 Back', callback_data: 'admin_back' }]
        ]
    };
    
    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function addVouchersMenu(bot, chatId) {
    const categories = await getCategories();
    
    if (categories.length === 0) {
        return bot.sendMessage(chatId, '❌ Please add a category first!');
    }
    
    let message = `📦 **Select Category to Add Vouchers**
━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    categories.forEach(cat => {
        const match = cat.name.match(/₹(\d+)/);
        const displayName = match ? match[1] : cat.name;
        message += `ID ${cat.category_id}: ₹${displayName} (Stock: ${cat.stock})\n`;
    });
    
    message += `\nSend category ID to add vouchers:`;
    
    adminState[chatId] = { action: 'select_voucher_category' };
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    // Wait for category ID
    const response = await new Promise(resolve => {
        bot.once('message', (msg) => {
            if (msg.chat.id === chatId) resolve(msg.text);
        });
    });
    
    const categoryId = response;
    const category = categories.find(c => c.category_id === categoryId);
    
    if (!category) {
        return bot.sendMessage(chatId, '❌ Invalid category ID!');
    }
    
    adminState[chatId] = { action: 'add_voucher', categoryId };
    await bot.sendMessage(chatId, '📝 Send voucher codes (one per line):');
}

async function showStats(bot, chatId) {
    const stats = await getStats();
    const users = await getAllUsers();
    const orders = await getAllOrders();
    const blocked = await getBlockedUsers();
    const categories = await getCategories();
    
    const message = `📊 **System Statistics**
━━━━━━━━━━━━━━━━━━━━━

👥 **Total Users:** ${users.length}
🔒 **Blocked Users:** ${blocked.length}
📦 **Total Orders:** ${orders.length}
✅ **Categories:** ${categories.length}
💰 **Revenue:** ₹${orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + parseInt(o.total_price || 0), 0)}`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['🔙 Back to Admin']],
            resize_keyboard: true
        }
    });
}

async function showUsers(bot, chatId) {
    const users = await getAllUsers();
    const blocked = await getBlockedUsers();
    
    const message = `👥 **User Statistics**
━━━━━━━━━━━━━━━━━━━━━

**Total Users:** ${users.length}
**Blocked Users:** ${blocked.length}
**Active Users:** ${users.length - blocked.length}`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['🔙 Back to Admin']],
            resize_keyboard: true
        }
    });
}

async function showSettings(bot, chatId) {
    const botStatus = await getSetting('bot_status') || 'active';
    const paymentMethod = await getSetting('payment_method') || 'both';
    
    const message = `⚙️ **Bot Settings**
━━━━━━━━━━━━━━━━━━━━━

🤖 **Bot Status:** ${botStatus === 'active' ? '✅ Active' : '❌ Inactive'}
💳 **Payment:** ${paymentMethod}`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['🔙 Back to Admin']],
            resize_keyboard: true
        }
    });
}

async function showPayments(bot, chatId) {
    const orders = await getAllOrders();
    const pending = orders.filter(o => o.status === 'pending_approval');
    
    const message = `💰 **Payment Overview**
━━━━━━━━━━━━━━━━━━━━━

⏳ **Pending Approvals:** ${pending.length}
✅ **Completed:** ${orders.filter(o => o.status === 'delivered').length}
❌ **Rejected:** ${orders.filter(o => o.status === 'rejected').length}`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['🔙 Back to Admin']],
            resize_keyboard: true
        }
    });
}

async function showReports(bot, chatId) {
    const daily = await getDailyStats();
    
    const message = `📈 **Daily Report**
━━━━━━━━━━━━━━━━━━━━━

📦 **Orders Today:** ${daily.newOrders}
💰 **Revenue Today:** ₹${daily.revenue}
✅ **Successful:** ${daily.successful}`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['🔙 Back to Admin']],
            resize_keyboard: true
        }
    });
}

module.exports = { adminCommand, handleAdminText };
