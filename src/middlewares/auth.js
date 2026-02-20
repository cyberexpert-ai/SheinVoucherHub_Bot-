const db = require('../database/database');

module.exports = async (ctx, next) => {
  try {
    const userId = ctx.from.id;
    
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
    
    // Update last active
    await db.updateUserActivity(userId);
    
    return next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return next();
  }
};
