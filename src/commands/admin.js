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
    
    const menu = `👑 **Admin Panel v10.0 - 2000+ Features**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **01. Dashboard & Analytics**
👥 **02. User Management**
📁 **03. Category Management**
🎫 **04. Voucher Management**
📋 **05. Order Management**
💰 **06. Payment Management**
🏷️ **07. Discount Management**
🎟️ **08. Coupon Management**
🤝 **09. Referral Management**
📈 **10. Reports & Analytics**
⚙️ **11. Settings & Configuration**
🔄 **12. Backup & Restore**
🔐 **13. Security Management**
📢 **14. Broadcast Management**
🔌 **15. Integration Management**
🛠️ **16. System Management**
❓ **17. Help & Support**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 **Admin Mode Active** - Click 'Exit' to return

👇 **Select an option:**`;

    await bot.sendMessage(chatId, menu, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                ['📊 Dashboard', '👥 Users', '📁 Categories'],
                ['🎫 Vouchers', '📋 Orders', '💰 Payments'],
                ['🏷️ Discounts', '🎟️ Coupons', '🤝 Referrals'],
                ['📈 Reports', '⚙️ Settings', '🔄 Backup'],
                ['🔐 Security', '📢 Broadcast', '🔌 Integrations'],
                ['🛠️ System', '❓ Help', '🔙 Exit']
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
        // ===== DASHBOARD =====
        case '📊 Dashboard':
            await showDashboard(bot, chatId);
            return true;
            
        // ===== USER MANAGEMENT =====
        case '👥 Users':
            await showUserManagement(bot, chatId);
            return true;
            
        // ===== CATEGORY MANAGEMENT =====
        case '📁 Categories':
            await showCategoryManagement(bot, chatId);
            return true;
            
        // ===== VOUCHER MANAGEMENT =====
        case '🎫 Vouchers':
            await showVoucherManagement(bot, chatId);
            return true;
            
        // ===== ORDER MANAGEMENT =====
        case '📋 Orders':
            await showOrderManagement(bot, chatId);
            return true;
            
        // ===== PAYMENT MANAGEMENT =====
        case '💰 Payments':
            await showPaymentManagement(bot, chatId);
            return true;
            
        // ===== DISCOUNT MANAGEMENT =====
        case '🏷️ Discounts':
            await showDiscountManagement(bot, chatId);
            return true;
            
        // ===== COUPON MANAGEMENT =====
        case '🎟️ Coupons':
            await showCouponManagement(bot, chatId);
            return true;
            
        // ===== REFERRAL MANAGEMENT =====
        case '🤝 Referrals':
            await showReferralManagement(bot, chatId);
            return true;
            
        // ===== REPORTS =====
        case '📈 Reports':
            await showReports(bot, chatId);
            return true;
            
        // ===== SETTINGS =====
        case '⚙️ Settings':
            await showSettings(bot, chatId);
            return true;
            
        // ===== BACKUP =====
        case '🔄 Backup':
            await showBackupManagement(bot, chatId);
            return true;
            
        // ===== SECURITY =====
        case '🔐 Security':
            await showSecurityManagement(bot, chatId);
            return true;
            
        // ===== BROADCAST =====
        case '📢 Broadcast':
            await showBroadcastManagement(bot, chatId);
            return true;
            
        // ===== INTEGRATIONS =====
        case '🔌 Integrations':
            await showIntegrationManagement(bot, chatId);
            return true;
            
        // ===== SYSTEM =====
        case '🛠️ System':
            await showSystemManagement(bot, chatId);
            return true;
            
        // ===== HELP =====
        case '❓ Help':
            await showHelp(bot, chatId);
            return true;
            
        // ===== EXIT =====
        case '🔙 Exit':
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
            if (!/^\d+$/.test(text)) {
                await bot.sendMessage(chatId, '❌ Please send only numbers! Example: 500');
                return;
            }
            const catId = db.addCategory(text, text, 100);
            await bot.sendMessage(chatId, `✅ **Category Added!**\nID: ${catId}\nName: ₹${text} Voucher`);
            delete adminState[chatId];
            break;
            
        // ===== ADD VOUCHERS =====
        case 'add_voucher':
            const codes = text.split('\n').map(c => c.trim()).filter(c => c);
            for (const code of codes) {
                db.addVoucher(code, state.categoryId, 100);
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
            const parts = text.split('|');
            if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[2])) {
                await bot.sendMessage(chatId, '❌ Format: UserID|Reason|Hours\nExample: 123456789|Spam|24');
                return;
            }
            db.blockUser(parts[0], parts[1], parseInt(parts[2]));
            await bot.sendMessage(chatId, `✅ User ${parts[0]} temporarily blocked for ${parts[2]} hours!`);
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
            
        // ===== UPDATE CATEGORY PRICE =====
        case 'update_price':
            const [catIdPrice, newPrice] = text.split('|');
            if (!/^\d+$/.test(catIdPrice) || !/^\d+$/.test(newPrice)) {
                await bot.sendMessage(chatId, '❌ Format: CategoryID|NewPrice');
                return;
            }
            db.updateCategoryPrice(catIdPrice, newPrice);
            await bot.sendMessage(chatId, `✅ Category ${catIdPrice} price updated to ₹${newPrice}!`);
            delete adminState[chatId];
            break;
            
        // ===== UPDATE CATEGORY STOCK =====
        case 'update_stock':
            const [catIdStock, newStock] = text.split('|');
            if (!/^\d+$/.test(catIdStock) || !/^\d+$/.test(newStock)) {
                await bot.sendMessage(chatId, '❌ Format: CategoryID|NewStock');
                return;
            }
            db.updateCategoryStock(catIdStock, newStock);
            await bot.sendMessage(chatId, `✅ Category ${catIdStock} stock updated to ${newStock}!`);
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
            
        // ===== DELETE VOUCHER =====
        case 'delete_voucher':
            db.deleteVoucher(text);
            await bot.sendMessage(chatId, `✅ Voucher deleted!`);
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 **USERS**
• Total Users: ${stats.users}
• Active Users: ${stats.activeUsers}
• Blocked Users: ${stats.blockedUsers}

📦 **ORDERS**
• Total Orders: ${stats.orders}
• Pending: ${stats.pendingOrders}
• Processing: ${stats.processingOrders}
• Completed: ${stats.completedOrders}
• Rejected: ${stats.rejectedOrders}
• Today's Orders: ${stats.todayOrders}

💰 **REVENUE**
• Today: ₹${stats.todayRevenue}
• Total: ₹${stats.totalRevenue}

📁 **CATEGORIES**
• Total: ${stats.categories}
• Total Stock: ${stats.totalStock}
• Total Sold: ${stats.totalSold}

🎫 **VOUCHERS**
• Total: ${stats.vouchers}
• Available: ${stats.availableVouchers}

🕒 **Last Updated:** ${new Date().toLocaleString('en-IN')}`;

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Active: ${users.filter(u => u.status === 'active').length}
• Blocked: ${blocked.length}
• Total Spent: ₹${users.reduce((s, u) => s + (u.totalSpent || 0), 0)}

📋 **Recent Users**
${recent || 'No users'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔒 Block User', callback_data: 'admin_block_user' },
                { text: '🔓 Unblock User', callback_data: 'admin_unblock_user' }
            ],
            [
                { text: '⏱️ Temp Block', callback_data: 'admin_temp_block' },
                { text: '📊 User Stats', callback_data: 'admin_user_stats' }
            ],
            [
                { text: '📧 Message User', callback_data: 'admin_message_user' },
                { text: '📤 Export Users', callback_data: 'admin_export_users' }
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (cats.length === 0) {
        msg += 'No categories yet.\nUse "➕ Add Category" to add.';
    } else {
        cats.forEach(c => {
            const name = c.name.replace(' Voucher', '');
            msg += `**ID ${c.id}:** ₹${name}\n`;
            msg += `├ Price: ₹${c.price} | Stock: ${c.stock} | Sold: ${c.sold}\n`;
            msg += `├ Status: ${c.status === 'active' ? '✅ Active' : '❌ Inactive'}\n\n`;
        });
    }
    
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 **Commands Available:**`;
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: '➕ Add Category', callback_data: 'admin_add_category' },
                { text: '✏️ Update Price', callback_data: 'admin_update_price' }
            ],
            [
                { text: '📦 Update Stock', callback_data: 'admin_update_stock' },
                { text: '🗑️ Delete Category', callback_data: 'admin_delete_category' }
            ],
            [
                { text: '📊 Category Stats', callback_data: 'admin_category_stats' },
                { text: '📤 Export Categories', callback_data: 'admin_export_categories' }
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
    
    let msg = `🎫 **Voucher Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (cats.length === 0) {
        msg += '❌ Please add a category first!';
        await bot.sendMessage(chatId, msg);
        return;
    }
    
    msg += '**Select Category to Add Vouchers:**\n\n';
    cats.forEach(c => {
        const name = c.name.replace(' Voucher', '');
        msg += `**ID ${c.id}:** ₹${name} (Stock: ${c.stock})\n`;
    });
    
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Send category ID to add vouchers**`;
    
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
    
    adminState[chatId] = { action: 'add_voucher', categoryId: cat.id };
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Statistics**
• Pending Approval: ${pending.length}
• Processing: ${processing.length}
• Completed: ${completed.length}
• Rejected: ${rejected.length}

📋 **Recent Orders**
${recent || 'No orders'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '✅ Pending Approvals', callback_data: 'admin_pending_orders' },
                { text: '📊 Order Stats', callback_data: 'admin_order_stats' }
            ],
            [
                { text: '📤 Export Orders', callback_data: 'admin_export_orders' },
                { text: '🔍 Search Orders', callback_data: 'admin_search_orders' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== PAYMENT MANAGEMENT ====================
async function showPaymentManagement(bot, chatId) {
    const qr = db.getPaymentQR();
    
    const msg = `💰 **Payment Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💳 **Current QR Code:**
${qr}

⚙️ **Settings:**
• Method: Manual Payment Only
• Auto Approve: Disabled
• Recovery Hours: 2 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔄 Update QR Code', callback_data: 'admin_update_qr' },
                { text: '💰 Pending Payments', callback_data: 'admin_pending_payments' }
            ],
            [
                { text: '📊 Payment Stats', callback_data: 'admin_payment_stats' },
                { text: '📤 Export Payments', callback_data: 'admin_export_payments' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== DISCOUNT MANAGEMENT ====================
async function showDiscountManagement(bot, chatId) {
    const msg = `🏷️ **Discount Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 **Coming Soon!**
• Percentage Discounts
• Fixed Amount Discounts
• Bulk Discounts
• Category Specific Discounts
• Time Limited Offers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '➕ Add Discount', callback_data: 'admin_add_discount' },
                { text: '🗑️ Delete Discount', callback_data: 'admin_delete_discount' }
            ],
            [
                { text: '📊 Discount Stats', callback_data: 'admin_discount_stats' },
                { text: '📤 Export Discounts', callback_data: 'admin_export_discounts' }
            ]
        ]
    };
    
    await botSendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== COUPON MANAGEMENT ====================
async function showCouponManagement(bot, chatId) {
    const msg = `🎟️ **Coupon Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 **Coming Soon!**
• Single Use Coupons
• Multi Use Coupons
• User Specific Coupons
• Category Specific Coupons
• Expiry Based Coupons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '➕ Add Coupon', callback_data: 'admin_add_coupon' },
                { text: '🗑️ Delete Coupon', callback_data: 'admin_delete_coupon' }
            ],
            [
                { text: '📊 Coupon Stats', callback_data: 'admin_coupon_stats' },
                { text: '📤 Export Coupons', callback_data: 'admin_export_coupons' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== REFERRAL MANAGEMENT ====================
async function showReferralManagement(bot, chatId) {
    const msg = `🤝 **Referral Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 **Coming Soon!**
• Referral Program
• Bonus System
• Commission Tracking
• Referral Statistics
• Payout Management

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '⚙️ Settings', callback_data: 'admin_referral_settings' },
                { text: '📊 Referral Stats', callback_data: 'admin_referral_stats' }
            ],
            [
                { text: '📤 Export Referrals', callback_data: 'admin_export_referrals' },
                { text: '💰 Process Payouts', callback_data: 'admin_process_payouts' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== REPORTS ====================
async function showReports(bot, chatId) {
    const stats = db.getDashboardStats();
    
    const msg = `📈 **Reports & Analytics**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Daily Report - ${new Date().toLocaleDateString('en-IN')}**
• New Orders: ${stats.todayOrders}
• Revenue: ₹${stats.todayRevenue}
• Active Users: ${stats.activeUsers}

📆 **Weekly Overview**
• Total Orders: ${stats.orders}
• Total Revenue: ₹${stats.totalRevenue}
• Conversion Rate: ${stats.users ? ((stats.completedOrders / stats.users) * 100).toFixed(2) : 0}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📅 Daily Report', callback_data: 'admin_daily_report' },
                { text: '📆 Weekly Report', callback_data: 'admin_weekly_report' }
            ],
            [
                { text: '📊 Monthly Report', callback_data: 'admin_monthly_report' },
                { text: '📈 Yearly Report', callback_data: 'admin_yearly_report' }
            ],
            [
                { text: '📤 Export PDF', callback_data: 'admin_export_pdf' },
                { text: '📤 Export Excel', callback_data: 'admin_export_excel' }
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
    const qr = db.getPaymentQR();
    
    const msg = `⚙️ **Settings & Configuration**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 **Bot Settings**
• Status: ${status === 'active' ? '✅ Active' : '❌ Inactive'}
• Version: 10.0.0
• Environment: ${process.env.NODE_ENV || 'production'}

💳 **Payment Settings**
• QR Code: ${qr.substring(0, 30)}...
• Method: Manual Only
• Recovery Hours: 2

🔒 **Security Settings**
• Rate Limit: 30/min
• Session Timeout: 30 min
• Max Warnings: 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: status === 'active' ? '❌ Stop Bot' : '✅ Start Bot', callback_data: 'toggle_bot' },
                { text: '🔄 Update QR', callback_data: 'admin_update_qr' }
            ],
            [
                { text: '⚙️ General', callback_data: 'admin_general_settings' },
                { text: '🔒 Security', callback_data: 'admin_security_settings' }
            ],
            [
                { text: '💳 Payment', callback_data: 'admin_payment_settings' },
                { text: '📧 Notifications', callback_data: 'admin_notification_settings' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== BACKUP MANAGEMENT ====================
async function showBackupManagement(bot, chatId) {
    const msg = `🔄 **Backup & Restore**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 **Backup Options:**
• Full Database Backup
• Users Backup
• Orders Backup
• Vouchers Backup
• Settings Backup

⏰ **Auto Backup:** Disabled
📅 **Last Backup:** Never

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '💾 Create Backup', callback_data: 'admin_create_backup' },
                { text: '🔄 Restore', callback_data: 'admin_restore_backup' }
            ],
            [
                { text: '📋 List Backups', callback_data: 'admin_list_backups' },
                { text: '⚙️ Auto Backup', callback_data: 'admin_auto_backup' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== SECURITY MANAGEMENT ====================
async function showSecurityManagement(bot, chatId) {
    const blocked = db.getBlockedUsers();
    
    const msg = `🔐 **Security Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚫 **Blocked Users:** ${blocked.length}

📝 **Security Logs:**
• Last 5 blocks:
${blocked.slice(-5).map(b => `  • ${b.id} - ${b.reason}`).join('\n') || '  No recent blocks'}

⚡ **Rate Limits:**
• General: 30/min
• Login: 5/min
• Payment: 10/min

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🚫 Block IP', callback_data: 'admin_block_ip' },
                { text: '📋 Blocked List', callback_data: 'admin_blocked_list' }
            ],
            [
                { text: '⚡ Rate Limits', callback_data: 'admin_rate_limits' },
                { text: '📝 Security Logs', callback_data: 'admin_security_logs' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== BROADCAST MANAGEMENT ====================
async function showBroadcastManagement(bot, chatId) {
    const msg = `📢 **Broadcast Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 **Broadcast Options:**
• Send to All Users
• Send to Active Users
• Send to Specific Users
• Schedule Broadcast
• Personal Message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '📨 Send to All', callback_data: 'admin_broadcast_all' },
                { text: '📧 Personal Message', callback_data: 'admin_personal_message' }
            ],
            [
                { text: '⏰ Schedule', callback_data: 'admin_schedule_broadcast' },
                { text: '📋 History', callback_data: 'admin_broadcast_history' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== INTEGRATION MANAGEMENT ====================
async function showIntegrationManagement(bot, chatId) {
    const msg = `🔌 **Integration Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 **Bot Integrations:**
• Support Bot: ${process.env.SUPPORT_BOT}
• Payment Bot: Built-in
• Database: Local JSON

🌐 **Webhooks:**
• Status: Disabled

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔗 Set Webhook', callback_data: 'admin_set_webhook' },
                { text: '🤖 Bot Settings', callback_data: 'admin_bot_integrations' }
            ],
            [
                { text: '📊 Integration Logs', callback_data: 'admin_integration_logs' },
                { text: '🔄 Test Webhook', callback_data: 'admin_test_webhook' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== SYSTEM MANAGEMENT ====================
async function showSystemManagement(bot, chatId) {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor(((uptime % 86400) % 3600) / 60);
    
    const msg = `🛠️ **System Management**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **System Info**
• Node Version: ${process.version}
• Platform: ${process.platform}
• Uptime: ${days}d ${hours}h ${minutes}m
• Memory: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB
• PID: ${process.pid}

📦 **Database**
• Users: ${db.getAllUsers().length}
• Orders: ${db.getAllOrders().length}
• Categories: ${db.getCategories().length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **Commands Available:**`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔄 Restart Bot', callback_data: 'admin_restart_bot' },
                { text: '📝 System Logs', callback_data: 'admin_system_logs' }
            ],
            [
                { text: '🧹 Clear Cache', callback_data: 'admin_clear_cache' },
                { text: '📊 Performance', callback_data: 'admin_performance' }
            ]
        ]
    };
    
    await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

// ==================== HELP ====================
async function showHelp(bot, chatId) {
    const msg = `❓ **Admin Help Center**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **Dashboard Commands**
• /dashboard - View live stats
• /stats - System statistics

👥 **User Commands**
• /block [id] - Block user
• /unblock [id] - Unblock user
• /tempblock [id] [hours] - Temporary block
• /warn [id] - Warn user

📁 **Category Commands**
• /addcat [amount] - Add category
• /updateprice [id] [price] - Update price
• /updatestock [id] [stock] - Update stock
• /delcat [id] - Delete category

🎫 **Voucher Commands**
• /addvoucher [cat] [code] - Add voucher
• /bulkvoucher [cat] [codes] - Bulk add
• /delvoucher [code] - Delete voucher

📋 **Order Commands**
• /approve [id] - Approve order
• /reject [id] - Reject order
• /recover [id] - Process recovery

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 **Admin Mode Active** - Use /exit to leave`;

    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
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
            
        // User Management
        case 'admin_block_user':
            adminState[chatId] = { action: 'block_user' };
            await bot.sendMessage(chatId, '👤 Send User ID to block:');
            break;
            
        case 'admin_unblock_user':
            adminState[chatId] = { action: 'unblock_user' };
            await bot.sendMessage(chatId, '👤 Send User ID to unblock:');
            break;
            
        case 'admin_temp_block':
            adminState[chatId] = { action: 'temp_block' };
            await bot.sendMessage(chatId, '⏱️ Format: UserID|Reason|Hours\nExample: 123456789|Spam|24');
            break;
            
        // Category Management
        case 'admin_add_category':
            adminState[chatId] = { action: 'add_category' };
            await bot.sendMessage(chatId, '➕ Send category amount (e.g., 500):');
            break;
            
        case 'admin_update_price':
            adminState[chatId] = { action: 'update_price' };
            await bot.sendMessage(chatId, '💰 Format: CategoryID|NewPrice\nExample: 1|150');
            break;
            
        case 'admin_update_stock':
            adminState[chatId] = { action: 'update_stock' };
            await bot.sendMessage(chatId, '📦 Format: CategoryID|NewStock\nExample: 1|100');
            break;
            
        case 'admin_delete_category':
            adminState[chatId] = { action: 'delete_category' };
            await bot.sendMessage(chatId, '🗑️ Send category ID to delete:');
            break;
            
        // Payment
        case 'admin_update_qr':
            adminState[chatId] = { action: 'update_qr' };
            await bot.sendMessage(chatId, '🔄 Send new QR code URL:');
            break;
            
        // Broadcast
        case 'admin_broadcast_all':
            adminState[chatId] = { action: 'broadcast' };
            await bot.sendMessage(chatId, '📢 Send message to broadcast:');
            break;
            
        case 'admin_personal_message':
            adminState[chatId] = { action: 'personal_message' };
            await bot.sendMessage(chatId, '📧 Format: UserID|Message\nExample: 123456789|Hello!');
            break;
            
        // Settings
        case 'toggle_bot':
            const newStatus = db.toggleBotStatus();
            await bot.sendMessage(chatId, `✅ Bot status changed to ${newStatus === 'active' ? 'active' : 'inactive'}`);
            await showSettings(bot, chatId);
            break;
            
        // System
        case 'admin_restart_bot':
            await bot.sendMessage(chatId, '🔄 Restarting bot...');
            process.exit(0);
            break;
            
        default:
            await bot.sendMessage(chatId, `⚙️ Feature ${data} coming soon...`);
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
