const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/helpers');

const showCategoryMenu = async (bot, chatId) => {
    const pool = getPool();
    
    const categories = await pool.query(
        'SELECT * FROM categories ORDER BY category_id'
    );
    
    let message = '📊 Category Management\n\n';
    message += 'Current Categories:\n\n';
    
    const buttons = [];
    
    categories.rows.forEach(cat => {
        message += `ID: ${cat.category_id}\n`;
        message += `Name: ${cat.name}\n`;
        message += `Stock: ${cat.stock}\n`;
        message += `Prices: 1:${formatCurrency(cat.price_1)} | 2:${formatCurrency(cat.price_2)} | 3:${formatCurrency(cat.price_3)}\n`;
        message += `4:${formatCurrency(cat.price_4)} | 5:${formatCurrency(cat.price_5)} | Custom:${formatCurrency(cat.price_custom)}\n`;
        message += '━━━━━━━━━━━━━━━━━━\n';
        
        buttons.push([
            { text: `✏️ Edit ${cat.name}`, callback_data: `admin_editcat_${cat.category_id}` }
        ]);
    });
    
    buttons.push([
        { text: '➕ Add Category', callback_data: 'admin_addcat' },
        { text: '🗑 Delete Category', callback_data: 'admin_delcat' }
    ]);
    buttons.push([{ text: '↩️ Back', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, message, {
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
        'Enter category name (e.g., ₹500):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddCategory = async (bot, chatId, userId, text) => {
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
    
    // Insert category with default prices
    await pool.query(
        `INSERT INTO categories (name, stock, price_1, price_2, price_3, price_4, price_5, price_custom)
         VALUES ($1, $2, 0, 0, 0, 0, 0, 0)`,
        [session.name, stock]
    );
    
    await bot.sendMessage(chatId, '✅ Category added successfully!');
    
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
    processAddCategoryStock
};
