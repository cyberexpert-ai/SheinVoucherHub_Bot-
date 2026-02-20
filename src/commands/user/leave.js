module.exports = async (ctx) => {
  try {
    await ctx.reply(
      '👋 *Goodbye!*\n\n' +
      'You have left the support session.\n' +
      'Use /start to return to main menu.',
      {
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true }
      }
    );
    
  } catch (error) {
    console.error('Leave command error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};
