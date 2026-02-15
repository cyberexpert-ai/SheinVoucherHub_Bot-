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
