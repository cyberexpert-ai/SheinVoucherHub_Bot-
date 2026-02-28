const db = require('../../database/database');

async function managePrices(bot, chatId, userId) {
    const categories = await db.getCategories(true);
    
    let message = '💰 Price Management\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const cat of categories) {
        const prices = await db.query(
            'SELECT quantity, price FROM price_tiers WHERE category_id = ? ORDER BY quantity LIMIT 5',
            [cat.id]
        );
        
        message += `${cat.name} prices:\n`;
        for (const p of prices) {
            message += `  ${p.quantity} code(s): ₹${p.price}\n`;
        }
        message += '\n';
    }
    
    const keyboard = [
        ['✏️ Edit Prices', '📊 Bulk Update'],
        ['↩️ Back to Admin']
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    });
}

async function editPrices(bot, chatId, userId) {
    const categories = await db.getCategories(true);
    
    let message = '✏️ Edit Prices\n\nSelect category:\n';
    const buttons = [];
    
    for (const cat of categories) {
        buttons.push([{
            text: cat.name,
            callback_data: `admin_editprice_${cat.id}`
        }]);
    }
    buttons.push([{ text: '↩️ Cancel', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

async function showPriceEditor(bot, chatId, userId, categoryId) {
    const category = await db.getCategory(categoryId);
    const prices = await db.query(
        'SELECT quantity, price FROM price_tiers WHERE category_id = ? ORDER BY quantity',
        [categoryId]
    );
    
    let message = `✏️ Editing ${category.name} Prices\n\n`;
    message += `Current prices:\n`;
    for (const p of prices) {
        message += `  ${p.quantity}: ₹${p.price}\n`;
    }
    message += `\nSend new prices in format:\n`;
    message += `quantity1:price1,quantity2:price2\n`;
    message += `Example: 1:49,5:249,10:498\n\n`;
    message += `Or send "auto" to generate automatically.`;
    
    const msg = await bot.sendMessage(chatId, message, {
        reply_markup: {
            force_reply: true,
            selective: true
        }
    });
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'admin_update_prices',
        categoryId: categoryId,
        messageId: msg.message_id
    };
}

async function updatePrices(bot, chatId, userId, categoryId, text) {
    const category = await db.getCategory(categoryId);
    
    if (text.toLowerCase() === 'auto') {
        // Generate automatic prices
        const basePrice = category.value === 500 ? 49 :
                         category.value === 1000 ? 99 :
                         category.value === 2000 ? 199 : 299;
        
        for (let i = 1; i <= 100; i++) {
            let price = basePrice * i;
            if (i > 80) price = Math.round(price * 0.98);
            else if (i > 50) price = Math.round(price * 0.99);
            await db.updatePriceTier(categoryId, i, price);
        }
        
        await bot.sendMessage(chatId, `✅ Auto-generated prices for ${category.name}`);
        return;
    }
    
    // Parse custom prices
    const pairs = text.split(',').map(p => p.trim());
    let updated = 0;
    
    for (const pair of pairs) {
        const [qtyStr, priceStr] = pair.split(':').map(s => s.trim());
        const quantity = parseInt(qtyStr);
        const price = parseFloat(priceStr);
        
        if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
            await db.updatePriceTier(categoryId, quantity, price);
            updated++;
        }
    }
    
    await bot.sendMessage(chatId, `✅ Updated ${updated} price tiers for ${category.name}`);
}

async function bulkUpdatePrices(bot, chatId, userId) {
    const msg = await bot.sendMessage(chatId,
        `📊 Bulk Price Update\n\n` +
        `Send prices for all categories in format:\n` +
        `CategoryID:Qty:Price\n` +
        `One per line\n\n` +
        `Example:\n` +
        `1:1:49\n` +
        `1:5:249\n` +
        `2:1:99\n`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'admin_bulk_prices',
        messageId: msg.message_id
    };
}

async function processBulkPrices(bot, chatId, userId, text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let updated = 0;
    
    for (const line of lines) {
        const [catIdStr, qtyStr, priceStr] = line.split(':').map(s => s.trim());
        const catId = parseInt(catIdStr);
        const quantity = parseInt(qtyStr);
        const price = parseFloat(priceStr);
        
        if (!isNaN(catId) && !isNaN(quantity) && !isNaN(price)) {
            const category = await db.getCategory(catId);
            if (category) {
                await db.updatePriceTier(catId, quantity, price);
                updated++;
            }
        }
    }
    
    await bot.sendMessage(chatId, `✅ Updated ${updated} price tiers.`);
}

module.exports = {
    managePrices,
    editPrices,
    showPriceEditor,
    updatePrices,
    bulkUpdatePrices,
    processBulkPrices
};
