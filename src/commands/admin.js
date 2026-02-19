const db = require('../database/database');
const { deletePreviousMessage } = require('../utils/helpers');

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

// ==================== MAIN ADMIN PANEL ====================
async function adminCommand(bot, msg) {
    const chatId = msg.chat.id;
    
    await deletePreviousMessage(bot, chatId);
    setAdminMode(chatId);
    
    const menu = `👑 **Admin Panel v10.0**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Dashboard**
👥 **Users**
📁 **Categories**
🎫 **Vouchers**
📋 **Orders**
💰 **Payments**
⚙️ **Settings**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 **Admin Mode Active**

👇 **Select an option:**`;

    await bot.sendMessage(chatId, menu, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                ['📊 Dashboard', '👥 Users', '📁 Categories'],
                ['🎫 Vouchers', '📋 Orders', '💰 Payments'],
                ['⚙️ Settings', '← Exit Admin']
            ],
            resize_keyboard: true
        }
    });
}

// ==================== ADMIN TEXT HANDLER ====================
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
            
        case '← Exit Admin':
            exitAdminMode();
            const { startCommand } = require('./start');
            await startCommand(bot, msg);
            return true;
            
        default:
            console.log(`Admin: ${text} - ignored`);
            return true;
    }
}

// ==================== ADMIN INPUT HANDLER ====================
async function handleAdminInput(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = adminState[chatId];
    
    if (!state) return;
    
    switch(state.action) {
        // ===== ADD CATEGORY =====
        case 'add_category':
            const parts = text.split('|');
            if (parts.length < 3) {
                await bot.sendMessage(chatId, '❌ Format: Name|BasePrice|Stock\nExample: 500|500|100');
                return;
            }
            
            const name = parts[0].trim();
            const basePrice = parseInt(parts[1]);
            const stock = parseInt(parts[2]);
            
            // Default prices
            const prices = {
                1: Math.round(basePrice * 0.06),
                5: Math.round(basePrice * 0.055),
                10: Math.round(basePrice * 0.05),
                20: Math.round(basePrice * 0.045)
            };
            
            const id = db.addCategory(name, basePrice, prices, stock);
            await bot.sendMessage(chatId, `✅ **Category Added!**\nID: ${id}\nName: ₹${name} Shein Voucher`);
            delete adminState[chatId];
            break;
            
        // ===== UPDATE CATEGORY PRICE =====
        case 'update_price':
            const [catId, qty, newPrice] = text.split('|');
            if (!catId || !qty || !newPrice) {
                await bot.sendMessage(chatId, '❌ Format: CategoryID|Quantity|NewPrice\nExample: 1|5|52');
                return;
            }
            
            db.updateCategoryPrice(catId, qty, parseInt(newPrice));
            await bot.sendMessage(chatId, `✅ Category ${catId} price for ${qty} codes updated to ₹${newPrice}!`);
            delete adminState[chatId];
            break;
            
        // ===== UPDATE CATEGORY STOCK =====
        case 'update_stock':
            const [stockCatId, newStock] = text.split('|');
            if (!stockCatId || !newStock) {
                await bot.sendMessage(chatId, '❌ Format: CategoryID|NewStock\nExample: 1|200');
                return;
            }
            
            db.updateCategoryStock(stockCatId, parseInt(newStock));
            await bot.sendMessage(chatId, `✅ Category ${stockCatId} stock updated to ${newStock}!`);
            delete adminState[chatId];
            break;
            
        // ===== DELETE CATEGORY =====
        case 'delete_category':
            if (!/^\d+$/.test(text)) {
                await bot.sendMessage(chatId, '❌ Please send category ID');
                return;
            }
            
            db.deleteCategory(text);
            db.deleteVouchersByCategory(text);
            await bot.sendMessage(chatId, `✅ Category ${text} deleted!`);
            delete adminState[chatId];
            break;
            
        // ===== ADD VOUCHERS =====
        case 'add_voucher':
            const codes = text.split('\n').map(c => c.trim()).filter(c => c);
            for (const code of codes) {
                db.addVoucher(code, state.categoryId, state.price);
            }
            await bot.sendMessage(chatId, `✅ ${codes.length} vouchers added to category!`);
            delete adminState[chatId];
            break;
            
        // ===== BLOCK USER =====
        case 'block_user':
            if (!/^\d+$/.test(text)) {
                await bot.sendMessage(chatId, '❌ Please send a valid User ID');
                return;
            }
            db.blockUser(text, 'Blocked by admin');
            await bot.sendMessage(chatId, `✅ User ${text} blocked!`);
            delete adminState[chatId];
            break;
            
        // ===== UNBLOCK USER =====
        case 'unblock_user':
            if (!/^\d+$/.test(text)) {
                await bot.sendMessage(chatId, '❌ Please send a valid User ID');
                return;
            }
            db.unblockUser(text);
            await bot.sendMessage(chatId, `✅ User ${text} unblocked!`);
            delete adminState[chatId];
            break;
            
        // ===== TEMPORARY BLOCK =====
        case 'temp_block':
            const blockParts = text.split('|');
            if (blockParts.length !== 3 || !/^\d+$/.test(blockParts[0]) || !/^\d+$/.test(blockParts[2])) {
                await bot.sendMessage(chatId, '❌ Format: UserID|Reason|Hours\nExample: 123456789|Spam|24');
                return;
            }
            db.blockUser(blockParts[0], blockParts[1], parseInt(blockParts[2]));
            await bot.sendMessage(chatId, `✅ User ${blockParts[0]} temporarily blocked for ${blockParts[2]} hours!`);
            delete adminState[chatId];
            break;
            
        // ===== BROADCAST =====
        case 'broadcast':
            await broadcastToAll(bot, text);
            await bot.sendMessage(chatId, '📢 Broadcast sent to all users!');
            delete adminState[chatId];
            break;
            
        // ===== PERSONAL MESSAGE =====
        case 'personal_message':
            const [targetId, ...msgParts] = text.split('|');
            const message = msgParts.join('|');
            if (!/^\d+$/.test(targetId)) {
                await bot.sendMessage(chatId, '❌ Format: UserID|Message');
                return;
            }
            await sendPersonalMessage(bot, targetId, message);
            await bot.sendMessage(chatId, `✅ Message sent to user ${targetId}!`);
            delete adminState[chatId];
            break;
            
        // ===== UPDATE PAYMENT QR =====
        case 'update_qr':
            db.updatePaymentQR(text);
            await bot.sendMessage(chatId, `✅ Payment QR updated!`);
            delete adminState[chatId];
            break;
            
        default:
            console.log('Unknown admin action:', state.action);
    }
}

// ==================== DASHBOARD ====================
async function showDashboard(bot, chatId) {
    const stats = db.getDashboardStats();
    
    const msg = `📊 **Dashboard - Live Statistics**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 **USERS**
• Total: ${stats.users}
• Active: ${stats.activeUsers}
• Blocked: ${stats.blockedUsers}

📦 **ORDERS**
• Total: ${stats.orders}
• Pending: ${stats.pendingOrders}
• Processing: ${stats.processingOrders}
• Completed: ${stats.completedOrders}
• Rejected: ${stats.rejectedOrders}
• Today: ${stats.todayOrders}

💰 **REVENUE**
• Today: ₹${stats.todayRevenue}
• Total: ₹${stats.totalRevenue}

📁 **CATEGORIES**
• Total: ${stats.categories}
• Stock: ${stats.totalStock}
• Sold: ${stats.totalSold}

🎫 **VOUCHERS**
• Total: ${stats.vouchers}
• Available: ${stats.availableVouchers}

🕒 ${new Date().toLocaleString('en-IN')}`;

    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
}

// ==================== USER MANAGEMENT ====================
async function showUserManagement(bot, chatId) {
    const users = db.getAllUsers();
    const blocked = db.getBlockedUsers();
    
    const recent = users.slice(-5).reverse().map(u => 
        `• ${u.firstName} (@${u.username}) - ${u.orders?.length || 0} orders`
    ).join('\n');
    
    const msg = `👥 **User Management** (${users.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Active:** ${users.filter(u => u.status === 'active').length}
🚫 **Blocked:** ${blocked.length}
💰 **Total Spent:** ₹${users.reduce((s, u) => s + (u.totalSpent || 0), 0)}

📋 **Recent Users**
${recent || 'No users'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔒 Block', callback_data: 'admin_block_user' },
                { text: '🔓 Unblock', callback_data: 'admin_unblock_user' }
            ],
            [
                { text: '⏱️ Temp Block', callback_data: 'admin_temp_block' },
                { text: '📧 Message', callback_data: 'admin_message_user' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== CATEGORY MANAGEMENT ====================
async function showCategoryManagement(bot, chatId) {
    const cats = db.getCategories();
    
    let msg = `📁 **Category Management** (${cats.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (cats.length === 0) {
        msg += 'No categories yet.\nUse "➕ Add Category" to add.';
    } else {
        cats.forEach(c => {
            msg += `**ID ${c.id}:** ${c.name}\n`;
            msg += `├ Base Price: ₹${c.basePrice}\n`;
            msg += `├ Stock: ${c.stock} | Sold: ${c.sold}\n`;
            msg += `├ Prices: 1→₹${c.prices[1]}, 5→₹${c.prices[5]}, 10→₹${c.prices[10]}, 20+→₹${c.prices[20]}\n\n`;
        });
    }
    
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 **Commands:**`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: '➕ Add', callback_data: 'admin_add_category' },
                { text: '✏️ Price', callback_data: 'admin_update_price' }
            ],
            [
                { text: '📦 Stock', callback_data: 'admin_update_stock' },
                { text: '🗑️ Delete', callback_data: 'admin_delete_category' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== VOUCHER MANAGEMENT ====================
async function showVoucherManagement(bot, chatId) {
    const cats = db.getCategories();
    
    if (cats.length === 0) {
        await bot.sendMessage(chatId, '❌ Please add a category first!');
        return;
    }
    
    let msg = `🎫 **Voucher Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    msg += '**Select Category:**\n\n';
    cats.forEach(c => {
        const available = db.getAvailableVouchers(c.id).length;
        msg += `**ID ${c.id}:** ${c.name}\n`;
        msg += `├ Stock: ${c.stock} | Available Vouchers: ${available}\n\n`;
    });
    
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSend category ID to add vouchers`;
    
    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    
    // Wait for category ID
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
        await bot.sendMessage(chatId, '❌ Invalid category ID');
        return;
    }
    
    adminState[chatId] = { action: 'add_voucher', categoryId: cat.id, price: cat.basePrice };
    await bot.sendMessage(chatId, '📝 Send voucher codes (one per line):');
}

// ==================== ORDER MANAGEMENT ====================
async function showOrderManagement(bot, chatId) {
    const orders = db.getAllOrders();
    
    const pending = orders.filter(o => o.status === 'pending_approval');
    const processing = orders.filter(o => o.status === 'processing');
    const completed = orders.filter(o => o.status === 'delivered');
    const rejected = orders.filter(o => o.status === 'rejected');
    
    const recent = orders.slice(-5).reverse().map(o => 
        `• ${o.id} - ₹${o.totalPrice} (${o.status})`
    ).join('\n');
    
    const msg = `📋 **Order Management** (${orders.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Pending:** ${pending.length}
⚙️ **Processing:** ${processing.length}
✅ **Completed:** ${completed.length}
❌ **Rejected:** ${rejected.length}

📋 **Recent Orders**
${recent || 'No orders'}`;

    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
}

// ==================== PAYMENT MANAGEMENT ====================
async function showPaymentManagement(bot, chatId) {
    const qr = db.getPaymentQR();
    
    const msg = `💰 **Payment Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💳 **Current QR Code:**
${qr}

⚙️ **Settings:**
• Method: Manual Payment Only
• Recovery Hours: 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔄 Update QR', callback_data: 'admin_update_qr' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== SETTINGS ====================
async function showSettings(bot, chatId) {
    const status = db.getBotStatus();
    
    const msg = `⚙️ **Settings**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 **Bot Status:** ${status === 'active' ? '✅ Active' : '❌ Inactive'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: status === 'active' ? '❌ Stop Bot' : '✅ Start Bot', callback_data: 'toggle_bot' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== CALLBACK HANDLER ====================
async function handleAdminCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    
    switch(data) {
        case 'admin_add_category':
            adminState[chatId] = { action: 'add_category' };
            await bot.sendMessage(chatId, '➕ Format: Name|BasePrice|Stock\nExample: 500|500|100');
            break;
            
        case 'admin_update_price':
            adminState[chatId] = { action: 'update_price' };
            await bot.sendMessage(chatId, '✏️ Format: CategoryID|Quantity|NewPrice\nExample: 1|5|52');
            break;
            
        case 'admin_update_stock':
            adminState[chatId] = { action: 'update_stock' };
            await bot.sendMessage(chatId, '📦 Format: CategoryID|NewStock\nExample: 1|200');
            break;
            
        case 'admin_delete_category':
            adminState[chatId] = { action: 'delete_category' };
            await bot.sendMessage(chatId, '🗑️ Send category ID to delete:');
            break;
            
        case 'admin_block_user':
            adminState[chatId] = { action: 'block_user' };
            await bot.sendMessage(chatId, '🔒 Send User ID to block:');
            break;
            
        case 'admin_unblock_user':
            adminState[chatId] = { action: 'unblock_user' };
            await bot.sendMessage(chatId, '🔓 Send User ID to unblock:');
            break;
            
        case 'admin_temp_block':
            adminState[chatId] = { action: 'temp_block' };
            await bot.sendMessage(chatId, '⏱️ Format: UserID|Reason|Hours\nExample: 123456789|Spam|24');
            break;
            
        case 'admin_message_user':
            adminState[chatId] = { action: 'personal_message' };
            await bot.sendMessage(chatId, '📧 Format: UserID|Message\nExample: 123456789|Hello!');
            break;
            
        case 'admin_update_qr':
            adminState[chatId] = { action: 'update_qr' };
            await bot.sendMessage(chatId, '🔄 Send new QR code URL:');
            break;
            
        case 'toggle_bot':
            const newStatus = db.toggleBotStatus();
            await bot.sendMessage(chatId, `✅ Bot status changed to ${newStatus === 'active' ? 'active' : 'inactive'}`);
            await showSettings(bot, chatId);
            break;
            
        default:
            console.log('Unknown admin callback:', data);
    }
}

// ==================== UTILITY FUNCTIONS ====================

async function broadcastToAll(bot, message) {
    const users = db.getAllUsers();
    let sent = 0;
    
    for (const user of users) {
        try {
            await bot.sendMessage(user.id, message);
            sent++;
            await new Promise(resolve => setTimeout(resolve, 50));
        } catch (e) {
            console.log(`Failed to send to ${user.id}`);
        }
    }
    
    return sent;
}

async function sendPersonalMessage(bot, userId, message) {
    try {
        await bot.sendMessage(parseInt(userId), message);
        return true;
    } catch {
        return false;
    }
}

// ==================== EXPORT ====================
module.exports = {
    adminCommand,
    handleAdminText,
    handleAdminCallback,
    adminState,
    setAdminMode,
    exitAdminMode,
    isAdminMode
};
