const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/helpers');

const showCategoryMenu = async (bot, chatId) => {
    const pool = getPool();
    
    const categories = await pool.query(
        'SELECT * FROM categories ORDER BY category_id'
    );
    
    let message = '📊 *Category Management*\n\n';
    message += '*Current Categories:*\n\n';
    
    const buttons = [];
    
    categories.rows.forEach(cat => {
        message += `*ID:* ${cat.category_id}\n`;
        message += `*Name:* ${cat.name}\n`;
        message += `*Stock:* ${cat.stock}\n`;
        message += `*Prices:*\n`;
        message += `1: ${formatCurrency(cat.price_1)} | 2: ${formatCurrency(cat.price_2)} | 3: ${formatCurrency(cat.price_3)}\n`;
        message += `4: ${formatCurrency(cat.price_4)} | 5: ${formatCurrency(cat.price_5)} | Custom: ${formatCurrency(cat.price_custom)}\n`;
        message += '━━━━━━━━━━━━━━━━━━\n\n';
        
        buttons.push([
            { text: `✏️ Edit ${cat.name}`, callback_data: `admin_editcat_${cat.category_id}` }
        ]);
    });
    
    buttons.push([
        { text: '➕ Add New Category', callback_data: 'admin_addcat' },
        { text: '🗑 Delete Category', callback_data: 'admin_delcat' }
    ]);
    buttons.push([{ text: '↩️ Back to Admin Panel', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
    });
};

const addCategory = async (bot, chatId, userId) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_addcat_name' }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter category name (e.g., ₹500, ₹1000, ₹2000, ₹4000):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddCategory = async (bot, chatId, userId, text, session) => {
    const pool = getPool();
    
    // Store name and ask for stock
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_addcat_stock', name: text }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter initial stock quantity:',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddCategoryStock = async (bot, chatId, userId, text, session) => {
    const stock = parseInt(text);
    if (isNaN(stock) || stock < 0) {
        await bot.sendMessage(chatId, '❌ Invalid stock value. Please enter a number.');
        return;
    }
    
    const pool = getPool();
    
    // Ask for prices
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_addcat_price1', name: session.name, stock: stock }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter price for quantity 1 (in ₹):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddCategoryPrice1 = async (bot, chatId, userId, text, session) => {
    const price1 = parseFloat(text);
    if (isNaN(price1) || price1 < 0) {
        await bot.sendMessage(chatId, '❌ Invalid price. Please enter a number.');
        return;
    }
    
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { 
            action: 'admin_addcat_price2', 
            name: session.name, 
            stock: session.stock,
            price1: price1 
        }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter price for quantity 2 (in ₹):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddCategoryPrice2 = async (bot, chatId, userId, text, session) => {
    const price2 = parseFloat(text);
    if (isNaN(price2) || price2 < 0) {
        await bot.sendMessage(chatId, '❌ Invalid price. Please enter a number.');
        return;
    }
    
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { 
            action: 'admin_addcat_price3', 
            name: session.name, 
            stock: session.stock,
            price1: session.price1,
            price2: price2 
        }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter price for quantity 3 (in ₹):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddCategoryPrice3 = async (bot, chatId, userId, text, session) => {
    const price3 = parseFloat(text);
    if (isNaN(price3) || price3 < 0) {
        await bot.sendMessage(chatId, '❌ Invalid price. Please enter a number.');
        return;
    }
    
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { 
            action: 'admin_addcat_price4', 
            name: session.name, 
            stock: session.stock,
            price1: session.price1,
            price2: session.price2,
            price3: price3 
        }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter price for quantity 4 (in ₹):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddCategoryPrice4 = async (bot, chatId, userId, text, session) => {
    const price4 = parseFloat(text);
    if (isNaN(price4) || price4 < 0) {
        await bot.sendMessage(chatId, '❌ Invalid price. Please enter a number.');
        return;
    }
    
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { 
            action: 'admin_addcat_price5', 
            name: session.name, 
            stock: session.stock,
            price1: session.price1,
            price2: session.price2,
            price3: session.price3,
            price4: price4 
        }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter price for quantity 5 (in ₹):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddCategoryPrice5 = async (bot, chatId, userId, text, session) => {
    const price5 = parseFloat(text);
    if (isNaN(price5) || price5 < 0) {
        await bot.sendMessage(chatId, '❌ Invalid price. Please enter a number.');
        return;
    }
    
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { 
            action: 'admin_addcat_pricecustom', 
            name: session.name, 
            stock: session.stock,
            price1: session.price1,
            price2: session.price2,
            price3: session.price3,
            price4: session.price4,
            price5: price5 
        }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter price for custom quantity (per unit, in ₹):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddCategoryPriceCustom = async (bot, chatId, userId, text, session) => {
    const priceCustom = parseFloat(text);
    if (isNaN(priceCustom) || priceCustom < 0) {
        await bot.sendMessage(chatId, '❌ Invalid price. Please enter a number.');
        return;
    }
    
    const pool = getPool();
    
    // Insert category with all prices
    await pool.query(
        `INSERT INTO categories (name, stock, price_1, price_2, price_3, price_4, price_5, price_custom, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
        [session.name, session.stock, session.price1, session.price2, session.price3, session.price4, session.price5, priceCustom]
    );
    
    await bot.sendMessage(chatId, '✅ *Category added successfully!*', {
        parse_mode: 'Markdown'
    });
    
    // Clear session
    await pool.query(
        'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
        [userId]
    );
    
    // Show category menu again
    await showCategoryMenu(bot, chatId);
};

module.exports = {
    showCategoryMenu,
    addCategory,
    processAddCategory,
    processAddCategoryStock,
    processAddCategoryPrice1,
    processAddCategoryPrice2,
    processAddCategoryPrice3,
    processAddCategoryPrice4,
    processAddCategoryPrice5,
    processAddCategoryPriceCustom
};
