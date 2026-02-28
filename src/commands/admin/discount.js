const db = require('../../database/database');
const helpers = require('../../utils/helpers');

async function discountMenu(bot, chatId, userId) {
    const message = `🏷 Discount Management\n\n` +
                    `Create and manage discount codes\n` +
                    `━━━━━━━━━━━━━━━━\n\n` +
                    `Select option:`;
    
    const keyboard = [
        ['➕ Create Discount', '📋 List Discounts'],
        ['✏️ Edit Discount', '❌ Delete Discount'],
        ['↩️ Back to Admin']
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    });
}

async function createDiscount(bot, chatId, userId) {
    const categories = await db.getCategories(true);
    
    let catList = '';
    for (const cat of categories) {
        catList += `• ${cat.id}: ${cat.name}\n`;
    }
    
    const msg = await bot.sendMessage(chatId,
        `➕ Create Discount Code\n\n` +
        `Send details in format:\n` +
        `CODE|TYPE|VALUE|CATEGORY_ID|MIN_QTY|MAX_USES|EXPIRY_DAYS\n\n` +
        `TYPE: percentage or fixed\n` +
        `CATEGORY_ID: 0 for all categories\n` +
        `EXPIRY_DAYS: number of days until expiry\n\n` +
        `Available categories:\n${catList}\n` +
        `Example: SAVE10|percentage|10|0|1|100|30`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'admin_create_discount',
        messageId: msg.message_id
    };
}

async function processCreateDiscount(bot, chatId, adminId, text) {
    const parts = text.split('|').map(p => p.trim());
    
    if (parts.length < 7) {
        await bot.sendMessage(chatId, '❌ Invalid format. Need 7 parts.');
        return;
    }
    
    const [code, type, value, catId, minQty, maxUses, expiryDays] = parts;
    
    if (type !== 'percentage' && type !== 'fixed') {
        await bot.sendMessage(chatId, '❌ Type must be "percentage" or "fixed".');
        return;
    }
    
    if (isNaN(value) || isNaN(catId) || isNaN(minQty) || isNaN(maxUses) || isNaN(expiryDays)) {
        await bot.sendMessage(chatId, '❌ All numeric fields must be numbers.');
        return;
    }
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));
    
    await db.query(
        `INSERT INTO discount_codes 
         (code, discount_type, discount_value, category_id, min_quantity, max_uses, expires_at, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [code.toUpperCase(), type, parseFloat(value), 
         parseInt(catId) || null, parseInt(minQty), 
         parseInt(maxUses), expiresAt, adminId]
    );
    
    await bot.sendMessage(chatId, `✅ Discount code ${code.toUpperCase()} created!`);
}

async function listDiscounts(bot, chatId) {
    const discounts = await db.query(
        `SELECT d.*, c.name as category_name 
         FROM discount_codes d 
         LEFT JOIN categories c ON d.category_id = c.id 
         ORDER BY d.created_at DESC 
         LIMIT 20`
    );
    
    if (!discounts.length) {
        await bot.sendMessage(chatId, 'No discount codes found.');
        return;
    }
    
    let message = '🏷 Active Discount Codes\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const d of discounts) {
        const status = d.is_active ? '✅ Active' : '❌ Inactive';
        const category = d.category_name || 'All Categories';
        const expiry = helpers.formatDate(d.expires_at);
        
        message += `Code: ${d.code}\n`;
        message += `Type: ${d.discount_type} - ${d.discount_value}${d.discount_type === 'percentage' ? '%' : '₹'}\n`;
        message += `Category: ${category}\n`;
        message += `Min Qty: ${d.min_quantity}\n`;
        message += `Uses: ${d.used_count}/${d.max_uses}\n`;
        message += `Expires: ${expiry}\n`;
        message += `Status: ${status}\n`;
        message += `━━━━━━━━━━━━━━━━\n\n`;
    }
    
    await bot.sendMessage(chatId, message);
}

async function deleteDiscount(bot, chatId, userId) {
    const discounts = await db.query(
        'SELECT id, code FROM discount_codes WHERE is_active = TRUE'
    );
    
    if (!discounts.length) {
        await bot.sendMessage(chatId, 'No active discount codes.');
        return;
    }
    
    let message = '❌ Delete Discount Code\n\nSelect code to delete:\n';
    const buttons = [];
    
    for (const d of discounts) {
        buttons.push([{
            text: d.code,
            callback_data: `admin_deldiscount_${d.id}`
        }]);
    }
    buttons.push([{ text: '↩️ Cancel', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

module.exports = {
    discountMenu,
    createDiscount,
    processCreateDiscount,
    listDiscounts,
    deleteDiscount
};
