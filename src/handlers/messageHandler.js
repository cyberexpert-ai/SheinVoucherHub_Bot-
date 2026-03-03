const { checkUserStatus, checkChannelJoin } = require('../middlewares/auth');
const { getPool } = require('../database/database');
const logger = require('../utils/logger');
const { MESSAGES, BUTTONS, KEYBOARD } = require('../utils/constants');
const startCommand = require('../commands/start');
const userCommands = require('../commands/user/index');
const adminCommands = require('../commands/admin/index');

const handleMessage = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    
    try {
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
        
        // Check channel join for non-commands
        if (text !== '/start') {
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
        }
        
        // Handle commands
        if (text && text.startsWith('/')) {
            const command = text.split(' ')[0].toLowerCase();
            
            // Admin commands
            if (userId.toString() === process.env.ADMIN_ID) {
                if (command === '/admin') {
                    await adminCommands.showAdminPanel(msg);
                    return;
                }
            }
            
            // User commands
            switch(command) {
                case '/start':
                    await startCommand.execute(msg);
                    break;
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
                    await bot.sendMessage(chatId, '❌ Unknown command. Use /start');
            }
            return;
        }
        
        // Handle text messages (non-commands)
        if (text) {
            // Update last active
            const pool = getPool();
            await pool.query(
                'UPDATE users SET last_active = NOW() WHERE user_id = $1',
                [userId]
            );
            
            // Handle based on current state
            const session = await pool.query(
                'SELECT temp_data FROM user_sessions WHERE user_id = $1',
                [userId]
            );
            
            if (session.rows.length > 0 && session.rows[0].temp_data) {
                const state = session.rows[0].temp_data;
                
                switch(state.action) {
                    case 'awaiting_utr':
                        await userCommands.buyVoucher.processUTR(msg, state);
                        break;
                    case 'awaiting_recovery':
                        await userCommands.recoverVoucher.process(msg);
                        break;
                    case 'awaiting_support':
                        await userCommands.support.process(msg);
                        break;
                    case 'awaiting_custom_quantity':
                        await userCommands.buyVoucher.processCustomQuantity(msg, state);
                        break;
                    default:
                        await bot.sendMessage(chatId, 'Please use the menu buttons below:', {
                            reply_markup: { keyboard: KEYBOARD.MAIN, resize_keyboard: true }
                        });
                }
            } else {
                // Handle menu buttons
                switch(text) {
                    case '🛒 Buy Voucher':
                        await userCommands.buyVoucher.showCategories(msg);
                        break;
                    case '🔁 Recover Vouchers':
                        await userCommands.recoverVoucher.prompt(msg);
                        break;
                    case '📦 My Orders':
                        await userCommands.myOrders.showOrders(msg);
                        break;
                    case '📜 Disclaimer':
                        await userCommands.disclaimer.show(msg);
                        break;
                    case '🆘 Support':
                        await userCommands.support.start(msg);
                        break;
                    case '↩️ Back':
                    case '↩️ Leave':
                        await startCommand.showMainMenu(msg);
                        break;
                    default:
                        await bot.sendMessage(chatId, 'Please use the menu buttons below:', {
                            reply_markup: { keyboard: KEYBOARD.MAIN, resize_keyboard: true }
                        });
                }
            }
        }
    } catch (error) {
        logger.error('Error in message handler:', error);
        await bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
    }
};

module.exports = { handleMessage };
