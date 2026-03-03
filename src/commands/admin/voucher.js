const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { chunkArray } = require('../../utils/helpers');

const showVoucherMenu = async (bot, chatId) => {
    const pool = getPool();
    
    const categories = await pool.query(
        'SELECT category_id, name, stock FROM categories ORDER BY category_id'
    );
    
    let message = '🎟 Voucher Management\n\n';
    message += 'Select category to manage vouchers:\n\n';
    
    const buttons = [];
    
    categories.rows.forEach(cat => {
        message += `• ${cat.name} (Stock: ${cat.stock})\n`;
        buttons.push([
            { text: cat.name, callback_data: `admin_vcat_${cat.category_id}` }
        ]);
    });
    
    buttons.push([{ text: '↩️ Back', callback_data: 'admin_back' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: buttons }
    });
};

const showCategoryVouchers = async (bot, chatId, categoryId) => {
    const pool = getPool();
    
    const category = await pool.query(
        'SELECT * FROM categories WHERE category_id = $1',
        [categoryId]
    );
    
    if (category.rows.length === 0) {
        await bot.sendMessage(chatId, '❌ Category not found.');
        return;
    }
    
    const cat = category.rows[0];
    
    const voucherCount = await pool.query(
        'SELECT COUNT(*) as total, SUM(CASE WHEN is_sold THEN 1 ELSE 0 END) as sold FROM vouchers WHERE category_id = $1',
        [categoryId]
    );
    
    const counts = voucherCount.rows[0];
    
    const message = `🎟 ${cat.name} Vouchers

Total Vouchers: ${counts.total || 0}
Sold: ${counts.sold || 0}
Available: ${cat.stock}

Options:`;

    const buttons = [
        [
            { text: '➕ Add Single', callback_data: `admin_addone_${categoryId}` },
            { text: '📦 Add Bulk', callback_data: `admin_addbulk_${categoryId}` }
        ],
        [
            { text: '📋 List Vouchers', callback_data: `admin_list_${categoryId}` },
            { text: '🗑 Delete All', callback_data: `admin_delall_${categoryId}` }
        ],
        [{ text: '↩️ Back', callback_data: 'admin_voucher' }]
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: buttons }
    });
};

const addSingleVoucher = async (bot, chatId, userId, categoryId) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_addsingle', categoryId }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter voucher code:',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddSingleVoucher = async (bot, chatId, userId, text, session) => {
    const pool = getPool();
    
    // Check if code already exists
    const existing = await pool.query(
        'SELECT * FROM vouchers WHERE code = $1',
        [text]
    );
    
    if (existing.rows.length > 0) {
        await bot.sendMessage(chatId, '❌ This voucher code already exists!');
        return;
    }
    
    // Add voucher
    await pool.query(
        `INSERT INTO vouchers (category_id, code, is_sold)
         VALUES ($1, $2, false)`,
        [session.categoryId, text]
    );
    
    // Update stock
    await pool.query(
        `UPDATE categories 
         SET stock = stock + 1 
         WHERE category_id = $1`,
        [session.categoryId]
    );
    
    await bot.sendMessage(chatId, '✅ Voucher added successfully!');
    
    // Clear session
    await pool.query(
        'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
        [userId]
    );
    
    // Show category vouchers again
    await showCategoryVouchers(bot, chatId, session.categoryId);
};

const addBulkVouchers = async (bot, chatId, userId, categoryId) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_addbulk', categoryId }]
    );
    
    await bot.sendMessage(
        chatId,
        'Send voucher codes (one per line):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processAddBulkVouchers = async (bot, chatId, userId, text, session) => {
    const codes = text.split('\n').map(c => c.trim()).filter(c => c.length > 0);
    
    if (codes.length === 0) {
        await bot.sendMessage(chatId, '❌ No valid codes found.');
        return;
    }
    
    const pool = getPool();
    
    // Insert codes
    let added = 0;
    for (const code of codes) {
        try {
            await pool.query(
                `INSERT INTO vouchers (category_id, code, is_sold)
                 VALUES ($1, $2, false)`,
                [session.categoryId, code]
            );
            added++;
        } catch (error) {
            // Code might be duplicate
            logger.error('Error adding bulk voucher:', error);
        }
    }
    
    // Update stock
    await pool.query(
        `UPDATE categories 
         SET stock = stock + $1 
         WHERE category_id = $2`,
        [added, session.categoryId]
    );
    
    await bot.sendMessage(
        chatId,
        `✅ Added ${added} out of ${codes.length} vouchers successfully!`
    );
    
    // Clear session
    await pool.query(
        'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
        [userId]
    );
    
    // Show category vouchers again
    await showCategoryVouchers(bot, chatId, session.categoryId);
};

module.exports = {
    showVoucherMenu,
    showCategoryVouchers,
    addSingleVoucher,
    processAddSingleVoucher,
    addBulkVouchers,
    processAddBulkVouchers
};
