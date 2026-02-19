async function checkChannels(bot, userId) {
    const channels = [process.env.CHANNEL_1, process.env.CHANNEL_2];
    
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

📢 ${process.env.CHANNEL_1}
📢 ${process.env.CHANNEL_2}

After joining, click verify button below.`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📢 Join Channel 1', url: `https://t.me/${process.env.CHANNEL_1.replace('@', '')}` },
                    { text: '📢 Join Channel 2', url: `https://t.me/${process.env.CHANNEL_2.replace('@', '')}` }
                ],
                [
                    { text: '✅ Verify', callback_data: 'verify_channels' }
                ]
            ]
        }
    });
}

module.exports = { checkChannels, sendJoinMessage };
