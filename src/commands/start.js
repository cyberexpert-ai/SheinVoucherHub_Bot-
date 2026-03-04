const { getPool } = require('../database/database');
const { checkChannelJoin } = require('../middlewares/auth');
const { MESSAGES, KEYBOARD } = require('../utils/constants');
const logger = require('../utils/logger');

const execute = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    const lastName = msg.from.last_name;
    
    try {
        logger.info(`Start command from user ${userId}`);
        
        // Save or update user
        const pool = getPool();
        await pool.query(
            `INSERT INTO users (user_id, username, first_name, last_name, joined_at, last_active)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (user_id) DO UPDATE 
             SET username = $2, first_name = $3, last_name = $4, last_active = NOW()`,
            [userId, username, firstName, lastName]
        );
        
        // Delete previous messages
        const session = await pool.query(
            'SELECT last_message_id FROM user_sessions WHERE user_id = $1',
            [userId]
        );
        
        if (session.rows.length > 0 && session.rows[0].last_message_id) {
            try {
                await bot.deleteMessage(chatId, session.rows[0].last_message_id);
            } catch (e) {
                // Message might be too old
            }
        }
        
        // Clear any existing session data
        await pool.query(
            'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
            [userId]
        );
        
        // Check if user joined channels
        const isJoined = await checkChannelJoin(bot, userId);
        
        if (!isJoined) {
            const joinKeyboard = {
                inline_keyboard: [
                    [{ text: '📢 Join Channel 1', url: 'https://t.me/SheinVoucherHub' }],
                    [{ text: '📢 Join Channel 2', url: 'https://t.me/OrdersNotify' }],
                    [{ text: '✅ Verify', callback_data: 'verify_join' }]
                ]
            };
            
            const joinMessage = await bot.sendMessage(chatId, MESSAGES.JOIN_REQUIRED, {
                reply_markup: joinKeyboard,
                parse_mode: 'HTML'
            });
            
            await pool.query(
                `INSERT INTO user_sessions (user_id, last_message_id, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id) DO UPDATE 
                 SET last_message_id = $2, updated_at = NOW()`,
                [userId, joinMessage.message_id]
            );
        } else {
            await showMainMenu(msg);
        }
        
    } catch (error) {
        logger.error('Error in start command:', error);
        await bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
    }
};

const showMainMenu = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    try {
        logger.info(`Showing main menu for user ${userId}`);
        
        // Clear any existing session data
        const pool = getPool();
        await pool.query(
            'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
            [userId]
        );
        
        const welcomeMessage = await bot.sendMessage(
            chatId,
            MESSAGES.WELCOME,
            {
                reply_markup: {
                    keyboard: KEYBOARD.MAIN,
                    resize_keyboard: true
                }
            }
        );
        
        await pool.query(
            `INSERT INTO user_sessions (user_id, last_message_id, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE 
             SET last_message_id = $2, updated_at = NOW()`,
            [userId, welcomeMessage.message_id]
        );
        
    } catch (error) {
        logger.error('Error showing main menu:', error);
    }
};

module.exports = {
    execute,
    showMainMenu
};
