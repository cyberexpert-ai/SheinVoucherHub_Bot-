const db = require('../../database/database');
const helpers = require('../../utils/helpers');

async function manageVouchers(bot, chatId, userId) {
    const categories = await db.getCategories(true);
    
    let message = '🎟 Voucher Management\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const cat of categories) {
        const total = await db.getVoucherCount(cat.id, false) + await db.getVoucherCount(cat.id, true);
        const available = await db.getVoucherCount(cat.id, false);
        message += `${cat.name}: ${available}/${total} available\n`;
    }
    
    const keyboard = [
        ['➕ Add Single', '📦 Add Bulk'],
        ['📋 View Codes', '❌ Delete Codes'],
        ['↩️ Back to Admin']
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    });
}

async function addSingleVoucher(bot, chatId, userId) {
    const categories = await db.getCategories(true);
    
    let message = '➕ Add Single Voucher\n\nSelect category:\n';
    const buttons = [];
    
    for (const cat of categories) {
        buttons.push([{
            text: cat.name,
            callback_data: `admin_addsingle_${cat.id}`
        }]);
    }
    buttons.push([{ text: '↩️ Cancel', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

async function addBulkVouchers(bot, chatId, userId) {
    const categories = await db.getCategories(true);
    
    let message = '📦 Add Bulk Vouchers\n\nSelect category:\n';
    const buttons = [];
    
    for (const cat of categories) {
        buttons.push([{
            text: cat.name,
            callback_data: `admin_addbulk_${cat.id}`
        }]);
    }
    buttons.push([{ text: '↩️ Cancel', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

async function processBulkVouchers(bot, chatId, userId, categoryId, text) {
    // Split by new line or comma
    const codes = text.split('\n').flatMap(line => line.split(',')).map(c => c.trim()).filter(c => c.length > 0);
    
    if (codes.length === 0) {
        await bot.sendMessage(chatId, '❌ No valid codes found.');
        return;
    }
    
    if (codes.length > 1000) {
        await bot.sendMessage(chatId, '❌ Maximum 1000 codes at once.');
        return;
    }
    
    await db.addBulkVouchers(categoryId, codes, userId);
    
    await bot.sendMessage(chatId, `✅ Added ${codes.length} vouchers successfully.`);
}

async function viewVouchers(bot, chatId, userId) {
    const categories = await db.getCategories(true);
    
    let message = '📋 View Vouchers\n\nSelect category:\n';
    const buttons = [];
    
    for (const cat of categories) {
        const available = await db.getVoucherCount(cat.id, false);
        buttons.push([{
            text: `${cat.name} (${available} available)`,
            callback_data: `admin_viewcodes_${cat.id}`
        }]);
    }
    buttons.push([{ text: '↩️ Cancel', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

async function showVoucherList(bot, chatId, userId, categoryId, page = 0) {
    const pageSize = 20;
    const offset = page * pageSize;
    
    const vouchers = await db.query(
        'SELECT code, is_used, used_by, used_at FROM vouchers WHERE category_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
        [categoryId, pageSize, offset]
    );
    
    const category = await db.getCategory(categoryId);
    const total = await db.getVoucherCount(categoryId, false) + await db.getVoucherCount(categoryId, true);
    
    let message = `📋 ${category.name} Vouchers\n`;
    message += `Total: ${total}\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    
    for (const v of vouchers) {
        const status = v.is_used ? '❌ Used' : '✅ Available';
        message += `${v.code} - ${status}\n`;
        if (v.is_used) {
            message += `  Used by: ${v.used_by}\n`;
        }
        message += '\n';
    }
    
    const buttons = [];
    if (page > 0) {
        buttons.push([{ text: '◀️ Previous', callback_data: `admin_viewcodes_${categoryId}_${page-1}` }]);
    }
    if (vouchers.length === pageSize) {
        buttons.push([{ text: 'Next ▶️', callback_data: `admin_viewcodes_${categoryId}_${page+1}` }]);
    }
    buttons.push([{ text: '↩️ Back', callback_data: 'admin_back_vouchers' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

module.exports = {
    manageVouchers,
    addSingleVoucher,
    addBulkVouchers,
    processBulkVouchers,
    viewVouchers,
    showVoucherList
};
