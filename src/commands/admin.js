const db = require('../database/database');

// Admin state store
let adminState = {};
let adminMode = false;
let adminChatId = null;

// Admin Mode functions
function setAdminMode(chatId) {
    adminMode = true;
    adminChatId = chatId;
}

function exitAdminMode() {
    adminMode = false;
    adminChatId = null;
}

function isAdminMode(chatId) {
    return adminMode && adminChatId === chatId;
}

async function adminCommand(bot, msg) {
    const chatId = msg.chat.id;
    setAdminMode(chatId);
    
    const menu = `👑 **Admin Panel**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Dashboard**
👥 **Users**
📁 **Categories**
🎫 **Vouchers**
📋 **Orders**
⚙️ **Settings**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 **Admin Mode** - Click 'Exit' to return`;

    await bot.sendMessage(chatId, menu, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                ['📊 Dashboard', '👥 Users', '📁 Categories'],
                ['🎫 Vouchers', '📋 Orders', '⚙️ Settings'],
                ['🔙 Exit Admin']
            ],
            resize_keyboard: true
        }
    });
}

// ==================== হ্যান্ডলার ====================
async function handleAdminText(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (!isAdminMode(chatId)) return false;
    
    if (adminState[chatId]) {
        await handleAdminInput(bot, msg);
        return true;
    }
    
    switch(text) {
        case '📊 Dashboard':
            await showDashboard(bot, chatId);
            return true;
            
        case '👥 Users':
            await showUsers(bot, chatId);
            return true;
            
        case '📁 Categories':
            await showCategories(bot, chatId);
            return true;
            
        case '🎫 Vouchers':
            await showVouchers(bot, chatId);
            return true;
            
        case '📋 Orders':
            await showOrders(bot, chatId);
            return true;
            
        case '⚙️ Settings':
            await showSettings(bot, chatId);
            return true;
            
        case '🔙 Exit Admin':
            exitAdminMode();
            const { startCommand } = require('./start');
            await startCommand(bot, msg);
            return true;
            
        default:
            console.log(`Admin: ${text} - ignored`);
            return true;
    }
}

async function handleAdminInput(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = adminState[chatId];
    
    if (!state) return;
    
    switch(state.action) {
        case 'add_category':
            if (!/^\d+$/.test(text)) {
                await bot.sendMessage(chatId, '❌ Only numbers! Example: 500');
                return;
            }
            db.addCategory(text, text, 100);
            await bot.sendMessage(chatId, `✅ ₹${text} Voucher added!`);
            delete adminState[chatId];
            break;
            
        case 'add_voucher':
            const codes = text.split('\n').map(c => c.trim()).filter(c => c);
            for (const code of codes) {
                db.addVoucher(code, state.categoryId, 100);
            }
            await bot.sendMessage(chatId, `✅ ${codes.length} vouchers added!`);
            delete adminState[chatId];
            break;
    }
}

// ==================== ড্যাশবোর্ড ====================
async function showDashboard(bot, chatId) {
    const stats = db.getDashboardStats();
    
    const msg = `📊 **Dashboard**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 **Users:** ${stats.users} (Active: ${stats.activeUsers})
🚫 **Blocked:** ${stats.blockedUsers}
📦 **Orders:** ${stats.orders} (Pending: ${stats.pendingOrders})
✅ **Completed:** ${stats.completedOrders}
💰 **Today:** ₹${stats.todayRevenue}
💰 **Total:** ₹${stats.totalRevenue}
📁 **Categories:** ${stats.categories}
🎫 **Vouchers:** ${stats.vouchers} (Available: ${stats.availableVouchers})

🕒 ${new Date().toLocaleString('en-IN')}`;

    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
}

// ==================== ইউজার ====================
async function showUsers(bot, chatId) {
    const users = db.getAllUsers();
    const blocked = db.getBlockedUsers();
    
    const recent = users.slice(-5).reverse().map(u => 
        `• ${u.firstName} (@${u.username}) - ${u.orders?.length || 0} orders`
    ).join('\n');
    
    const msg = `👥 **Users** (${users.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Active:** ${users.filter(u => u.status === 'active').length}
🚫 **Blocked:** ${blocked.length}

📋 **Recent:**
${recent || 'No users'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use /block [id] and /unblock [id]`;

    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
}

// ==================== ক্যাটাগরি ====================
async function showCategories(bot, chatId) {
    const cats = db.getCategories();
    
    let msg = `📁 **Categories** (${cats.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (cats.length === 0) {
        msg += 'No categories yet.\nSend amount to add (e.g., 500)';
    } else {
        cats.forEach(c => {
            const name = c.name.replace(' Voucher', '');
            msg += `${name} - ₹${c.price} | Stock: ${c.stock} | Sold: ${c.sold}\n`;
        });
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSend amount to add more`;
    }
    
    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    adminState[chatId] = { action: 'add_category' };
}

// ==================== ভাউচার ====================
async function showVouchers(bot, chatId) {
    const cats = db.getCategories();
    
    if (cats.length === 0) {
        await bot.sendMessage(chatId, '❌ Add category first!');
        return;
    }
    
    let msg = `🎫 **Select Category**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    cats.forEach(c => {
        const name = c.name.replace(' Voucher', '');
        msg += `ID ${c.id}: ${name} (Stock: ${c.stock})\n`;
    });
    
    msg += `\nSend category ID:`;
    
    await bot.sendMessage(chatId, msg);
    
    // ওয়েট ফর ক্যাটাগরি আইডি
    const response = await new Promise(resolve => {
        const handler = (m) => {
            if (m.chat.id === chatId) {
                bot.removeListener('message', handler);
                resolve(m.text);
            }
        };
        bot.on('message', handler);
    });
    
    const cat = cats.find(c => c.id === response);
    if (!cat) {
        await bot.sendMessage(chatId, '❌ Invalid ID');
        return;
    }
    
    adminState[chatId] = { action: 'add_voucher', categoryId: cat.id };
    await bot.sendMessage(chatId, '📝 Send voucher codes (one per line):');
}

// ==================== অর্ডার ====================
async function showOrders(bot, chatId) {
    const orders = db.getAllOrders();
    
    const pending = orders.filter(o => o.status === 'pending_approval').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    
    const recent = orders.slice(-3).map(o => 
        `• ${o.id} - ₹${o.totalPrice} (${o.status})`
    ).join('\n');
    
    const msg = `📋 **Orders** (${orders.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Pending: ${pending}
⚙️ Processing: ${processing}
✅ Completed: ${completed}

📋 Recent:
${recent || 'No orders'}`;

    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
}

// ==================== সেটিংস ====================
async function showSettings(bot, chatId) {
    const status = db.getBotStatus();
    
    const msg = `⚙️ **Settings**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Bot: ${status === 'active' ? '✅ Active' : '❌ Inactive'}
💳 Payment: Manual Only
⏱️ Recovery: 2 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use /toggle to change status`;

    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
}

// ==================== এক্সপোর্ট ====================
module.exports = {
    adminCommand,
    handleAdminText,
    adminState,
    setAdminMode,
    exitAdminMode,
    isAdminMode
};
