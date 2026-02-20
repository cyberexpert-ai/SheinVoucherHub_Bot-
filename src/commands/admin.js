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
            // Check for /updateprice command
            if (text.startsWith('/updateprice')) {
                const parts = text.split(' ');
                if (parts.length !== 2) {
                    await bot.sendMessage(chatId, 
                        '❌ **Format:** /updateprice CategoryID|Quantity|NewPrice\n\n' +
                        'Example: `/updateprice 1|5|52`\n' +
                        'This will update price for 5 codes in category 1 to ₹52',
                        { parse_mode: 'Markdown' }
                    );
                    return true;
                }
                
                const [catId, qty, newPrice] = parts[1].split('|');
                if (!catId || !qty || !newPrice) {
                    await bot.sendMessage(chatId, 
                        '❌ **Invalid Format!**\n\n' +
                        'Use: `/updateprice CategoryID|Quantity|NewPrice`\n' +
                        'Example: `/updateprice 1|5|52`',
                        { parse_mode: 'Markdown' }
                    );
                    return true;
                }
                
                const cat = db.getCategory(catId);
                if (!cat) {
                    await bot.sendMessage(chatId, '❌ Category not found!');
                    return true;
                }
                
                db.updateCategoryPrice(catId, qty, parseInt(newPrice));
                await bot.sendMessage(chatId, 
                    `✅ **Price Updated!**\n\n` +
                    `Category: ${cat.name}\n` +
                    `Quantity: ${qty} code${qty > 1 ? 's' : ''}\n` +
                    `New Price: ₹${newPrice} per code`,
                    { parse_mode: 'Markdown' }
                );
                return true;
            }
            
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
    
    // Check if it's a back command
    if (text === '← Back' || text === '← Exit Admin' || text === 'Back') {
        delete adminState[chatId];
        await adminCommand(bot, msg);
        return;
    }
    
    switch(state.action) {
        // ===== ADD CATEGORY - শুধু সংখ্যা দিলেই হবে =====
        case 'add_category':
            if (!/^\d+$/.test(text)) {
                await bot.sendMessage(chatId, '❌ Please send only numbers!\nExample: 500');
                return;
            }
            
            const catId = db.addCategory(text);
            await bot.sendMessage(chatId, `✅ **Category Added!**\nID: ${catId}\nName: ₹${text} Shein Voucher`);
            delete adminState[chatId];
            break;
            
        // ===== UPDATE CATEGORY PRICE =====
        case 'update_category_price':
            const [catIdPrice, qtyPrice, newPriceVal] = text.split('|');
            if (!catIdPrice || !qtyPrice || !newPriceVal) {
                await bot.sendMessage(chatId, 
                    '❌ **Format:** CategoryID|Quantity|NewPrice\n\n' +
                    'Example: `1|5|52`\n' +
                    'This will update price for 5 codes in category 1 to ₹52'
                );
                return;
            }
            
            const category = db.getCategory(catIdPrice);
            if (!category) {
                await bot.sendMessage(chatId, '❌ Category not found!');
                return;
            }
            
            db.updateCategoryPrice(catIdPrice, qtyPrice, parseInt(newPriceVal));
            await bot.sendMessage(chatId, 
                `✅ **Price Updated!**\n\n` +
                `Category: ${category.name}\n` +
                `Quantity: ${qtyPrice} code${qtyPrice > 1 ? 's' : ''}\n` +
                `New Price: ₹${newPriceVal} per code`,
                { parse_mode: 'Markdown' }
            );
            delete adminState[chatId];
            break;
            
        // ===== UPDATE CATEGORY STOCK =====
        case 'update_stock':
            const [stockCatId, newStock] = text.split('|');
            if (!stockCatId || !newStock) {
                await bot.sendMessage(chatId, '❌ Format: CategoryID|NewStock\nExample: 1|200');
                return;
            }
            
            db.updateCategoryStock(stockCatId, parseInt(newStock) - db.getCategory(stockCatId)?.stock || 0);
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
            
        // ===== ADD VOUCHERS - কোড লিখলেই হবে =====
        case 'add_voucher':
            const codes = text.split('\n').map(c => c.trim()).filter(c => c);
            for (const code of codes) {
                db.addVoucher(code, state.categoryId);
            }
            const cat = db.getCategory(state.categoryId);
            await bot.sendMessage(chatId, `✅ ${codes.length} vouchers added to category!\nCurrent stock: ${cat.stock}`);
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
        msg += 'No categories yet.\nSend a number to add category (e.g., 500)';
    } else {
        cats.forEach(c => {
            const availableVouchers = db.getAvailableVouchersCount(c.id);
            msg += `**ID ${c.id}:** ${c.name}\n`;
            msg += `├ Stock: ${c.stock} | Vouchers: ${availableVouchers} | Sold: ${c.sold}\n`;
            msg += `├ Prices:\n`;
            // সব প্রাইস দেখান
            Object.keys(c.prices).sort((a,b) => parseInt(a)-parseInt(b)).forEach(qty => {
                msg += `│  • ${qty} code${qty > 1 ? 's' : ''}: ₹${c.prices[qty]}\n`;
            });
            msg += `\n`;
        });
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `To update price: /updateprice [id]|[qty]|[price]\n`;
        msg += `Example: /updateprice 1|5|52\n`;
        msg += `\nSend a number to add new category`;
    }
    
    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
    adminState[chatId] = { action: 'add_category' };
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
    
    // Create inline keyboard with categories
    const keyboard = {
        inline_keyboard: cats.map(cat => {
            const available = db.getAvailableVouchersCount(cat.id);
            return [{
                text: `${cat.name} (Available: ${available} / Stock: ${cat.stock})`,
                callback_data: `admin_select_cat_${cat.id}`
            }];
        })
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
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
📢 **Channel 1:** ${db.getSetting('channel_1')}
📢 **Channel 2:** ${db.getSetting('channel_2')}
📢 **Channel 2 ID:** ${db.getSetting('channel_2_id')}

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
    
    if (data.startsWith('admin_select_cat_')) {
        const categoryId = data.replace('admin_select_cat_', '');
        const cat = db.getCategory(categoryId);
        
        adminState[chatId] = { action: 'add_voucher', categoryId: categoryId };
        await bot.sendMessage(chatId, `📝 Send voucher codes for ${cat.name}\n(One per line):`);
        return;
    }
    
    switch(data) {
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
            
        case 'admin_update_category_price':
            adminState[chatId] = { action: 'update_category_price' };
            await bot.sendMessage(chatId, 
                '💰 **Update Category Price**\n\n' +
                'Send in this format:\n' +
                '`CategoryID|Quantity|NewPrice`\n\n' +
                'Example: `1|5|52`\n' +
                '(This will set price for 5 codes in category 1 to ₹52)',
                { parse_mode: 'Markdown' }
            );
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
