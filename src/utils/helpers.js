// Message deletion tracking
const userMessages = {};

async function deletePreviousMessage(bot, chatId, userId = null) {
    try {
        if (userId && userMessages[userId]) {
            const messageId = userMessages[userId];
            await bot.deleteMessage(chatId, messageId).catch(() => {});
            delete userMessages[userId];
        }
    } catch (error) {
        console.error('Error deleting message:', error);
    }
}

function trackMessage(userId, messageId) {
    userMessages[userId] = messageId;
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
    const secs = Math.floor(((seconds % 86400) % 3600) % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);
    
    return parts.join(' ') || '0s';
}

module.exports = {
    deletePreviousMessage,
    trackMessage,
    formatUptime
};
