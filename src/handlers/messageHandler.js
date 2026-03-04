const { checkUserStatus, checkChannelJoin } = require('../middlewares/auth');
const { getPool } = require('../database/database');
const logger = require('../utils/logger');
const { MESSAGES, KEYBOARD } = require('../utils/constants');
const startCommand = require('../commands/start');
const userCommands = require('../commands/user/index');
const adminCommands = require('../commands/admin/index');

const handleMessage = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    
    try {
        logger.info(`Handling message from user ${userId}: ${text}`);
        
        // Check if user is blocked
        const userStatus = await checkUserStatus(userId);
        
        if (userStatus.isBlocked) {
            let blockMessage = MESSAGES.USER_BLOCKED.replace('%reason%', userStatus.reason || 'No reason specified');
            
            if (userStatus.expires) {
                const minutesLeft = Math.ceil((new Date(userStatus.expires) - new Date()) / 60000);
                blockMessage = MESSAGES.TEMP_BLOCKED(minutesLeft).replace('%reason%', userStatus.reason || 'No reason specified');
            }
            
            const keyboard = {
                keyboard: [['🆘 Support']],
                resize_keyboard: true,
                one_time_keyboard: false
            };
            
            await bot.sendMessage(chatId, blockMessage, {
                reply_markup: keyboard,
                parse_mode: 'HTML'
            });
            return;
        }
        
        // Handle /start command separately (no channel check needed)
        if (text === '/start') {
            await startCommand.execute(msg);
            return;
        }
        
        // Check channel join for all other commands
        const isJoined = await checkChannelJoin(bot, userId);
        if (!isJoined) {
            const keyboard = {
                inline_keyboard: [
                    [{ text: '📢 Join Channel 1', url: 'https://t.me/SheinVoucherHub' }],
                    [{ text: '📢 Join Channel 2', url: 'https://t.me/OrdersNotify' }],
                    [{ text: '✅ Verify', callback_data: 'verify_join' }]
                ]
            };
            
            await bot.sendMessage(chatId, MESSAGES.JOIN_REQUIRED, {
                reply_markup: keyboard,
                parse_mode: 'HTML'
            });
            return;
        }
        
        const pool = getPool();
        
        // Update last active
        await pool.query(
            'UPDATE users SET last_active = NOW() WHERE user_id = $1',
            [userId]
        );
        
        // Check if user has an active session
        const session = await pool.query(
            'SELECT temp_data FROM user_sessions WHERE user_id = $1',
            [userId]
        );
        
        // Handle admin commands
        if (userId.toString() === process.env.ADMIN_ID && text === '/admin') {
            await adminCommands.showAdminPanel(msg);
            return;
        }
        
        // Handle menu button clicks
        if (text) {
            switch(text) {
                case '🛒 Buy Voucher':
                    await userCommands.buyVoucher.showCategories(msg);
                    return;
                    
                case '🔁 Recover Vouchers':
                    await userCommands.recoverVoucher.prompt(msg);
                    return;
                    
                case '📦 My Orders':
                    await userCommands.myOrders.showOrders(msg);
                    return;
                    
                case '📜 Disclaimer':
                    await userCommands.disclaimer.show(msg);
                    return;
                    
                case '🆘 Support':
                    await userCommands.support.start(msg);
                    return;
                    
                case '↩️ Back':
                case '↩️ Leave':
                    await startCommand.showMainMenu(msg);
                    return;
            }
        }
        
        // Handle commands starting with /
        if (text && text.startsWith('/')) {
            const command = text.split(' ')[0].toLowerCase();
            
            switch(command) {
                case '/buy':
                    await userCommands.buyVoucher.showCategories(msg);
                    break;
                case '/orders':
                    await userCommands.myOrders.showOrders(msg);
                    break;
                case '/recover':
                    await userCommands.recoverVoucher.prompt(msg);
                    break;
                case '/support':
                    await userCommands.support.start(msg);
                    break;
                case '/disclaimer':
                    await userCommands.disclaimer.show(msg);
                    break;
                default:
                    await bot.sendMessage(chatId, '❌ Unknown command. Please use the menu buttons below:', {
                        reply_markup: { keyboard: KEYBOARD.MAIN, resize_keyboard: true }
                    });
            }
            return;
        }
        
        // Handle based on session state
        if (session.rows.length > 0 && session.rows[0].temp_data) {
            const state = session.rows[0].temp_data;
            logger.info(`User ${userId} in state: ${state.action}`);
            
            switch(state.action) {
                case 'awaiting_custom_quantity':
                    await userCommands.buyVoucher.processCustomQuantity(msg, state);
                    break;
                    
                case 'awaiting_payment':
                    // This should be handled by photo handler, not text
                    await bot.sendMessage(chatId, 'Please send a screenshot of your payment.', {
                        reply_markup: { keyboard: [['↩️ Cancel']], resize_keyboard: true }
                    });
                    break;
                    
                case 'awaiting_utr':
                    await userCommands.buyVoucher.processUTR(msg, state);
                    break;
                    
                case 'awaiting_recovery':
                    await userCommands.recoverVoucher.process(msg);
                    break;
                    
                case 'awaiting_support':
                    await userCommands.support.process(msg);
                    break;
                    
                default:
                    // Clear invalid session
                    await pool.query(
                        'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
                        [userId]
                    );
                    await bot.sendMessage(chatId, 'Please use the menu buttons below:', {
                        reply_markup: { keyboard: KEYBOARD.MAIN, resize_keyboard: true }
                    });
            }
        } else {
            // No active session and not a menu button
            if (text && !text.startsWith('/')) {
                await bot.sendMessage(chatId, 'Please use the menu buttons below:', {
                    reply_markup: { keyboard: KEYBOARD.MAIN, resize_keyboard: true }
                });
            }
        }
        
    } catch (error) {
        logger.error('Error in message handler:', error);
        await bot.sendMessage(chatId, '❌ An error occurred. Please try again later.', {
            reply_markup: { keyboard: KEYBOARD.MAIN, resize_keyboard: true }
        });
    }
};

module.exports = { handleMessage };
