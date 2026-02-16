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
        const message = `⚠️ **Please join our channels first to use the bot:**

📢 Channel 1: ${process.env.CHANNEL_1}
📢 Channel 2: ${process.env.CHANNEL_2}

After joining, click the verify button below.`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📢 Join Channel 1', url: 'https://t.me/SheinVoucherHub' },
                        { text: '📢 Join Channel 2', url: 'https://t.me/OrdersNotify' }
                    ],
                    [
                        { text: '✅ Verify Join', callback_data: 'verify_channels' }
                    ]
                ]
            }
        });
    },
    
    async verifyAndRespond(bot, chatId, userId) {
        const isMember = await this.checkChannels(bot, userId);
        
        if (isMember) {
            await bot.sendMessage(chatId, 
                `✅ **Channel Verification Successful!**\n\nWelcome to Shein Voucher Hub!`,
                { parse_mode: 'Markdown' }
            );
            
            const { sendMainMenu } = require('../commands/start');
            await sendMainMenu(bot, chatId);
        } else {
            await bot.sendMessage(chatId, 
                '❌ **Verification Failed!**\n\nPlease join both channels first.',
                { parse_mode: 'Markdown' }
            );
        }
    }
};

module.exports = { channelCheckMiddleware };
