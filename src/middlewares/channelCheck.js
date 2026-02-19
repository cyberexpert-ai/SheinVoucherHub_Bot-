const channelCheckMiddleware = {
    async checkChannels(bot, userId) {
        const channels = [process.env.CHANNEL_1, process.env.CHANNEL_2];
        for (const ch of channels) {
            try {
                const m = await bot.getChatMember(ch, userId);
                if (m.status === 'left' || m.status === 'kicked') return false;
            } catch {
                return false;
            }
        }
        return true;
    },
    
    async sendJoinMessage(bot, chatId) {
        await bot.sendMessage(chatId, 
            `⚠️ Join channels first:\n${process.env.CHANNEL_1}\n${process.env.CHANNEL_2}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Verify', callback_data: 'verify_channels' }]
                    ]
                }
            }
        );
    },
    
    async verifyAndRespond(bot, chatId, userId) {
        const ok = await this.checkChannels(bot, userId);
        if (ok) {
            await bot.sendMessage(chatId, '✅ Verified!');
            const { startCommand } = require('../commands/start');
            await startCommand(bot, { chat: { id: chatId }, from: { id: userId } });
        } else {
            await bot.sendMessage(chatId, '❌ Not joined!');
        }
    }
};

module.exports = { channelCheckMiddleware };
