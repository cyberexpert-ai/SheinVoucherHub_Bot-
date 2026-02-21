const { Telegraf, Markup, session } = require('telegraf');
const express = require('express');
require('dotenv').config();

const db = require('./database/database');

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Express server
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Bot is running');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// মিডলওয়্যার - সব মেসেজ প্রিন্ট করুন (ডিবাগিং এর জন্য)
bot.use((ctx, next) => {
  console.log('📩 Message received:', ctx.message?.text || 'callback query');
  return next();
});

// Start command
bot.start(async (ctx) => {
  try {
    console.log('✅ /start command received from:', ctx.from.id);
    
    await ctx.reply(
      '🎯 *Welcome to Shein Voucher Hub!*\n\n' +
      'Choose an option below:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '🛒 Buy Voucher' }, { text: '🔁 Recover Vouchers' }],
            [{ text: '📦 My Orders' }, { text: '📜 Disclaimer' }],
            [{ text: '🆘 Support' }]
          ],
          resize_keyboard: true
        }
      }
    );
  } catch (error) {
    console.error('Start command error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Buy Voucher
bot.hears('🛒 Buy Voucher', async (ctx) => {
  try {
    console.log('🛒 Buy Voucher pressed');
    await ctx.reply('Select voucher type:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '₹500 Voucher', callback_data: 'buy_500' }],
          [{ text: '₹1000 Voucher', callback_data: 'buy_1000' }],
          [{ text: '₹2000 Voucher', callback_data: 'buy_2000' }],
          [{ text: '₹4000 Voucher', callback_data: 'buy_4000' }],
          [{ text: '↩️ Back', callback_data: 'back_main' }]
        ]
      }
    });
  } catch (error) {
    console.error('Buy voucher error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Recover Vouchers
bot.hears('🔁 Recover Vouchers', async (ctx) => {
  try {
    console.log('🔁 Recover Vouchers pressed');
    await ctx.reply('🔁 *Recover Vouchers*\n\nSend your Order ID:', {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[{ text: '↩️ Back' }]],
        resize_keyboard: true
      }
    });
  } catch (error) {
    console.error('Recover error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// My Orders
bot.hears('📦 My Orders', async (ctx) => {
  try {
    console.log('📦 My Orders pressed');
    await ctx.reply('📦 You don\'t have any orders yet.', {
      reply_markup: {
        keyboard: [[{ text: '↩️ Back' }]],
        resize_keyboard: true
      }
    });
  } catch (error) {
    console.error('My orders error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Disclaimer
bot.hears('📜 Disclaimer', async (ctx) => {
  try {
    console.log('📜 Disclaimer pressed');
    await ctx.reply(
      '📜 *Disclaimer*\n\n' +
      '• All coupons are 100% OFF\n' +
      '• No minimum order\n' +
      '• No returns',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{ text: '↩️ Back' }]],
          resize_keyboard: true
        }
      }
    );
  } catch (error) {
    console.error('Disclaimer error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Support
bot.hears('🆘 Support', async (ctx) => {
  try {
    console.log('🆘 Support pressed');
    await ctx.reply('🆘 *Support*\n\nContact: @SheinSupportRobot', {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[{ text: '⬅️ Leave' }]],
        resize_keyboard: true
      }
    });
  } catch (error) {
    console.error('Support error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Back button
bot.hears('↩️ Back', async (ctx) => {
  try {
    console.log('🔙 Back pressed');
    
    // Clear keyboard and show main menu
    await ctx.reply(
      '🎯 *Main Menu*',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '🛒 Buy Voucher' }, { text: '🔁 Recover Vouchers' }],
            [{ text: '📦 My Orders' }, { text: '📜 Disclaimer' }],
            [{ text: '🆘 Support' }]
          ],
          resize_keyboard: true
        }
      }
    );
  } catch (error) {
    console.error('Back button error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Leave button
bot.hears('⬅️ Leave', async (ctx) => {
  try {
    console.log('⬅️ Leave pressed');
    await ctx.reply('👋 Goodbye! Use /start to return.', {
      reply_markup: { remove_keyboard: true }
    });
  } catch (error) {
    console.error('Leave error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
});

// Callback queries
bot.on('callback_query', async (ctx) => {
  try {
    const data = ctx.callbackQuery.data;
    console.log('🔘 Callback received:', data);
    
    if (data === 'back_main') {
      await ctx.editMessageText('🎯 *Main Menu*', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Buy Voucher', callback_data: 'buy' }],
            [{ text: '🔁 Recover', callback_data: 'recover' }]
          ]
        }
      });
    } else if (data.startsWith('buy_')) {
      const amount = data.split('_')[1];
      await ctx.editMessageText(
        `💰 *Payment for ₹${amount}*\n\n` +
        `QR Code: [Click here](${process.env.QR_IMAGE})\n\n` +
        `Send screenshot after payment.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ I Have Paid', callback_data: `paid_${amount}` }],
              [{ text: '↩️ Back', callback_data: 'back_main' }]
            ]
          }
        }
      );
    }
    
    await ctx.answerCbQuery();
  } catch (error) {
    console.error('Callback error:', error);
    await ctx.answerCbQuery('❌ Error occurred');
  }
});

// Handle all text messages
bot.on('text', async (ctx) => {
  try {
    const text = ctx.message.text;
    console.log('📝 Text received:', text);
    
    // যদি কোন হ্যান্ডলার না পায়
    await ctx.reply(
      '❓ Unknown command. Please use the buttons below:',
      {
        reply_markup: {
          keyboard: [
            [{ text: '🛒 Buy Voucher' }, { text: '🔁 Recover Vouchers' }],
            [{ text: '📦 My Orders' }, { text: '📜 Disclaimer' }],
            [{ text: '🆘 Support' }]
          ],
          resize_keyboard: true
        }
      }
    );
  } catch (error) {
    console.error('Text handler error:', error);
  }
});

// Handle photos
bot.on('photo', async (ctx) => {
  try {
    console.log('📸 Photo received');
    await ctx.reply('✅ Screenshot received! Now send your UTR number.');
  } catch (error) {
    console.error('Photo error:', error);
  }
});

// Error handler
bot.catch((err, ctx) => {
  console.error('🔥 Bot error:', err);
  ctx.reply('An error occurred. Please try again later.').catch(() => {});
});

// Start bot
bot.launch().then(() => {
  console.log('🤖 Bot started successfully!');
  console.log('Bot username:', bot.botInfo?.username);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
