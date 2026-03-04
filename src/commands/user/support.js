const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { MESSAGES, KEYBOARD } = require('../../utils/constants');

const start = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    try {
        const pool = getPool();
        
        // Set session state
        await pool.query(
            `INSERT INTO user_sessions (user_id, temp_data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE 
             SET temp_data = $2, updated_at = NOW()`,
            [userId, { action: 'awaiting_support' }]
        );
        
        await bot.sendMessage(
            chatId,
            '🆘 *Support*\n\nPlease describe your issue. Our team will respond shortly.\n\n⚠️ Fake or abusive messages may result in a ban.',
            {
                parse_mode: 'Markdown',
                reply_markup: { keyboard: [['↩️ Leave']], resize_keyboard: true }
            }
        );
        
    } catch (error) {
        logger.error('Error in support start:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again.');
    }
};

const process = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    const username = msg.from.username || 'No username';
    const firstName = msg.from.first_name || 'User';
    
    try {
        if (text === '↩️ Leave') {
            // Clear session and go back
            const pool = getPool();
            await pool.query(
                'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
                [userId]
            );
            
            const startCommand = require('../start');
            await startCommand.showMainMenu(msg);
            return;
        }
        
        // Check for abuse
        const abusiveWords = ['fake', 'scam', 'abuse', 'illegal', 'hack', 'cheat', 'fuck', 'shit'];
        const isAbusive = abusiveWords.some(word => text.toLowerCase().includes(word));
        
        if (isAbusive) {
            // Temp block for abuse
            const pool = getPool();
            await pool.query(
                `UPDATE users 
                 SET is_blocked = true, block_reason = 'Abusive language in support', 
                     block_expires = NOW() + INTERVAL '30 minutes'
                 WHERE user_id = $1`,
                [userId]
            );
            
            await bot.sendMessage(
                chatId,
                '⏳ You have been temporarily restricted for 30 minutes due to inappropriate language.'
            );
            
            // Clear session
            await pool.query(
                'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
                [userId]
            );
            return;
        }
        
        const pool = getPool();
        
        // Save to database
        const ticket = await pool.query(
            `INSERT INTO support_tickets (user_id, message, status)
             VALUES ($1, $2, 'open')
             RETURNING ticket_id`,
            [userId, text]
        );
        
        // Forward to admin
        const supportMessage = `🆘 *New Support Message*\n\n` +
            `*Ticket ID:* ${ticket.rows[0].ticket_id}\n` +
            `*From:* ${firstName} (@${username})\n` +
            `*User ID:* \`${userId}\`\n` +
            `*Time:* ${new Date().toLocaleString()}\n\n` +
            `*Message:*\n${text}`;

        const supportButtons = {
            inline_keyboard: [
                [
                    { text: '✏️ Reply', callback_data: `admin_reply_${userId}_${ticket.rows[0].ticket_id}` },
                    { text: '🚫 Block', callback_data: `admin_block_${userId}` }
                ],
                [
                    { text: '✅ Resolve', callback_data: `admin_resolve_${ticket.rows[0].ticket_id}` }
                ]
            ]
        };
        
        await bot.sendMessage(process.env.ADMIN_ID, supportMessage, {
            parse_mode: 'Markdown',
            reply_markup: supportButtons
        });
        
        // Clear session
        await pool.query(
            'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
            [userId]
        );
        
        await bot.sendMessage(
            chatId,
            '✅ *Your message has been sent to support.*\n\nYou will receive a reply soon.',
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['🛒 Buy Voucher', '🔁 Recover Vouchers'],
                        ['📦 My Orders', '📜 Disclaimer'],
                        ['🆘 Support']
                    ],
                    resize_keyboard: true
                }
            }
        );
        
    } catch (error) {
        logger.error('Error processing support message:', error);
        await bot.sendMessage(
            chatId, 
            '❌ Error sending message. Please try again later.',
            {
                reply_markup: {
                    keyboard: [
                        ['🛒 Buy Voucher', '🔁 Recover Vouchers'],
                        ['📦 My Orders', '📜 Disclaimer'],
                        ['🆘 Support']
                    ],
                    resize_keyboard: true
                }
            }
        );
    }
};

module.exports = {
    start,
    process
};
