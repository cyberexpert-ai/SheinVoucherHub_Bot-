const { checkAdmin, checkUserStatus } = require('../middlewares/auth');
const { getPool } = require('../database/database');
const logger = require('../utils/logger');
const { MESSAGES, BUTTONS, CHANNELS } = require('../utils/constants');
const { formatNotificationMessage, formatCurrency } = require('../utils/helpers');
const userCommands = require('../commands/user/index');
const adminCommands = require('../commands/admin/index');

const handleCallback = async (callbackQuery) => {
    const bot = global.bot;
    const { id, data, message, from } = callbackQuery;
    const userId = from.id;
    const chatId = message.chat.id;
    const messageId = message.message_id;
    
    try {
        // Check if user is blocked
        const userStatus = await checkUserStatus(userId);
        if (userStatus.isBlocked) {
            await bot.answerCallbackQuery(id, {
                text: 'You are blocked from using this bot.',
                show_alert: true
            });
            return;
        }
        
        // Parse callback data
        const [action, ...params] = data.split('_');
        
        switch(action) {
            case 'verify':
                if (params[0] === 'join') {
                    await handleVerifyJoin(bot, from, message);
                }
                break;
                
            case 'category':
                await userCommands.buyVoucher.selectCategory(bot, from, message, params[0]);
                break;
                
            case 'qty':
                await userCommands.buyVoucher.selectQuantity(bot, from, message, params[0], params[1]);
                break;
                
            case 'confirm':
                if (params[0] === 'order') {
                    await userCommands.buyVoucher.confirmOrder(bot, from, message, params[1]);
                }
                break;
                
            case 'paid':
                await userCommands.buyVoucher.paid(bot, from, message);
                break;
                
            case 'order':
                if (params[0] === 'details') {
                    await userCommands.myOrders.showOrderDetails(bot, from, message, params[1]);
                }
                break;
                
            case 'copy':
                await handleCopy(bot, from, message, params);
                break;
                
            case 'admin':
                await handleAdminActions(bot, from, message, params);
                break;
                
            case 'back':
                await handleBack(bot, from, message, params);
                break;
                
            default:
                await bot.answerCallbackQuery(id, {
                    text: 'Unknown action',
                    show_alert: true
                });
        }
        
        // Answer callback query
        await bot.answerCallbackQuery(id);
        
    } catch (error) {
        logger.error('Error in callback handler:', error);
        await bot.answerCallbackQuery(id, {
            text: '❌ An error occurred',
            show_alert: true
        });
    }
};

const handleVerifyJoin = async (bot, user, message) => {
    const chatId = message.chat.id;
    const messageId = message.message_id;
    const userId = user.id;
    
    try {
        // Check if user joined channels
        const channel1 = await bot.getChatMember('@SheinVoucherHub', userId);
        const channel2 = await bot.getChatMember('@OrdersNotify', userId);
        
        const isMember1 = ['member', 'administrator', 'creator'].includes(channel1.status);
        const isMember2 = ['member', 'administrator', 'creator'].includes(channel2.status);
        
        if (isMember1 && isMember2) {
            // Update user as verified
            const pool = getPool();
            await pool.query(
                'UPDATE users SET verified = true WHERE user_id = $1',
                [userId]
            );
            
            // Delete join message
            await bot.deleteMessage(chatId, messageId);
            
            // Show main menu
            const welcomeMessage = await bot.sendMessage(
                chatId,
                MESSAGES.WELCOME,
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
            
            // Save session
            const pool2 = getPool();
            await pool2.query(
                `INSERT INTO user_sessions (user_id, last_message_id, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id) DO UPDATE 
                 SET last_message_id = $2, updated_at = NOW()`,
                [userId, welcomeMessage.message_id]
            );
        } else {
            await bot.answerCallbackQuery(message.id, {
                text: 'Please join both channels first!',
                show_alert: true
            });
        }
    } catch (error) {
        logger.error('Error in verify join:', error);
    }
};

const handleCopy = async (bot, user, message, params) => {
    const code = params.slice(1).join('_');
    
    await bot.answerCallbackQuery(message.id, {
        text: code,
        show_alert: true
    });
};

const handleAdminActions = async (bot, user, message, params) => {
    if (user.id.toString() !== process.env.ADMIN_ID) return;
    
    const action = params[0];
    const orderId = params[1];
    
    const pool = getPool();
    
    switch(action) {
        case 'accept':
            const order = await pool.query(
                `SELECT o.*, c.name as category_name, u.user_id as buyer_id 
                 FROM orders o
                 JOIN categories c ON o.category_id = c.category_id
                 JOIN users u ON o.user_id = u.user_id
                 WHERE o.order_id = $1`,
                [orderId]
            );
            
            if (order.rows.length > 0) {
                const orderData = order.rows[0];
                
                // Get vouchers
                const vouchers = await pool.query(
                    `SELECT code FROM vouchers 
                     WHERE category_id = $1 AND is_sold = false 
                     LIMIT $2`,
                    [orderData.category_id, orderData.quantity]
                );
                
                if (vouchers.rows.length < orderData.quantity) {
                    await bot.sendMessage(
                        message.chat.id,
                        `❌ Insufficient stock for ${orderData.category_name}`
                    );
                    return;
                }
                
                const codes = vouchers.rows.map(v => v.code);
                
                // Update vouchers
                await pool.query(
                    `UPDATE vouchers 
                     SET is_sold = true, order_id = $2, sold_to = $3, sold_at = NOW()
                     WHERE code = ANY($1::text[])`,
                    [codes, orderId, orderData.buyer_id]
                );
                
                // Update order
                await pool.query(
                    `UPDATE orders 
                     SET status = 'successful', voucher_codes = $2, updated_at = NOW()
                     WHERE order_id = $1`,
                    [orderId, codes]
                );
                
                // Update stock
                await pool.query(
                    `UPDATE categories 
                     SET stock = stock - $2 
                     WHERE category_id = $1`,
                    [orderData.category_id, orderData.quantity]
                );
                
                // Send vouchers to user
                const voucherText = codes.map((code, i) => `${i+1}. \`${code}\``).join('\n');
                await bot.sendMessage(
                    orderData.buyer_id,
                    `✅ Your order has been approved!\n\nOrder ID: ${orderId}\n\nYour vouchers:\n${voucherText}`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '📋 Copy All', callback_data: `copy_all_${codes.join('_')}` }]
                            ]
                        }
                    }
                );
                
                // Send notification to channel
                const notification = formatNotificationMessage(orderData, { user_id: orderData.buyer_id, first_name: 'User' });
                await bot.sendMessage(CHANNELS.NOTIFY_ID, notification);
                
                await bot.sendMessage(
                    message.chat.id,
                    `✅ Order ${orderId} approved and vouchers sent!`
                );
            }
            break;
            
        case 'reject':
            // Store in session for reason
            await pool.query(
                `INSERT INTO user_sessions (user_id, temp_data, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id) DO UPDATE 
                 SET temp_data = $2, updated_at = NOW()`,
                [user.id, { action: 'reject_reason', orderId }]
            );
            
            await bot.sendMessage(
                message.chat.id,
                'Please enter rejection reason:'
            );
            break;
    }
};

const handleBack = async (bot, user, message, params) => {
    const chatId = message.chat.id;
    const messageId = message.message_id;
    
    await bot.deleteMessage(chatId, messageId);
    
    const welcomeMessage = await bot.sendMessage(
        chatId,
        MESSAGES.WELCOME,
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
    
    const pool = getPool();
    await pool.query(
        `INSERT INTO user_sessions (user_id, last_message_id, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET last_message_id = $2, updated_at = NOW()`,
        [user.id, welcomeMessage.message_id]
    );
};

module.exports = { handleCallback };
