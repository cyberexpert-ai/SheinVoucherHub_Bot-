const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { sleep } = require('../../utils/helpers');

const showBroadcastMenu = async (bot, chatId) => {
    const message = `📢 Broadcast Management

Send messages to all users or specific groups.

Options:`;

    const buttons = [
        [
            { text: '📢 Send to All', callback_data: 'admin_broadcast_all' },
            { text: '🎯 Send to Active', callback_data: 'admin_broadcast_active' }
        ],
        [
            { text: '📊 Previous Broadcasts', callback_data: 'admin_broadcast_list' },
            { text: '🗑 Delete Broadcast', callback_data: 'admin_broadcast_delete' }
        ],
        [{ text: '↩️ Back', callback_data: 'admin_back' }]
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: buttons }
    });
};

const startBroadcast = async (bot, chatId, userId, target) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_broadcast_msg', target }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter broadcast message (can include HTML formatting):',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processBroadcastMessage = async (bot, chatId, userId, text, session) => {
    const pool = getPool();
    
    // Store message and ask for confirmation
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_broadcast_confirm', target: session.target, message: text }]
    );
    
    const preview = `Broadcast Preview:\n\n${text}\n\nSend to ${session.target === 'all' ? 'ALL users' : 'active users'}?`;
    
    const buttons = [
        [
            { text: '✅ Send', callback_data: 'admin_broadcast_send' },
            { text: '❌ Cancel', callback_data: 'admin_broadcast_cancel' }
        ]
    ];
    
    await bot.sendMessage(chatId, preview, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons }
    });
};

const sendBroadcast = async (bot, chatId, userId) => {
    const pool = getPool();
    
    const session = await pool.query(
        'SELECT temp_data FROM user_sessions WHERE user_id = $1',
        [userId]
    );
    
    if (session.rows.length === 0 || !session.rows[0].temp_data) {
        await bot.sendMessage(chatId, '❌ Session expired.');
        return;
    }
    
    const { target, message } = session.rows[0].temp_data;
    
    // Get users
    let users;
    if (target === 'all') {
        users = await pool.query(
            'SELECT user_id FROM users WHERE is_blocked = false'
        );
    } else {
        users = await pool.query(
            `SELECT user_id FROM users 
             WHERE is_blocked = false 
             AND last_active > NOW() - INTERVAL '7 days'`
        );
    }
    
    await bot.sendMessage(chatId, `📢 Sending broadcast to ${users.rows.length} users...`);
    
    let sent = 0;
    let failed = 0;
    
    for (const user of users.rows) {
        try {
            await bot.sendMessage(user.user_id, message, { parse_mode: 'HTML' });
            sent++;
            
            // Rate limiting
            if (sent % 20 === 0) {
                await sleep(1000);
            }
        } catch (error) {
            failed++;
            logger.error(`Failed to send broadcast to ${user.user_id}:`, error);
        }
    }
    
    // Save broadcast record
    await pool.query(
        `INSERT INTO broadcasts (message_text, target_users, sent_count, failed_count, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [message, target, sent, failed, userId]
    );
    
    await bot.sendMessage(
        chatId,
        `✅ Broadcast completed!\n\nSent: ${sent}\nFailed: ${failed}`
    );
    
    // Clear session
    await pool.query(
        'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
        [userId]
    );
    
    // Show broadcast menu
    await showBroadcastMenu(bot, chatId);
};

module.exports = {
    showBroadcastMenu,
    startBroadcast,
    processBroadcastMessage,
    sendBroadcast
};
