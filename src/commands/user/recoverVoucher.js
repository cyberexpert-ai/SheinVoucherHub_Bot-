const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { MESSAGES, KEYBOARD } = require('../../utils/constants');
const { isExpired } = require('../../utils/helpers');

const prompt = async (msg) => {
    const bot = global.bot;
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
        const pool = getPool();
        
        // Set session state
        await pool.query(
            `INSERT INTO user_sessions (user_id, temp_data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE 
             SET temp_data = $2, updated_at = NOW()`,
            [userId, { action: 'awaiting_recovery' }]
        );
        
        await bot.sendMessage(chatId, MESSAGES.RECOVERY_PROMPT, {
            reply_markup: { keyboard: KEYBOARD.BACK, resize_keyboard: true }
        });
        
    } catch (error) {
        logger.error('Error in recover prompt:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again.');
    }
};

const process = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    
    try {
        if (text === '↩️ Back') {
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
        
        // Validate order ID format
        if (!text.startsWith('SVH-')) {
            await bot.sendMessage(chatId, '❌ Invalid Order ID format. Please use format: SVH-XXXXXXXX-XXXXXX');
            return;
        }
        
        const pool = getPool();
        
        // Check if order exists and belongs to user
        const order = await pool.query(
            `SELECT o.*, c.name as category_name 
             FROM orders o
             JOIN categories c ON o.category_id = c.category_id
             WHERE o.order_id = $1`,
            [text]
        );
        
        if (order.rows.length === 0) {
            await bot.sendMessage(chatId, MESSAGES.ORDER_NOT_FOUND(text), {
                reply_markup: { keyboard: KEYBOARD.BACK, resize_keyboard: true }
            });
            return;
        }
        
        const ord = order.rows[0];
        
        // Check if order belongs to this user
        if (ord.user_id !== userId) {
            await bot.sendMessage(chatId, MESSAGES.WRONG_ACCOUNT, {
                reply_markup: { keyboard: KEYBOARD.BACK, resize_keyboard: true }
            });
            return;
        }
        
        // Check if order is expired
        if (ord.status === 'successful' && ord.recovered) {
            await bot.sendMessage(chatId, '❌ This order has already been recovered.');
            return;
        }
        
        if (isExpired(ord.created_at, 2)) {
            await bot.sendMessage(chatId, MESSAGES.ORDER_EXPIRED(text), {
                reply_markup: { keyboard: KEYBOARD.BACK, resize_keyboard: true }
            });
            return;
        }
        
        // Forward to admin
        const adminMessage = `🔄 Recovery Request

User ID: ${userId}
Order ID: ${text}
Category: ${ord.category_name}
Quantity: ${ord.quantity}
Original Status: ${ord.status}

Please handle this recovery request:`;

        const adminButtons = {
            inline_keyboard: [
                [
                    { text: '✅ Send New Code', callback_data: `admin_recovery_send_${text}` },
                    { text: '❌ Reject', callback_data: `admin_recovery_reject_${text}` }
                ]
            ]
        };
        
        await bot.sendMessage(process.env.ADMIN_ID, adminMessage, {
            reply_markup: adminButtons
        });
        
        // Update order recovery status
        await pool.query(
            `UPDATE orders SET recovered = true, recovery_expires = NOW() + INTERVAL '2 hours' 
             WHERE order_id = $1`,
            [text]
        );
        
        await bot.sendMessage(
            chatId,
            `✅ Recovery request sent for order ${text}.\n\nYou will be notified once processed.`,
            {
                reply_markup: { keyboard: KEYBOARD.BACK, resize_keyboard: true }
            }
        );
        
    } catch (error) {
        logger.error('Error processing recovery:', error);
        await bot.sendMessage(chatId, '❌ Error processing recovery request.');
    }
};

module.exports = {
    prompt,
    process
};
