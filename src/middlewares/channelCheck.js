const db = require('../database/database');
const { Markup } = require('telegraf');

module.exports = async (ctx, next) => {
  try {
    const userId = ctx.from.id;
    const channel1 = process.env.CHANNEL_1;
    const channel2 = process.env.CHANNEL_2;
    
    // Check membership in both channels
    let inChannel1 = false;
    let inChannel2 = false;
    
    try {
      const member1 = await ctx.telegram.getChatMember(channel1, userId);
      inChannel1 = ['member', 'administrator', 'creator'].includes(member1.status);
    } catch (e) {
      console.log('Channel 1 check error:', e.message);
    }
    
    try {
      const member2 = await ctx.telegram.getChatMember(channel2, userId);
      inChannel2 = ['member', 'administrator', 'creator'].includes(member2.status);
    } catch (e) {
      console.log('Channel 2 check error:', e.message);
    }
    
    // If user is in both channels, proceed
    if (inChannel1 && inChannel2) {
      // Update user verification status
      await db.query(
        'UPDATE users SET is_verified = TRUE WHERE telegram_id = ?',
        [userId]
      );
      return next();
    }
    
    // If not in channels, show force join message
    const channels = [];
    if (!inChannel1) channels.push(channel1);
    if (!inChannel2) channels.push(channel2);
    
    const buttons = channels.map(ch => [Markup.button.url(ch, `https://t.me/${ch.replace('@', '')}`)]);
    buttons.push([Markup.button.callback('✅ Verify', 'verify_membership')]);
    
    await ctx.reply(
      '🚫 *Access Denied*\n\n' +
      'You must join our channels to use this bot:\n' +
      channels.map(ch => `🔹 ${ch}`).join('\n') +
      '\n\nAfter joining, click Verify button.',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      }
    );
    
    // Delete previous message if exists
    if (ctx.message) {
      try {
        await ctx.deleteMessage(ctx.message.message_id);
      } catch (e) {}
    }
    
  } catch (error) {
    console.error('Channel check error:', error);
    return next();
  }
};
