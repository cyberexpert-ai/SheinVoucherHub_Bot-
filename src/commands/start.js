const db = require('../database/database');
const { Markup } = require('telegraf');

module.exports = async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || '';
    const firstName = ctx.from.first_name || '';
    const lastName = ctx.from.last_name || '';
    
    // Create or update user
    await db.createUser(userId, username, firstName, lastName);
    
    // Check if user is blocked
    const isBlocked = await db.isUserBlocked(userId);
    if (isBlocked) {
      const user = await db.getUser(userId);
      let blockMsg = '🚫 You are blocked from using this bot.\n\n';
      if (user?.block_reason) {
        blockMsg += `Reason: ${user.block_reason}\n`;
      }
      if (user?.block_until) {
        blockMsg += `Until: ${new Date(user.block_until).toLocaleString()}\n`;
      }
      blockMsg += '\nContact support: @SheinSupportRobot';
      
      return ctx.reply(blockMsg, {
        reply_markup: {
          keyboard: [[{ text: '🆘 Support' }]],
          resize_keyboard: true
        }
      });
    }
    
    // Check channel membership
    const channel1 = process.env.CHANNEL_1;
    const channel2 = process.env.CHANNEL_2;
    
    let inChannel1 = false;
    let inChannel2 = false;
    
    try {
      const member1 = await ctx.telegram.getChatMember(channel1, userId);
      inChannel1 = ['member', 'administrator', 'creator'].includes(member1.status);
    } catch (e) {}
    
    try {
      const member2 = await ctx.telegram.getChatMember(channel2, userId);
      inChannel2 = ['member', 'administrator', 'creator'].includes(member2.status);
    } catch (e) {}
    
    // If not in channels, show force join
    if (!inChannel1 || !inChannel2) {
      const channels = [];
      if (!inChannel1) channels.push(channel1);
      if (!inChannel2) channels.push(channel2);
      
      const buttons = channels.map(ch => [Markup.button.url(ch, `https://t.me/${ch.replace('@', '')}`)]);
      buttons.push([Markup.button.callback('✅ Verify', 'verify_membership')]);
      
      return ctx.reply(
        '🚫 *Access Denied*\n\n' +
        'You must join our channels to use this bot:\n' +
        channels.map(ch => `🔹 ${ch}`).join('\n') +
        '\n\nAfter joining, click Verify button.',
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard(buttons).reply_markup
        }
      );
    }
    
    // User is verified, show welcome message
    const welcomeMessage = await db.getSetting('welcome_message') || 
      '🎯 Welcome to Shein Voucher Hub S!\n\n🚀 Get exclusive Shein vouchers at the best prices!\n\n📌 Choose an option below:';
    
    // Update verification status
    await db.query(
      'UPDATE users SET is_verified = TRUE WHERE telegram_id = ?',
      [userId]
    );
    
    // Show main menu
    await ctx.reply(welcomeMessage, {
      reply_markup: {
        keyboard: [
          [{ text: '🛒 Buy Voucher' }, { text: '🔁 Recover Vouchers' }],
          [{ text: '📦 My Orders' }, { text: '📜 Disclaimer' }],
          [{ text: '🆘 Support' }]
        ],
        resize_keyboard: true
      }
    });
    
    // Delete previous message if exists
    if (ctx.message) {
      try {
        await ctx.deleteMessage(ctx.message.message_id);
      } catch (e) {}
    }
    
  } catch (error) {
    console.error('Start command error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};
