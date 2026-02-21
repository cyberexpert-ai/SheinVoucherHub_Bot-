/**
 * Message Handler
 */

const db = require('../database/database');
const backCommand = require('../commands/user/back');

module.exports = async (ctx) => {
  try {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    
    // Update user activity
    await db.updateUserActivity(userId);
    
    // Handle BACK button - সবচেয়ে গুরুত্বপূর্ণ
    if (text === '↩️ Back') {
      console.log('🔙 Back button pressed in message handler');
      return backCommand(ctx);
    }
    
    // Handle LEAVE button
    if (text === '⬅️ Leave') {
      const leaveCommand = require('../commands/user/leave');
      return leaveCommand(ctx);
    }
    
    // অন্যান্য হ্যান্ডলিং এখানে...
    
  } catch (error) {
    console.error('Message handler error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};
