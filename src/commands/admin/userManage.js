const db = require('../../database/database');
const helpers = require('../../utils/helpers');

async function manageUsers(bot, chatId, userId) {
    const stats = await db.query(
        'SELECT COUNT(*) as total, SUM(is_blocked) as blocked FROM users'
    );
    
    const message = `👥 User Management\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `Total Users: ${stats[0].total}\n` +
                    `Blocked Users: ${stats[0].blocked || 0}\n\n` +
                    `Select an option:`;
    
    const keyboard = [
        ['🔍 Search User', '📋 List Users'],
        ['⛔ Block User', '✅ Unblock User'],
        ['⚠️ Add Warning', '📊 User Stats'],
        ['↩️ Back to Admin']
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    });
}

async function searchUser(bot, chatId, userId) {
    const msg = await bot.sendMessage(chatId,
        `🔍 Search User\n\n` +
        `Send User ID or @username:`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'admin_search_user',
        messageId: msg.message_id
    };
}

async function showUserInfo(bot, chatId, adminId, targetId) {
    let user;
    
    if (typeof targetId === 'string' && targetId.startsWith('@')) {
        // Search by username
        const users = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [targetId.substring(1)]
        );
        user = users[0];
    } else {
        // Search by ID
        user = await db.getUser(parseInt(targetId));
    }
    
    if (!user) {
        await bot.sendMessage(chatId, '❌ User not found.');
        return;
    }
    
    const orders = await db.getUserOrders(user.telegram_id, 5);
    const warnings = await db.query(
        'SELECT COUNT(*) as count FROM user_warnings WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
        [user.telegram_id]
    );
    
    let message = `👤 User Information\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `ID: ${user.telegram_id}\n`;
    message += `Username: @${user.username || 'N/A'}\n`;
    message += `Name: ${user.first_name} ${user.last_name || ''}\n`;
    message += `Joined: ${helpers.formatDate(user.joined_at)}\n`;
    message += `Last Active: ${helpers.formatDate(user.last_active)}\n`;
    message += `Status: ${user.is_blocked ? '⛔ BLOCKED' : '✅ Active'}\n`;
    if (user.is_blocked) {
        message += `Block Reason: ${user.block_reason || 'N/A'}\n`;
        if (user.block_expires) {
            message += `Expires: ${helpers.formatDate(user.block_expires)}\n`;
        }
    }
    message += `Warnings (24h): ${warnings[0].count}\n`;
    message += `Total Orders: ${user.total_orders}\n`;
    message += `Total Spent: ₹${user.total_spent}\n\n`;
    
    if (orders.length > 0) {
        message += `Recent Orders:\n`;
        for (const order of orders) {
            message += `• ${order.order_id} - ${order.status} - ₹${order.total_price}\n`;
        }
    }
    
    const buttons = [
        [
            { text: user.is_blocked ? '✅ Unblock' : '⛔ Block', 
              callback_data: `admin_toggleblock_${user.telegram_id}` }
        ],
        [
            { text: '⚠️ Add Warning', callback_data: `admin_warn_${user.telegram_id}` },
            { text: '📨 Message', callback_data: `admin_msg_${user.telegram_id}` }
        ],
        [
            { text: '↩️ Back', callback_data: 'admin_back_users' }
        ]
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

async function blockUser(bot, chatId, adminId, targetId, reason = null, duration = null) {
    if (!reason) {
        // Ask for reason
        const msg = await bot.sendMessage(chatId,
            `⛔ Block User\n\n` +
            `Send reason for blocking:\n` +
            `(Optional: add duration in minutes, e.g., "Spam 30" for 30 min block)`,
            {
                reply_markup: {
                    force_reply: true,
                    selective: true
                }
            }
        );
        
        global.waitingFor = global.waitingFor || {};
        global.waitingFor[adminId] = {
            type: 'admin_block_reason',
            targetId: targetId,
            messageId: msg.message_id
        };
        return;
    }
    
    // Parse duration if provided
    let durationMinutes = null;
    const durationMatch = reason.match(/(\d+)\s*(min|minute|minutes)/i);
    if (durationMatch) {
        durationMinutes = parseInt(durationMatch[1]);
        reason = reason.replace(durationMatch[0], '').trim();
    }
    
    await db.blockUser(targetId, reason, durationMinutes);
    
    // Notify user
    try {
        await bot.sendMessage(targetId,
            `⛔ You have been ${durationMinutes ? 'temporarily' : 'permanently'} blocked.\n` +
            `Reason: ${reason}\n` +
            (durationMinutes ? `Duration: ${durationMinutes} minutes\n` : '') +
            `Contact @SheinSupportRobot for appeals.`
        );
    } catch (error) {
        // User might have blocked the bot
    }
    
    await bot.sendMessage(chatId, `✅ User ${targetId} has been blocked.`);
}

async function unblockUser(bot, chatId, targetId) {
    await db.unblockUser(targetId);
    
    // Notify user
    try {
        await bot.sendMessage(targetId,
            `✅ You have been unblocked.\n` +
            `You can now use the bot again.`
        );
    } catch (error) {}
    
    await bot.sendMessage(chatId, `✅ User ${targetId} has been unblocked.`);
}

async function addWarning(bot, chatId, adminId, targetId) {
    const msg = await bot.sendMessage(chatId,
        `⚠️ Add Warning for user ${targetId}\n\n` +
        `Send warning reason and type:\n` +
        `Format: reason|type\n` +
        `Types: fake_utr, fake_recovery, abuse, spam, other\n` +
        `Example: "Fake UTR|fake_utr"`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[adminId] = {
        type: 'admin_add_warning',
        targetId: targetId,
        messageId: msg.message_id
    };
}

async function processAddWarning(bot, chatId, adminId, targetId, text) {
    const parts = text.split('|').map(p => p.trim());
    let reason = text;
    let type = 'other';
    
    if (parts.length === 2) {
        reason = parts[0];
        type = parts[1];
    }
    
    await db.query(
        'INSERT INTO user_warnings (user_id, reason, warning_type, created_by) VALUES (?, ?, ?, ?)',
        [targetId, reason, type, adminId]
    );
    
    // Check if user should be blocked
    const warnings = await db.query(
        'SELECT COUNT(*) as count FROM user_warnings WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
        [targetId]
    );
    
    if (warnings[0].count >= 3) {
        await db.blockUser(targetId, 'Multiple warnings in 24 hours', 60);
        await bot.sendMessage(chatId, `⚠️ User has 3+ warnings. Automatically blocked for 60 minutes.`);
    }
    
    await bot.sendMessage(chatId, `✅ Warning added for user ${targetId}`);
}

async function messageUser(bot, chatId, adminId, targetId) {
    const msg = await bot.sendMessage(chatId,
        `📨 Send message to user ${targetId}\n\n` +
        `Type your message:`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[adminId] = {
        type: 'admin_message_user',
        targetId: targetId,
        messageId: msg.message_id
    };
}

async function sendUserMessage(bot, adminId, targetId, text) {
    try {
        await bot.sendMessage(targetId,
            `📨 Message from Admin:\n\n${text}`
        );
        await bot.sendMessage(adminId, `✅ Message sent to user ${targetId}`);
    } catch (error) {
        await bot.sendMessage(adminId, `❌ Failed to send message. User might have blocked the bot.`);
    }
}

module.exports = {
    manageUsers,
    searchUser,
    showUserInfo,
    blockUser,
    unblockUser,
    addWarning,
    processAddWarning,
    messageUser,
    sendUserMessage
};
