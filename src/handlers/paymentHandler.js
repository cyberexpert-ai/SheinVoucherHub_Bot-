const { getPool } = require('../database/database');
const logger = require('../utils/logger');
const { isValidUTR } = require('../utils/helpers');

const handlePayment = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const photo = msg.photo;
    
    try {
        logger.info(`Payment handler called for user ${userId}`);
        
        if (!photo || photo.length === 0) {
            await bot.sendMessage(chatId, '❌ Please send a valid screenshot.');
            return;
        }
        
        const fileId = photo[photo.length - 1].file_id;
        
        // Check user session for pending order
        const pool = getPool();
        const session = await pool.query(
            'SELECT temp_data FROM user_sessions WHERE user_id = $1',
            [userId]
        );
        
        if (session.rows.length === 0 || !session.rows[0].temp_data) {
            await bot.sendMessage(
                chatId,
                '❌ No pending payment found. Please start a new order.',
                {
                    reply_markup: {
                        keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']],
                        resize_keyboard: true
                    }
                }
            );
            return;
        }
        
        const orderData = session.rows[0].temp_data;
        
        if (orderData.action !== 'awaiting_payment') {
            await bot.sendMessage(
                chatId,
                '❌ No pending payment found. Please start a new order.',
                {
                    reply_markup: {
                        keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']],
                        resize_keyboard: true
                    }
                }
            );
            return;
        }
        
        // Store screenshot and update session
        await pool.query(
            `INSERT INTO user_sessions (user_id, temp_data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE 
             SET temp_data = $2, updated_at = NOW()`,
            [userId, { 
                ...orderData, 
                screenshot: fileId, 
                action: 'awaiting_utr' 
            }]
        );
        
        await bot.sendMessage(
            chatId,
            '✅ Screenshot received!\n\nNow please send your UTR/Transaction ID:',
            {
                reply_markup: { keyboard: [['↩️ Cancel Order']], resize_keyboard: true }
            }
        );
        
    } catch (error) {
        logger.error('Error in payment handler:', error);
        await bot.sendMessage(chatId, '❌ Error processing payment. Please try again.', {
            reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
        });
    }
};

module.exports = { handlePayment };
