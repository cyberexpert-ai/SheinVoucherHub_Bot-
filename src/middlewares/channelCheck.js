const pool = require('../database/database');

module.exports = async (ctx, next) => {
    if (!ctx.from) return;
    const userId = ctx.from.id;

    // Check DB for Ban
    const [userRows] = await pool.query("SELECT is_banned, ban_until FROM users WHERE user_id = ?", [userId]);
    if (userRows.length > 0 && userRows[0].is_banned) {
        if (userRows[0].ban_until && new Date() < new Date(userRows[0].ban_until)) {
            return ctx.reply("🚫 You are temporarily restricted for violating rules. Only Support is available.");
        } else if (!userRows[0].ban_until) {
            return ctx.reply("🚫 You are permanently blocked. Contact Support.");
        }
    }

    try {
        const chatMember = await ctx.telegram.getChatMember(process.env.CHANNEL_MAIN, userId);
        if (['member', 'administrator', 'creator'].includes(chatMember.status)) {
            return next();
        } else {
            throw new Error('Not joined');
        }
    } catch (err) {
        return ctx.reply(`👋 Welcome to Shein Codes Bot\n\n📢 Please join ${process.env.CHANNEL_MAIN} to continue.`, {
            reply_markup: {
                inline_keyboard:[[{ text: "Join Channel", url: `https://t.me/${process.env.CHANNEL_MAIN.replace('@', '')}` }],[{ text: "Verify ✅", callback_data: "verify_join" }]
                ]
            }
        });
    }
};
