async function checkChannels(bot, userId) {
    const channels = [process.env.CHANNEL_1_USERNAME, process.env.CHANNEL_2_USERNAME];
    
    for (const channel of channels) {
        try {
            const member = await bot.getChatMember(channel, userId);
            if (member.status === 'left' || member.status === 'kicked') {
                return false;
            }
        } catch {
            return false;
        }
    }
    return true;
}

async function sendJoinMessage(bot, chatId) {
    const message = `⚠️ **Please join our channels first:**

📢 ${process.env.CHANNEL_1_USERNAME}
📢 ${process.env.CHANNEL_2_USERNAME}

After joining, click verify button below.`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📢 Official channel', url: `https://t.me/${process.env.CHANNEL_1_USERNAME.replace('@', '')}` },
                    { text: '🔔 order alart', url: `https://t.me/${process.env.CHANNEL_2_USERNAME.replace('@', '')}` }
                ],
                [
                    { text: '✅ Verify', callback_data: 'verify_channels' }
                ]
            ]
        }
    });
}

module.exports = { checkChannels, sendJoinMessage };
