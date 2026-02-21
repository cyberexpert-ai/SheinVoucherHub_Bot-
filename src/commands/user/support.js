/**
 * Support Handler
 */

const db = require('../../database/database');

// Store support sessions
const supportSessions = new Map();

module.exports = async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    supportSessions.set(userId, { waitingForMessage: true });
    
    await ctx.reply(
      '🆘 *Support*\n\n' +
      'Describe your issue in detail.\n' +
      'You can also send screenshots.\n\n' +
      '⚠️ Fake messages = Permanent ban',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{ text: '⬅️ Leave' }]],
          resize_keyboard: true
        }
      }
    );
    
  } catch (error) {
    console.error('Support error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};

// Export sessions
module.exports.supportSessions = supportSessions;
