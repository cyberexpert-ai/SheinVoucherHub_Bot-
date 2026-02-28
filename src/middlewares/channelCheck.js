const db = require('../database/database');

const CHANNELS = [
    { username: '@SheinVoucherHub', id: process.env.CHANNEL_1_ID },
    { username: '@OrdersNotify', id: process.env.CHANNEL_2_ID }
];

async function checkChannelMembership(bot, userId) {
    try {
        for (const channel of CHANNELS) {
            try {
                const chatMember = await bot.getChatMember(channel.username, userId);
                
                const validStatuses = ['member', 'administrator', 'creator'];
                if (!validStatuses.includes(chatMember.status)) {
                    return {
                        joined: false,
                        channel: channel.username
                    };
                }
            } catch (error) {
                console.error(`Error checking channel ${channel.username}:`, error);
                return {
                    joined: false,
                    channel: channel.username,
                    error: true
                };
            }
        }
        
        return { joined: true };
    } catch (error) {
        console.error('Channel check error:', error);
        return { joined: false, error: true };
    }
}

async function forceJoinMiddleware(bot, msg, next) {
    const userId = msg.from.id;
    
    // Skip check for admin
    if (userId.toString() === process.env.ADMIN_ID) {
        return next();
    }
    
    // Check if user is blocked
    const user = await db.getUser(userId);
    if (user && user.is_blocked) {
        const blockMsg = user.block_expires && new Date(user.block_expires) > new Date()
            ? `⛔️ You are temporarily blocked until ${new Date(user.block_expires).toLocaleString()}\nReason: ${user.block_reason || 'No reason provided'}`
            : `⛔️ You are permanently blocked.\nReason: ${user.block_reason || 'No reason provided'}`;
        
        await bot.sendMessage(userId, blockMsg, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🆘 Contact Support', callback_data: 'support' }]
                ]
            }
        });
        return;
    }
    
    const membership = await checkChannelMembership(bot, userId);
    
    if (!membership.joined) {
        const message = await bot.sendMessage(userId, 
            `👋 Welcome to Shein Codes Bot\n\n📢 Please join ${membership.channel || 'our channels'} to continue.\n\nAfter joining, tap verify ✅`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Verify', callback_data: 'verify_channels' }]
                    ]
                }
            }
        );
        
        // Store message ID for auto-delete
        global.pendingVerification = global.pendingVerification || {};
        global.pendingVerification[userId] = message.message_id;
        
        return;
    }
    
    next();
}

module.exports = {
    forceJoinMiddleware,
    checkChannelMembership
};
