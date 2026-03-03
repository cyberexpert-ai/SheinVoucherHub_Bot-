const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');

const showSecurityMenu = async (bot, chatId) => {
    const pool = getPool();
    
    const stats = await pool.query(`
        SELECT 
            (SELECT COUNT(*) FROM utr_tracking WHERE used_at > NOW() - INTERVAL '24 hours') as utr_24h,
            (SELECT COUNT(*) FROM blocked_utrs) as blocked_utrs,
            (SELECT COUNT(*) FROM users WHERE is_blocked = true) as blocked_users,
            (SELECT COUNT(*) FROM users WHERE block_expires > NOW()) as temp_blocked,
            (SELECT COUNT(*) FROM fraud_alerts WHERE resolved = false) as open_alerts
    `);
    
    const message = `🔒 Security Management

📊 Current Status:
━━━━━━━━━━━━━━━━━━
UTRs (24h): ${stats.rows[0].utr_24h}
Blocked UTRs: ${stats.rows[0].blocked_utrs}
Blocked Users: ${stats.rows[0].blocked_users}
Temp Blocked: ${stats.rows[0].temp_blocked}
Open Alerts: ${stats.rows[0].open_alerts}

Options:`;

    const buttons = [
        [
            { text: '🚫 Blocked UTRs', callback_data: 'admin_listutr' },
            { text: '➕ Block UTR', callback_data: 'admin_blockutr' }
        ],
        [
            { text: '🚷 Blocked Users', callback_data: 'admin_listblocked' },
            { text: '🔍 Check UTR', callback_data: 'admin_checkutr' }
        ],
        [
            { text: '⚠️ Fraud Alerts', callback_data: 'admin_fraudalerts' },
            { text: '📊 Security Stats', callback_data: 'admin_secstats' }
        ],
        [{ text: '↩️ Back', callback_data: 'admin_back' }]
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: buttons }
    });
};

const blockUTR = async (bot, chatId, userId) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_blockutr' }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter UTR number to block:',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processBlockUTR = async (bot, chatId, userId, text) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO blocked_utrs (utr_number, reason, blocked_by)
         VALUES ($1, 'Admin block', $2)
         ON CONFLICT (utr_number) DO NOTHING`,
        [text, userId]
    );
    
    await bot.sendMessage(chatId, '✅ UTR blocked successfully!');
    
    // Clear session
    await pool.query(
        'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
        [userId]
    );
    
    // Show security menu
    await showSecurityMenu(bot, chatId);
};

module.exports = {
    showSecurityMenu,
    blockUTR,
    processBlockUTR
};
