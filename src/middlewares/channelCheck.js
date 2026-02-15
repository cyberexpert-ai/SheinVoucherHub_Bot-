const channelCheckMiddleware = {
    async checkChannels(bot, userId) {
        const channels = [
            process.env.CHANNEL_1,
            process.env.CHANNEL_2
        ];
        
        for (const channel of channels) {
            try {
                const chatMember = await bot.getChatMember(channel, userId);
                if (chatMember.status === 'left' || chatMember.status === 'kicked') {
                    return false;
                }
            } catch (error) {
                console.error(`Error checking channel ${channel}:`, error);
                return false;
            }
        }
        return true;
    },
    
    async sendJoinMessage(bot, chatId) {
        const message = `⚠️ Please join our channels first to use the bot:

📢 Channel 1: ${process.env.CHANNEL_1}
📢 Channel 2: ${process.env.CHANNEL_2}

After joining, click /start again.`;

        await bot.sendMessage(chatId, message, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📢 Join Channel 1', url: 'https://t.me/SheinVoucherHub' },
                        { text: '📢 Join Channel 2', url: 'https://t.me/OrdersNotify' }
                    ],
                    [
                        { text: '✅ I have joined', callback_data: 'check_channels' }
                    ]
                ]
            }
        });
    }
};

module.exports = { channelCheckMiddleware };
