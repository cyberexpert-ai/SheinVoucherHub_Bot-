/**
 * Recover Voucher Handler
 */

const db = require('../../database/database');
const { Markup } = require('telegraf');
const moment = require('moment');

// Store recovery sessions
const recoverySessions = new Map();

module.exports = async (ctx) => {
  try {
    const userId = ctx.from.id;
    recoverySessions.delete(userId);
    
    recoverySessions.set(userId, { 
      waitingForOrderId: true,
      timestamp: Date.now()
    });
    
    await ctx.reply(
      '🔁 *RECOVER VOUCHERS*\n\n' +
      'Send your Order ID to recover your vouchers.\n\n' +
      'Format: `SVH-XXXXXXX-XXXXXX`\n' +
      'Example: `SVH-1234567890-ABC123`\n\n' +
      '⚠️ Recovery available for 2 hours only.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{ text: '↩️ Back' }]],
          resize_keyboard: true
        }
      }
    );
    
  } catch (error) {
    console.error('Recover voucher error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};

// Export sessions
module.exports.recoverySessions = recoverySessions;
