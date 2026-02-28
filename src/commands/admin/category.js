const db = require('../../database/database');

async function manageCategories(bot, chatId, userId) {
    const categories = await db.getCategories(false);
    
    let message = '📂 Category Management\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const cat of categories) {
        const stock = await db.getVoucherCount(cat.id, false);
        message += `ID: ${cat.id} | ${cat.name}\n`;
        message += `Status: ${cat.is_active ? '✅ Active' : '❌ Inactive'}\n`;
        message += `Stock: ${stock}\n`;
        message += `━━━━━━━━━━━━━━━━\n`;
    }
    
    const keyboard = [
        ['➕ Add Category', '✏️ Edit Category'],
        ['❌ Delete Category', '🔄 Toggle Status'],
        ['↩️ Back to Admin']
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    });
}

async function addCategory(bot, chatId, userId) {
    const msg = await bot.sendMessage(chatId,
        `➕ Add New Category\n\n` +
        `Send details in format:\n` +
        `Name|Value|Display Name\n` +
        `Example: ₹500|500|₹500 Shein Voucher`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'admin_add_category',
        messageId: msg.message_id
    };
}

async function processAddCategory(bot, chatId, userId, text) {
    const parts = text.split('|').map(p => p.trim());
    
    if (parts.length < 3) {
        await bot.sendMessage(chatId, '❌ Invalid format. Use: Name|Value|Display Name');
        return;
    }
    
    const [name, value, displayName] = parts;
    
    if (isNaN(value)) {
        await bot.sendMessage(chatId, '❌ Value must be a number.');
        return;
    }
    
    const categoryId = await db.addCategory(name, parseFloat(value), displayName);
    
    // Add default price tiers
    const basePrice = parseFloat(value) === 500 ? 49 :
                      parseFloat(value) === 1000 ? 99 :
                      parseFloat(value) === 2000 ? 199 : 299;
    
    for (let i = 1; i <= 100; i++) {
        let price = basePrice * i;
        if (i > 80) price = Math.round(price * 0.98);
        else if (i > 50) price = Math.round(price * 0.99);
        await db.updatePriceTier(categoryId, i, price);
    }
    
    await bot.sendMessage(chatId, `✅ Category added successfully! ID: ${categoryId}`);
}

async function deleteCategory(bot, chatId, userId) {
    const categories = await db.getCategories(false);
    
    let message = '❌ Delete Category\n\nSelect category to delete:\n';
    const buttons = [];
    
    for (const cat of categories) {
        buttons.push([{
            text: `${cat.name} (ID: ${cat.id})`,
            callback_data: `admin_delcat_${cat.id}`
        }]);
    }
    buttons.push([{ text: '↩️ Cancel', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

async function processDeleteCategory(bot, chatId, userId, categoryId) {
    // Check if category has orders
    const orders = await db.query('SELECT COUNT(*) as count FROM orders WHERE category_id = ?', [categoryId]);
    
    if (orders[0].count > 0) {
        // Soft delete - just deactivate
        await db.updateCategory(categoryId, { is_active: false });
        await bot.sendMessage(chatId, `⚠️ Category has orders. It has been deactivated instead of deleted.`);
    } else {
        // Hard delete
        await db.deleteCategory(categoryId);
        await bot.sendMessage(chatId, `✅ Category deleted successfully.`);
    }
}

module.exports = {
    manageCategories,
    addCategory,
    processAddCategory,
    deleteCategory,
    processDeleteCategory
};
