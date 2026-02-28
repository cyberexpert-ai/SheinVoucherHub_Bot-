const db = require('../../database/database');
const constants = require('../../utils/constants');

async function startSupport(bot, chatId, userId) {
    const msg = await bot.sendMessage(chatId,
        `🆘 Support\n\n` +
        `Please describe your issue. Our team will respond shortly.\n\n` +
        `⚠️ Fake, abusive, or spam messages will result in restriction/block.`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'support_message',
        messageId: msg.message_id
    };
}

async function forwardToAdmin(bot, chatId, userId, message, messageId) {
    const user = await db.getUser(userId);
    
    const supportMsg = `🆘 New Support Message\n\n` +
                      `From: ${user.first_name} (@${user.username || 'N/A'})\n` +
                      `User ID: ${userId}\n` +
                      `Message: ${message}\n\n` +
                      `Reply to this message to respond to user.`;
    
    const adminMsg = await bot.sendMessage(process.env.ADMIN_ID, supportMsg, {
        reply_markup: {
            force_reply: true,
            selective: true
        }
    });
    
    // Store mapping for reply handling
    global.supportConversations = global.supportConversations || {};
    global.supportConversations[adminMsg.message_id] = {
        userId: userId,
        userMsgId: messageId,
        chatId: chatId
    };
    
    await bot.sendMessage(chatId,
        `✅ Your message has been sent to support team.\n` +
        `We'll get back to you soon.`,
        {
            reply_markup: {
                keyboard: [[constants.BUTTONS.LEAVE]],
                resize_keyboard: true
            }
        }
    );
}

async function handleAdminReply(bot, adminId, replyToMessageId, replyText) {
    const conversation = global.supportConversations?.[replyToMessageId];
    
    if (!conversation) {
        await bot.sendMessage(adminId, '❌ Conversation not found.');
        return;
    }
    
    const { userId, chatId } = conversation;
    
    // Check if user is blocked
    const user = await db.getUser(userId);
    if (user && user.is_blocked) {
        await bot.sendMessage(adminId, '❌ This user is blocked. Unblock them first to reply.');
        return;
    }
    
    await bot.sendMessage(chatId,
        `🆘 Support Response:\n\n${replyText}`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📝 Reply', callback_data: 'support' }]
                ]
            }
        }
    );
    
    await bot.sendMessage(adminId, '✅ Reply sent to user.');
}

module.exports = {
    startSupport,
    forwardToAdmin,
    handleAdminReply
};
