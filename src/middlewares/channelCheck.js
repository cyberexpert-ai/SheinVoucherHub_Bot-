const axios = require("axios");

async function channelCheck(bot, userId) {
    try {
        const channels = [
            { username: "@SheinVoucherHub", id: "@SheinVoucherHub" },
            { username: "@OrdersNotify", id: "-1002862139182" }
        ];

        for (const channel of channels) {
            try {
                const chatMember = await bot.getChatMember(channel.id, userId);
                
                if (chatMember.status === "left" || chatMember.status === "kicked") {
                    return false;
                }
            } catch (error) {
                console.error(`Channel check error for ${channel.username}:`, error);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error("Channel check error:", error);
        return false;
    }
}

module.exports = { channelCheck };
