const { Markup } = require('telegraf');
const { checkMembership } = require('../middlewares/channelCheck');
const { deleteOldMessage, saveUser } = require('../utils/helpers');

async function startCommand(ctx) {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name;

    // Save or update user
    await saveUser(userId, username, firstName, lastName);

    // Check channel membership
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
        "👋 *Welcome to Shein Codes Bot*\n\n" +
        "📢 Please join our channels to continue:",
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: joinButtons
          }
        }
      );
      return;
    }

    // User is a member, show main menu
    await showMainMenu(ctx);
    
  } catch (error) {
    console.error('Start command error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
}

async function showMainMenu(ctx) {
  const message = 
    "🎯 *Welcome to Shein Voucher Hub!*\n\n" +
    "🚀 Get exclusive Shein vouchers at the best prices!\n\n" +
    "📌 *Choose an option below:*";

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🛒 Buy Voucher', 'buy_voucher')],
    [Markup.button.callback('🔁 Recover Vouchers', 'recover_vouchers')],
    [Markup.button.callback('📦 My Orders', 'my_orders')],
    [Markup.button.callback('📜 Disclaimer', 'disclaimer')],
    [Markup.button.callback('🆘 Support', 'support')]
  ]);

  await ctx.reply(message, {
    parse_mode: "Markdown",
    reply_markup: keyboard.reply_markup
  });
}

async function handleVerifyJoin(ctx) {
  const isMember = await checkMembership(ctx);
  
  if (isMember) {
    await deleteOldMessage(ctx);
    await showMainMenu(ctx);
  } else {
    await ctx.answerCbQuery('❌ You have not joined both channels yet!', { show_alert: true });
  }
}

module.exports = { startCommand, showMainMenu, handleVerifyJoin };
