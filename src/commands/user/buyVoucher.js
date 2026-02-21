/**
 * Buy Voucher Handler
 */

const db = require('../../database/database');
const { Markup } = require('telegraf');

// Store user session data
const userSessions = new Map();

module.exports = async (ctx) => {
  try {
    const userId = ctx.from.id;
    userSessions.delete(userId);
    
    const categories = await db.getCategories();
    
    if (categories.length === 0) {
      return ctx.reply('❌ No vouchers available at the moment.', {
        reply_markup: {
          keyboard: [[{ text: '↩️ Back' }]],
          resize_keyboard: true
        }
      });
    }
    
    const buttons = categories.map(cat => 
      [Markup.button.callback(cat.display_name, `cat_${cat.id}`)]
    );
    buttons.push([Markup.button.callback('↩️ Back', 'back_to_main')]);
    
    await ctx.reply('📌 *Select Voucher Type*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
    
    await ctx.reply('Choose from the options below:', {
      reply_markup: { remove_keyboard: true }
    });
    
  } catch (error) {
    console.error('Buy voucher error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};

// Export sessions for other handlers
module.exports.userSessions = userSessions;
