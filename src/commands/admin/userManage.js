const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/helpers');

const showUserMenu = async (bot, chatId) => {
    const pool = getPool();
    
    const stats = await pool.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_blocked THEN 1 ELSE 0 END) as blocked,
            SUM(CASE WHEN last_active > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as active_today
        FROM users
    `);
    
    const message = `👥 User Management

Total Users: ${stats.rows[0].total}
Blocked: ${stats.rows[0].blocked}
Active Today: ${stats.rows[0].active_today}

Options:`;

    const buttons = [
        [
            { text: '🔍 Find User', callback_data: 'admin_finduser' },
            { text: '📋 List Users', callback_data: 'admin_listusers' }
        ],
        [
            { text: '🚫 Block User', callback_data: 'admin_blockuser' },
            { text: '✅ Unblock User', callback_data: 'admin_unblockuser' }
        ],
        [
            { text: '⏳ Temp Restrict', callback_data: 'admin_temprestrict' },
            { text: '📊 User Stats', callback_data: 'admin_userstats' }
        ],
        [{ text: '↩️ Back', callback_data: 'admin_back' }]
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: buttons }
    });
};

const findUser = async (bot, chatId, userId) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_finduser' }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter User ID or Username (without @):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processFindUser = async (bot, chatId, userId, text) => {
    const pool = getPool();
    
    let user;
    if (text.startsWith('@')) {
        user = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [text.substring(1)]
        );
    } else {
        user = await pool.query(
            'SELECT * FROM users WHERE user_id = $1',
            [text]
        );
    }
    
    if (user.rows.length === 0) {
        await bot.sendMessage(chatId, '❌ User not found.');
        return;
    }
    
    const u = user.rows[0];
    
    // Get user orders
    const orders = await pool.query(
        `SELECT COUNT(*) as total, 
                SUM(CASE WHEN status = 'successful' THEN 1 ELSE 0 END) as successful,
                COALESCE(SUM(CASE WHEN status = 'successful' THEN total_price ELSE 0 END), 0) as spent
         FROM orders WHERE user_id = $1`,
        [u.user_id]
    );
    
    const orderStats = orders.rows[0];
    
    const userInfo = `👤 User Details

ID: ${u.user_id}
Username: @${u.username || 'N/A'}
Name: ${u.first_name || ''} ${u.last_name || ''}
Joined: ${u.joined_at}
Last Active: ${u.last_active}
Status: ${u.is_blocked ? '🚫 Blocked' : '✅ Active'}
Block Reason: ${u.block_reason || 'N/A'}

📊 Statistics
Total Orders: ${orderStats.total || 0}
Successful: ${orderStats.successful || 0}
Total Spent: ${formatCurrency(orderStats.spent || 0)}

Actions:`;

    const buttons = [
        [
            { text: '✉️ Message', callback_data: `admin_msguser_${u.user_id}` },
            { text: u.is_blocked ? '✅ Unblock' : '🚫 Block', callback_data: `admin_toggleblock_${u.user_id}` }
        ],
        [
            { text: '📦 View Orders', callback_data: `admin_userorders_${u.user_id}` },
            { text: '🗑 Reset', callback_data: `admin_resetuser_${u.user_id}` }
        ],
        [{ text: '↩️ Back', callback_data: 'admin_users' }]
    ];
    
    await bot.sendMessage(chatId, userInfo, {
        reply_markup: { inline_keyboard: buttons }
    });
    
    // Clear session
    await pool.query(
        'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
        [userId]
    );
};

const blockUser = async (bot, chatId, userId, targetId) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_block_reason', targetId }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter block reason:',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processBlockUser = async (bot, chatId, userId, text, session) => {
    const pool = getPool();
    
    await pool.query(
        `UPDATE users 
         SET is_blocked = true, block_reason = $2, block_expires = NULL
         WHERE user_id = $1`,
        [session.targetId, text]
    );
    
    await bot.sendMessage(chatId, '✅ User blocked successfully!');
    
    // Notify user
    try {
        await bot.sendMessage(
            session.targetId,
            `🚫 You have been blocked.\n\nReason: ${text}`
        );
    } catch (error) {
        logger.error('Error notifying blocked user:', error);
    }
    
    // Clear session
    await pool.query(
        'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
        [userId]
    );
    
    // Show user menu
    await showUserMenu(bot, chatId);
};

const unblockUser = async (bot, chatId, targetId) => {
    const pool = getPool();
    
    await pool.query(
        `UPDATE users 
         SET is_blocked = false, block_reason = NULL, block_expires = NULL
         WHERE user_id = $1`,
        [targetId]
    );
    
    await bot.sendMessage(chatId, '✅ User unblocked successfully!');
    
    // Notify user
    try {
        await bot.sendMessage(
            targetId,
            '✅ You have been unblocked. You can now use the bot again.'
        );
    } catch (error) {
        logger.error('Error notifying unblocked user:', error);
    }
};

const tempRestrict = async (bot, chatId, userId) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_temprest_user' }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter User ID to restrict:',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processTempRestrictUser = async (bot, chatId, userId, text, session) => {
    const targetId = parseInt(text);
    if (isNaN(targetId)) {
        await bot.sendMessage(chatId, '❌ Invalid User ID.');
        return;
    }
    
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_temprest_time', targetId }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter restriction duration in minutes:',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processTempRestrictTime = async (bot, chatId, userId, text, session) => {
    const minutes = parseInt(text);
    if (isNaN(minutes) || minutes <= 0) {
        await bot.sendMessage(chatId, '❌ Invalid duration.');
        return;
    }
    
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_temprest_reason', targetId: session.targetId, minutes }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter restriction reason:',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processTempRestrictReason = async (bot, chatId, userId, text, session) => {
    const pool = getPool();
    
    await pool.query(
        `UPDATE users 
         SET is_blocked = true, block_reason = $2, 
             block_expires = NOW() + ($3::text || ' minutes')::interval
         WHERE user_id = $1`,
        [session.targetId, text, session.minutes]
    );
    
    await bot.sendMessage(
        chatId,
        `✅ User restricted for ${session.minutes} minutes!`
    );
    
    // Notify user
    try {
        await bot.sendMessage(
            session.targetId,
            `⏳ You have been temporarily restricted for ${session.minutes} minutes.\n\nReason: ${text}`
        );
    } catch (error) {
        logger.error('Error notifying restricted user:', error);
    }
    
    // Clear session
    await pool.query(
        'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
        [userId]
    );
    
    // Show user menu
    await showUserMenu(bot, chatId);
};

module.exports = {
    showUserMenu,
    findUser,
    processFindUser,
    blockUser,
    processBlockUser,
    unblockUser,
    tempRestrict,
    processTempRestrictUser,
    processTempRestrictTime,
    processTempRestrictReason
};
