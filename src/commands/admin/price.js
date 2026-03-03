const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/helpers');

const showPriceMenu = async (bot, chatId) => {
    const pool = getPool();
    
    const categories = await pool.query(
        'SELECT * FROM categories ORDER BY category_id'
    );
    
    let message = '💰 Price Management\n\n';
    message += 'Current Category Prices:\n\n';
    
    const buttons = [];
    
    categories.rows.forEach(cat => {
        message += `${cat.name}:\n`;
        message += `1 Qty: ${formatCurrency(cat.price_1)}\n`;
        message += `2 Qty: ${formatCurrency(cat.price_2)}\n`;
        message += `3 Qty: ${formatCurrency(cat.price_3)}\n`;
        message += `4 Qty: ${formatCurrency(cat.price_4)}\n`;
        message += `5 Qty: ${formatCurrency(cat.price_5)}\n`;
        message += `Custom: ${formatCurrency(cat.price_custom)}/each\n`;
        message += '━━━━━━━━━━━━━━━━━━\n';
        
        buttons.push([
            { text: `✏️ Edit ${cat.name}`, callback_data: `admin_editprice_${cat.category_id}` }
        ]);
    });
    
    buttons.push([
        { text: '📊 Bulk Update', callback_data: 'admin_bulkprice' },
        { text: '↩️ Back', callback_data: 'admin_back' }
    ]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: buttons }
    });
};

const editCategoryPrice = async (bot, chatId, userId, categoryId) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_editprice_qty', categoryId }]
    );
    
    const buttons = {
        inline_keyboard: [
            [
                { text: 'Price for 1', callback_data: 'admin_price_qty_1' },
                { text: 'Price for 2', callback_data: 'admin_price_qty_2' },
                { text: 'Price for 3', callback_data: 'admin_price_qty_3' }
            ],
            [
                { text: 'Price for 4', callback_data: 'admin_price_qty_4' },
                { text: 'Price for 5', callback_data: 'admin_price_qty_5' },
                { text: 'Custom Price', callback_data: 'admin_price_qty_custom' }
            ]
        ]
    };
    
    await bot.sendMessage(
        chatId,
        'Select quantity tier to edit:',
        {
            reply_markup: buttons
        }
    );
};

module.exports = {
    showPriceMenu,
    editCategoryPrice
};
