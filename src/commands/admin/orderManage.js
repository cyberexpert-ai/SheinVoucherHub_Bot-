const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { formatCurrency } = require('../../utils/helpers');

const showOrderMenu = async (bot, chatId) => {
    const pool = getPool();
    
    const stats = await pool.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'successful' THEN 1 ELSE 0 END) as successful,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
            COALESCE(SUM(CASE WHEN status = 'successful' THEN total_price ELSE 0 END), 0) as revenue
        FROM orders
    `);
    
    const message = `📦 Order Management

Total Orders: ${stats.rows[0].total}
Pending: ${stats.rows[0].pending}
Successful: ${stats.rows[0].successful}
Rejected: ${stats.rows[0].rejected}
Revenue: ${formatCurrency(stats.rows[0].revenue)}

Options:`;

    const buttons = [
        [
            { text: '⏳ Pending Orders', callback_data: 'admin_pending' },
            { text: '✅ Successful', callback_data: 'admin_successful' }
        ],
        [
            { text: '🔍 Find Order', callback_data: 'admin_findorder' },
            { text: '📊 Order Stats', callback_data: 'admin_orderstats' }
        ],
        [
            { text: '🗑 Clean Old', callback_data: 'admin_cleanorders' },
            { text: '📋 Export', callback_data: 'admin_exportorders' }
        ],
        [{ text: '↩️ Back', callback_data: 'admin_back' }]
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: buttons }
    });
};

const showPendingOrders = async (bot, chatId) => {
    const pool = getPool();
    
    const orders = await pool.query(`
        SELECT o.*, u.username, u.first_name, c.name as category_name
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        JOIN categories c ON o.category_id = c.category_id
        WHERE o.status = 'pending'
        ORDER BY o.created_at DESC
        LIMIT 10
    `);
    
    if (orders.rows.length === 0) {
        await bot.sendMessage(chatId, 'No pending orders.');
        return;
    }
    
    for (const order of orders.rows) {
        const message = `⏳ Pending Order

Order ID: ${order.order_id}
User: ${order.first_name} (@${order.username || 'N/A'})
User ID: ${order.user_id}
Category: ${order.category_name}
Quantity: ${order.quantity}
Total: ${formatCurrency(order.total_price)}
UTR: ${order.utr_number || 'N/A'}
Time: ${order.created_at}

Actions:`;

        const buttons = {
            inline_keyboard: [
                [
                    { text: '✅ Accept', callback_data: `admin_accept_${order.order_id}` },
                    { text: '❌ Reject', callback_data: `admin_reject_${order.order_id}` }
                ]
            ]
        };
        
        // Send screenshot if available
        if (order.screenshot_file_id) {
            await bot.sendPhoto(chatId, order.screenshot_file_id, {
                caption: message,
                reply_markup: buttons
            });
        } else {
            await bot.sendMessage(chatId, message, {
                reply_markup: buttons
            });
        }
    }
};

const findOrder = async (bot, chatId, userId) => {
    const pool = getPool();
    
    await pool.query(
        `INSERT INTO user_sessions (user_id, temp_data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE 
         SET temp_data = $2, updated_at = NOW()`,
        [userId, { action: 'admin_findorder' }]
    );
    
    await bot.sendMessage(
        chatId,
        'Enter Order ID:',
        {
            reply_markup: { force_reply: true }
        }
    );
};

const processFindOrder = async (bot, chatId, userId, text) => {
    const pool = getPool();
    
    const order = await pool.query(`
        SELECT o.*, u.username, u.first_name, c.name as category_name
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        JOIN categories c ON o.category_id = c.category_id
        WHERE o.order_id = $1
    `, [text]);
    
    if (order.rows.length === 0) {
        await bot.sendMessage(chatId, '❌ Order not found.');
        return;
    }
    
    const ord = order.rows[0];
    
    const message = `📦 Order Details

Order ID: ${ord.order_id}
User: ${ord.first_name} (@${ord.username || 'N/A'})
User ID: ${ord.user_id}
Category: ${ord.category_name}
Quantity: ${ord.quantity}
Total: ${formatCurrency(ord.total_price)}
Status: ${ord.status}
UTR: ${ord.utr_number || 'N/A'}
Created: ${ord.created_at}
Updated: ${ord.updated_at}
${ord.voucher_codes ? `Vouchers: ${ord.voucher_codes.join(', ')}` : ''}`;

    const buttons = {
        inline_keyboard: [
            [
                { text: '✉️ Message User', callback_data: `admin_msguser_${ord.user_id}` },
                { text: '🔄 Force Status', callback_data: `admin_forcestatus_${ord.order_id}` }
            ],
            [{ text: '↩️ Back', callback_data: 'admin_orders' }]
        ]
    };
    
    if (ord.screenshot_file_id) {
        await bot.sendPhoto(chatId, ord.screenshot_file_id, {
            caption: message,
            reply_markup: buttons
        });
    } else {
        await bot.sendMessage(chatId, message, {
            reply_markup: buttons
        });
    }
    
    // Clear session
    await pool.query(
        'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
        [userId]
    );
};

module.exports = {
    showOrderMenu,
    showPendingOrders,
    findOrder,
    processFindOrder
};
