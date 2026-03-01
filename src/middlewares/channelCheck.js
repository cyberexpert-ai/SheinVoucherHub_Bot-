const { Markup } = require('telegraf');

async function checkMembership(ctx) {
  try {
    const userId = ctx.from.id;
    const channels = [
      process.env.CHANNEL_1,
      process.env.CHANNEL_2
    ].filter(Boolean);

    for (const channel of channels) {
      try {
        const chatMember = await ctx.telegram.getChatMember(channel, userId);
        
        // Check if user is member/administrator/creator
        const validStatuses = ['member', 'administrator', 'creator'];
        if (!validStatuses.includes(chatMember.status)) {
          return false;
        }
      } catch (error) {
        console.error(`Channel check error for ${channel}:`, error);
        // If we can't check, assume not a member
        return false;
      }
    }

    // Update user verified status
    await global.pool.query(
      `UPDATE users SET verified = TRUE WHERE user_id = $1`,
      [userId]
    );

    return true;
    
  } catch (error) {
    console.error('Membership check error:', error);
    return false;
  }
}

async function channelCheck(ctx, next) {
  try {
    // Skip check for admin
    if (ctx.from.id.toString() === process.env.ADMIN_ID) {
      return next();
    }

    // Check if user is already verified in our database
    const userCheck = await global.pool.query(
      'SELECT verified FROM users WHERE user_id = $1',
      [ctx.from.id]
    );

    if (userCheck.rows.length > 0 && userCheck.rows[0].verified) {
      // User was previously verified, but double-check membership
      const isStillMember = await checkMembership(ctx);
      if (isStillMember) {
        return next();
      }
    }

    // Check current membership
    const isMember = await checkMembership(ctx);
    
    if (!isMember) {
      const joinButtons = [];
      
      if (process.env.CHANNEL_1) {
        joinButtons.push([Markup.button.url('📢 Join Channel 1', `https://t.me/${process.env.CHANNEL_1.replace('@', '')}`)]);
      }
      if (process.env.CHANNEL_2) {
        joinButtons.push([Markup.button.url('📢 Join Channel 2', `https://t.me/${process.env.CHANNEL_2.replace('@', '')}`)]);
      }
      
      joinButtons.push([Markup.button.callback('✅ Verify Join', 'verify_join')]);

      await ctx.reply(
        "👋 *Welcome to Shein Voucher Bot*\n\n" +
        "📢 Please join our channels to continue.",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: joinButtons
          }
        }
      );
      return;
    }

    return next();
    
  } catch (error) {
    console.error('Channel check middleware error:', error);
    return next();
  }
}

module.exports = { channelCheck, checkMembership };
