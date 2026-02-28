const db = require('../../database/database');
const helpers = require('../../utils/helpers');

async function manageOrders(bot, chatId, userId) {
    const stats = await db.query(
        'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
    );
    
    let message = '📦 Order Management\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const stat of stats) {
        message += `${stat.status}: ${stat.count}\n`;
    }
    
    const keyboard = [
        ['📋 Pending Orders', '✅ Completed Orders'],
        ['🔍 Search Order', '⏰ Expired Orders'],
        ['📊 Order Stats', '↩️ Back to Admin']
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    });
}

async function listOrders(bot, chatId, status, page = 0) {
    const pageSize = 10;
    const offset = page * pageSize;
    
    const orders = await db.query(
        `SELECT o.*, u.username, u.first_name 
         FROM orders o 
         LEFT JOIN users u ON o.user_id = u.telegram_id 
         WHERE o.status = ? 
         ORDER BY o.created_at DESC 
         LIMIT ? OFFSET ?`,
        [status, pageSize, offset]
    );
    
    if (!orders.length) {
        await bot.sendMessage(chatId, `No ${status} orders found.`);
        return;
    }
    
    let message = `📋 ${status.toUpperCase()} Orders\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    
    for (const order of orders) {
        message += `Order: ${order.order_id}\n`;
        message += `User: ${order.first_name} (@${order.username || 'N/A'})\n`;
        message += `Amount: ₹${order.total_price}\n`;
        message += `Date: ${helpers.formatDate(order.created_at)}\n`;
        message += `━━━━━━━━━━━━━━━━\n\n`;
    }
    
    const buttons = [];
    if (page > 0) {
        buttons.push([{ text: '◀️ Previous', callback_data: `admin_orders_${status}_${page-1}` }]);
    }
    if (orders.length === pageSize) {
        buttons.push([{ text: 'Next ▶️', callback_data: `admin_orders_${status}_${page+1}` }]);
    }
    buttons.push([{ text: '↩️ Back', callback_data: 'admin_back_orders' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

async function searchOrder(bot, chatId, userId) {
    const msg = await bot.sendMessage(chatId,
        `🔍 Search Order\n\n` +
        `Send Order ID:`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'admin_search_order',
        messageId: msg.message_id
    };
}

async function showOrderDetails(bot, chatId, adminId, orderId) {
    const order = await db.getOrder(orderId);
    
    if (!order) {
        await bot.sendMessage(chatId, '❌ Order not found.');
        return;
    }
    
    const vouchers = await db.query(
        'SELECT voucher_code FROM order_vouchers WHERE order_id = ?',
        [orderId]
    );
    
    let message = `📦 Order Details\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `Order ID: ${order.order_id}\n`;
    message += `User: ${order.first_name} (@${order.username || 'N/A'})\n`;
    message += `User ID: ${order.user_id}\n`;
    message += `Category: ${order.category_name}\n`;
    message += `Quantity: ${order.quantity}\n`;
    message += `Total: ₹${order.total_price}\n`;
    message += `UTR: ${order.utr_number || 'N/A'}\n`;
    message += `Status: ${order.status}\n`;
    message += `Created: ${helpers.formatDate(order.created_at)}\n`;
    
    if (order.completed_at) {
        message += `Completed: ${helpers.formatDate(order.completed_at)}\n`;
    }
    
    if (vouchers.length > 0) {
        message += `\nVouchers:\n`;
        for (const v of vouchers) {
            message += `• ${v.voucher_code}\n`;
        }
    }
    
    const buttons = [];
    if (order.status === 'pending') {
        buttons.push([
            { text: '✅ Accept', callback_data: `admin_accept_${orderId}` },
            { text: '❌ Reject', callback_data: `admin_reject_${orderId}` }
        ]);
    }
    buttons.push([{ text: '↩️ Back', callback_data: 'admin_back_orders' }]);
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

async function forceCompleteOrder(bot, chatId, adminId, orderId) {
    const order = await db.getOrder(orderId);
    
    if (!order) {
        await bot.sendMessage(chatId, '❌ Order not found.');
        return;
    }
    
    if (order.status === 'completed') {
        await bot.sendMessage(chatId, '❌ Order already completed.');
        return;
    }
    
    const msg = await bot.sendMessage(chatId,
        `⚠️ Force Complete Order ${orderId}\n\n` +
        `This will mark the order as completed without assigning vouchers.\n` +
        `Send voucher codes to deliver manually (one per line):`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[adminId] = {
        type: 'admin_force_complete',
        orderId: orderId,
        messageId: msg.message_id
    };
}

async function processForceComplete(bot, chatId, adminId, orderId, text) {
    const codes = text.split('\n').map(c => c.trim()).filter(c => c.length > 0);
    const order = await db.getOrder(orderId);
    
    if (codes.length !== order.quantity) {
        await bot.sendMessage(chatId,
            `❌ Expected ${order.quantity} codes, but received ${codes.length}.`
        );
        return;
    }
    
    // Add vouchers
    for (const code of codes) {
        await db.addVoucher(order.category_id, code, adminId);
    }
    
    // Get the newly added vouchers
    const vouchers = await db.query(
        'SELECT id, code FROM vouchers WHERE code IN (?)',
        [codes]
    );
    
    // Assign to order
    await db.assignVouchersToOrder(orderId, vouchers);
    
    // Mark as used
    for (const voucher of vouchers) {
        await db.markVoucherAsUsed(voucher.id, order.user_id, orderId);
    }
    
    // Update order status
    await db.updateOrderStatus(orderId, 'completed');
    
    // Notify user
    const voucherList = codes.join('\n');
    await bot.sendMessage(order.user_id,
        `✅ Order Completed!\n\n` +
        `Order ID: ${orderId}\n` +
        `Category: ${order.category_name}\n` +
        `Quantity: ${order.quantity}\n\n` +
        `📋 Your Voucher Codes:\n${voucherList}`
    );
    
    await bot.sendMessage(chatId, `✅ Order ${orderId} force completed.`);
}

module.exports = {
    manageOrders,
    listOrders,
    searchOrder,
    showOrderDetails,
    forceCompleteOrder,
    processForceComplete
};
