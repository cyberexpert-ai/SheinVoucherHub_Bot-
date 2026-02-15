const { 
    getCategories, addCategory, updateCategoryStock,
    addVoucher, blockUser, unblockUser,
    getSetting, updateSetting,
    getUserOrders, getOrder
} = require('../sheets/googleSheets');

let adminState = {};

async function adminCommand(bot, msg) {
    const chatId = msg.chat.id;
    
    const adminMenu = `👑 Admin Panel
━━━━━━━━━━━━━━━━━━━━━

📊 System Management
📦 Voucher Management
👥 User Management
📢 Broadcast
⚙️ Settings

Select an option:`;

    await bot.sendMessage(chatId, adminMenu, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📊 System Stats', callback_data: 'admin_stats' }],
                [{ text: '📦 Manage Categories', callback_data: 'admin_categories' }],
                [{ text: '➕ Add Vouchers', callback_data: 'admin_add_vouchers' }],
                [{ text: '👥 Block/Unblock User', callback_data: 'admin_block_user' }],
                [{ text: '📢 Broadcast Message', callback_data: 'admin_broadcast' }],
                [{ text: '⚙️ Bot Settings', callback_data: 'admin_settings' }],
                [{ text: '🔙 Main Menu', callback_data: 'back_to_main' }]
            ]
        }
    });
}

async function handleAdminCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    if (userId.toString() !== process.env.ADMIN_ID) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: 'Unauthorized!' });
    }
    
    switch(data) {
        case 'admin_stats':
            await showStats(bot, chatId);
            break;
            
        case 'admin_categories':
            await manageCategories(bot, chatId);
            break;
            
        case 'admin_add_vouchers':
            await addVouchersMenu(bot, chatId);
            break;
            
        case 'admin_block_user':
            await blockUserMenu(bot, chatId);
            break;
            
        case 'admin_broadcast':
            await broadcastMenu(bot, chatId);
            break;
            
        case 'admin_settings':
            await settingsMenu(bot, chatId);
            break;
    }
}

async function showStats(bot, chatId) {
    const categories = await getCategories();
    
    let stats = `📊 System Statistics
━━━━━━━━━━━━━━━━━━━━━

📦 Categories: ${categories.length}\n\n`;
    
    for (const cat of categories) {
        stats += `• ${cat.name}: ${cat.stock} codes available\n`;
        stats += `  Price: ₹${cat.price_per_code}\n`;
        stats += `  Sold: ${cat.total_sold}\n\n`;
    }
    
    await bot.sendMessage(chatId, stats, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function manageCategories(bot, chatId) {
    const categories = await getCategories();
    
    let message = `📦 Category Management
━━━━━━━━━━━━━━━━━━━━━

Existing Categories:\n\n`;
    
    categories.forEach(cat => {
        message += `• ${cat.name} (ID: ${cat.category_id})\n`;
        message += `  Price: ₹${cat.price_per_code} | Stock: ${cat.stock}\n\n`;
    });
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Add Category', callback_data: 'admin_add_category' }],
                [{ text: '✏️ Update Stock', callback_data: 'admin_update_stock' }],
                [{ text: '🗑 Delete Category', callback_data: 'admin_delete_category' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

async function addVouchersMenu(bot, chatId) {
    const categories = await getCategories();
    
    const keyboard = categories.map(cat => [
        { text: cat.name, callback_data: `add_voucher_${cat.category_id}` }
    ]);
    
    keyboard.push([{ text: '🔙 Back', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, 'Select category to add vouchers:', {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function blockUserMenu(bot, chatId) {
    adminState[chatId] = { action: 'block_user' };
    
    await bot.sendMessage(chatId, '👥 Enter User ID to block/unblock:\n\nFormat: <user_id> <reason> <type>\nType: permanent/temporary\n\nExample: 123456789 Spam permanent');
}

async function broadcastMenu(bot, chatId) {
    adminState[chatId] = { action: 'broadcast' };
    
    await bot.sendMessage(chatId, '📢 Send the message you want to broadcast to all users:');
}

async function settingsMenu(bot, chatId) {
    const botStatus = await getSetting('bot_status');
    const paymentMethod = await getSetting('payment_method');
    const captchaEnabled = await getSetting('captcha_enabled');
    const recoveryHours = await getSetting('recovery_hours');
    
    const message = `⚙️ Bot Settings
━━━━━━━━━━━━━━━━━━━━━

🤖 Bot Status: ${botStatus === 'active' ? '✅ Active' : '❌ Inactive'}
💳 Payment Method: ${paymentMethod}
🔐 Captcha: ${captchaEnabled === 'true' ? '✅ Enabled' : '❌ Disabled'}
⏱ Recovery Hours: ${recoveryHours}

Select setting to change:`;

    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: botStatus === 'active' ? '❌ Stop Bot' : '✅ Start Bot', callback_data: 'toggle_bot' }],
                [{ text: '💳 Toggle Payment Method', callback_data: 'toggle_payment' }],
                [{ text: '🔐 Toggle Captcha', callback_data: 'toggle_captcha' }],
                [{ text: '⏱ Set Recovery Hours', callback_data: 'set_recovery' }],
                [{ text: '🔙 Back', callback_data: 'admin_back' }]
            ]
        }
    });
}

module.exports = { adminCommand, handleAdminCallback };

// Add this to src/commands/admin.js

async function handleAdminCallback(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    if (userId.toString() !== process.env.ADMIN_ID) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: 'Unauthorized!' });
    }
    
    switch(data) {
        case 'admin_stats':
            await showStats(bot, chatId);
            break;
            
        case 'admin_categories':
            await manageCategories(bot, chatId);
            break;
            
        case 'admin_add_category':
            adminState[chatId] = { action: 'add_category' };
            await bot.sendMessage(chatId, '➕ Add New Category\n\nFormat: Name|Price|Stock\nExample: ₹1000 Voucher|100|50');
            break;
            
        case 'admin_update_stock':
            adminState[chatId] = { action: 'update_stock' };
            await bot.sendMessage(chatId, '✏️ Update Stock\n\nFormat: CategoryID|NewStock\nExample: 1|100');
            break;
            
        case 'admin_delete_category':
            adminState[chatId] = { action: 'delete_category' };
            await bot.sendMessage(chatId, '🗑 Delete Category\n\nSend Category ID to delete:');
            break;
            
        case 'admin_add_vouchers':
            await addVouchersMenu(bot, chatId);
            break;
            
        case 'admin_block_user':
            adminState[chatId] = { action: 'block_user' };
            await bot.sendMessage(chatId, '👥 Block User\n\nFormat: UserID|Reason|Type(permanent/temporary)|Hours(if temporary)\nExample: 123456789|Spam|temporary|24');
            break;
            
        case 'admin_unblock_user':
            adminState[chatId] = { action: 'unblock_user' };
            await bot.sendMessage(chatId, '👥 Unblock User\n\nSend User ID to unblock:');
            break;
            
        case 'admin_broadcast':
            adminState[chatId] = { action: 'broadcast' };
            await bot.sendMessage(chatId, '📢 Broadcast Message\n\nSend the message to broadcast to all users:');
            break;
            
        case 'admin_personal_message':
            adminState[chatId] = { action: 'personal_message' };
            await bot.sendMessage(chatId, '✉️ Personal Message\n\nFormat: UserID|Message\nExample: 123456789|Hello, how can I help?');
            break;
            
        case 'admin_settings':
            await settingsMenu(bot, chatId);
            break;
            
        case 'toggle_bot':
            const currentStatus = await getSetting('bot_status');
            await updateSetting('bot_status', currentStatus === 'active' ? 'inactive' : 'active');
            await bot.sendMessage(chatId, `✅ Bot status changed to ${currentStatus === 'active' ? 'inactive' : 'active'}`);
            await settingsMenu(bot, chatId);
            break;
            
        case 'toggle_payment':
            const currentMethod = await getSetting('payment_method');
            await updateSetting('payment_method', currentMethod === 'manual' ? 'baratpay' : 'manual');
            await bot.sendMessage(chatId, `✅ Payment method changed to ${currentMethod === 'manual' ? 'baratpay' : 'manual'}`);
            await settingsMenu(bot, chatId);
            break;
            
        case 'toggle_captcha':
            const captchaEnabled = await getSetting('captcha_enabled');
            await updateSetting('captcha_enabled', captchaEnabled === 'true' ? 'false' : 'true');
            await bot.sendMessage(chatId, `✅ Captcha ${captchaEnabled === 'true' ? 'disabled' : 'enabled'}`);
            await settingsMenu(bot, chatId);
            break;
            
        case 'set_recovery':
            adminState[chatId] = { action: 'set_recovery' };
            await bot.sendMessage(chatId, '⏱ Set Recovery Hours\n\nEnter number of hours for recovery period:');
            break;
            
        // Handle voucher addition
        default:
            if (data.startsWith('add_voucher_')) {
                const categoryId = data.split('_')[2];
                adminState[chatId] = { action: 'add_voucher', categoryId };
                await bot.sendMessage(chatId, '➕ Add Vouchers\n\nSend voucher codes (one per line):');
            }
            
            // Handle order approval
            if (data.startsWith('approve_')) {
                const orderId = data.replace('approve_', '');
                await approveOrder(bot, chatId, orderId);
            }
            
            if (data.startsWith('reject_')) {
                const orderId = data.replace('reject_', '');
                await rejectOrder(bot, chatId, orderId);
            }
            
            // Handle recovery
            if (data.startsWith('recover_')) {
                const orderId = data.replace('recover_', '');
                adminState[chatId] = { action: 'recovery_code', orderId };
                await bot.sendMessage(chatId, '📝 Send new voucher code for recovery:');
            }
            
            if (data.startsWith('norecover_')) {
                const orderId = data.replace('norecover_', '');
                await noRecovery(bot, chatId, orderId);
            }
            
            // Handle reply to user
            if (data.startsWith('reply_')) {
                const targetUserId = data.split('_')[1];
                adminState[chatId] = { action: 'reply_to_user', targetUserId };
                await bot.sendMessage(chatId, '✏️ Enter your reply message:');
            }
            
            if (data === 'admin_back') {
                await adminCommand(bot, { chat: { id: chatId } });
            }
            break;
    }
}

async function approveOrder(bot, chatId, orderId) {
    const order = await getOrder(orderId);
    
    if (!order) return;
    
    // Get available vouchers
    const vouchers = await getAvailableVouchers(order.category);
    
    if (vouchers.length < parseInt(order.quantity)) {
        return bot.sendMessage(chatId, '❌ Not enough vouchers in stock!');
    }
    
    // Assign vouchers to order
    const assignedVouchers = [];
    for (let i = 0; i < parseInt(order.quantity); i++) {
        const voucher = vouchers[i];
        await assignVoucherToOrder(voucher.voucher_id, order.user_id, orderId);
        assignedVouchers.push(voucher.code);
    }
    
    // Update order status
    await updateOrderStatus(orderId, 'delivered', new Date().toISOString());
    
    // Send vouchers to user
    const voucherMessage = `✅ Order Delivered!
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}
Category: ${order.category}
Quantity: ${order.quantity}

Your vouchers:
${assignedVouchers.map((v, i) => `${i+1}. ${v}`).join('\n')}

Thank you for shopping with us! 🎉`;

    await bot.sendMessage(parseInt(order.user_id), voucherMessage);
    
    // Send notification to OrdersNotify channel
    await bot.sendMessage(process.env.CHANNEL_2,
        `🎯 𝗡𝗲𝘄 𝗢𝗿𝗱𝗲𝗿 𝗦𝘂𝗯𝗺𝗶𝘁𝘁𝗲𝗱
━━━━━━━━━━━━━━━━━━━━━

╰➤👤 𝗨𝗦𝗘𝗥 𝗡𝗔𝗠𝗘 : @${order.username || 'N/A'}
╰➤🆔 𝗨𝗦𝗘𝗥 𝗜𝗗 : ${order.user_id}
╰➤📡 𝗦𝗧𝗔𝗧𝗨𝗦: ✅ Success
╰➤ 🔰𝗤𝗨𝗔𝗟𝗜𝗧𝗬: High 📶
╰➤ 📦𝗧𝗢𝗧𝗔𝗟 𝗤𝗨𝗔𝗡𝗧𝗜𝗧𝗬 : ${order.quantity}
╰➤ 💳𝗖𝗢𝗦𝗧 : ₹${order.total_price}

🤖𝗕𝗢𝗧 𝗡𝗔𝗠𝗘 : @SheinVoucherHub_Bot
━━━━━━━━━━━━━━━━━━━━━`
    );
    
    await bot.sendMessage(chatId, '✅ Order approved and vouchers sent!');
}

async function rejectOrder(bot, chatId, orderId) {
    const order = await getOrder(orderId);
    
    if (!order) return;
    
    await updateOrderStatus(orderId, 'rejected');
    
    await bot.sendMessage(parseInt(order.user_id),
        `❌ Payment Rejected
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}

Your payment could not be verified.
Please contact support for assistance.

Reason: Invalid payment screenshot/UTR`
    );
    
    await bot.sendMessage(chatId, '✅ Order rejected and user notified!');
}

async function noRecovery(bot, chatId, orderId) {
    const order = await getOrder(orderId);
    
    if (!order) return;
    
    await bot.sendMessage(parseInt(order.user_id),
        `❌ Recovery Failed
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${orderId}

We cannot recover your vouchers at this time.
Reason: Out of stock / Technical issue

Please contact support for assistance.`
    );
    
    await bot.sendMessage(chatId, '✅ User notified about recovery failure!');
}

// Handle text messages for admin actions
async function handleAdminText(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = adminState[chatId];
    
    if (!state) return false;
    
    switch(state.action) {
        case 'add_category':
            const [name, price, stock] = text.split('|');
            await addCategory(name.trim(), price.trim(), stock.trim());
            await bot.sendMessage(chatId, '✅ Category added successfully!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'update_stock':
            const [catId, newStock] = text.split('|');
            await updateCategoryStock(catId.trim(), newStock.trim());
            await bot.sendMessage(chatId, '✅ Stock updated successfully!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'delete_category':
            // Implement delete category
            await bot.sendMessage(chatId, '✅ Category deleted!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'add_voucher':
            const codes = text.split('\n').map(c => c.trim()).filter(c => c);
            for (const code of codes) {
                await addVoucher(code, state.categoryId, '100'); // Price from category
            }
            await bot.sendMessage(chatId, `✅ ${codes.length} vouchers added!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'block_user':
            const [userId, reason, type, hours] = text.split('|');
            let expiry = null;
            if (type === 'temporary' && hours) {
                expiry = new Date();
                expiry.setHours(expiry.getHours() + parseInt(hours));
            }
            await blockUser(userId.trim(), reason.trim(), process.env.ADMIN_ID, type, expiry);
            await bot.sendMessage(chatId, `✅ User ${userId} blocked!`);
            
            // Notify user
            try {
                await bot.sendMessage(parseInt(userId), 
                    `⛔ You have been ${type === 'temporary' ? 'temporarily' : 'permanently'} blocked.
Reason: ${reason}
${type === 'temporary' ? `Duration: ${hours} hours` : ''}

Contact @SheinVoucherHub for appeal.`
                );
            } catch (e) {}
            
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'unblock_user':
            await unblockUser(text.trim());
            await bot.sendMessage(chatId, `✅ User ${text} unblocked!`);
            
            // Notify user
            try {
                await bot.sendMessage(parseInt(text), '✅ You have been unblocked. You can use the bot again.');
            } catch (e) {}
            
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'broadcast':
            // Implement broadcast
            await bot.sendMessage(chatId, '📢 Broadcast sent to all users!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'personal_message':
            const [targetUser, message] = text.split('|');
            await bot.sendMessage(parseInt(targetUser.trim()), message.trim());
            await bot.sendMessage(chatId, '✅ Message sent!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'set_recovery':
            await updateSetting('recovery_hours', text.trim());
            await bot.sendMessage(chatId, `✅ Recovery period set to ${text} hours!`);
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'recovery_code':
            const order = await getOrder(state.orderId);
            if (order) {
                await bot.sendMessage(parseInt(order.user_id),
                    `✅ Recovery Successful!
━━━━━━━━━━━━━━━━━━━━━

Order ID: ${state.orderId}

New Voucher Code: ${text}

If you face any issues, contact support.`
                );
                await bot.sendMessage(chatId, '✅ Recovery code sent to user!');
            }
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        case 'reply_to_user':
            await bot.sendMessage(parseInt(state.targetUserId),
                `📨 Admin Reply
━━━━━━━━━━━━━━━━━━━━━

${text}`
            );
            await bot.sendMessage(chatId, '✅ Reply sent to user!');
            delete adminState[chatId];
            await adminCommand(bot, msg);
            break;
            
        default:
            return false;
    }
    
    return true;
}

module.exports = { adminCommand, handleAdminCallback, handleAdminText };
