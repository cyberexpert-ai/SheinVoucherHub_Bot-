const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/helpers');

const showDiscountMenu = async (bot, chatId) => {
    const pool = getPool();
    
    const discounts = await pool.query(`
        SELECT * FROM discount_codes 
        WHERE is_active = true 
        ORDER BY created_at DESC 
        LIMIT 10
    `);
    
    let message = '🏷 Discount Code Management\n\n';
    message += 'Active Discount Codes:\n\n';
    
    if (discounts.rows.length === 0) {
        message += 'No active discount codes.\n';
    } else {
        discounts.rows.forEach(d => {
            message += `Code: ${d.code}\n`;
            message += `Type: ${d.discount_type} - ${d.discount_value}${d.discount_type === 'percentage' ? '%' : '₹'}\n`;
            message += `Min Purchase: ${formatCurrency(d.min_purchase)}\n`;
            message += `Used: ${d.used_count}/${d.usage_limit || '∞'}\n`;
            message += `Valid: ${new Date(d.valid_from).toLocaleDateString()} - ${d.valid_until ? new Date(d.valid_until).toLocaleDateString() : 'Never'}\n`;
            message += '━━━━━━━━━━━━━━━━━━\n';
        });
    }
    
    const buttons = [
        [
            { text: '➕ Create Discount', callback_data: 'admin_discount_create' },
            { text: '✏️ Edit Discount', callback_data: 'admin_discount_edit' }
        ],
        [
            { text: '🗑 Delete Discount', callback_data: 'admin_discount_delete' },
            { text: '📊 Usage Stats', callback_data: 'admin_discount_stats' }
        ],
        [{ text: '↩️ Back', callback_data: 'admin_back' }]
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: buttons }
    });
};

const createDiscount = async (bot, chatId, userId) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_discount_code' }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter discount code:',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processDiscountCode = async (bot, chatId, userId, text, session) => {
    const pool = getPool();
    
    // Check if code exists
    const existing = await pool.query(
        'SELECT * FROM discount_codes WHERE code = $1',
        [text.toUpperCase()]
    );
    
    if (existing.rows.length > 0) {
        await bot.sendMessage(chatId, '❌ This discount code already exists!');
        return;
    }
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_discount_type', code: text.toUpperCase() }]
    );
    
    const buttons = {
        inline_keyboard: [
            [
                { text: 'Percentage (%)', callback_data: 'admin_discount_type_percentage' },
                { text: 'Fixed (₹)', callback_data: 'admin_discount_type_fixed' }
            ]
        ]
    };
    
    await bot.sendMessage(
        chatId,
        'Select discount type:',
        {
            reply_markup: buttons
        }
    );
};

module.exports = {
    showDiscountMenu,
    createDiscount,
    processDiscountCode
};
