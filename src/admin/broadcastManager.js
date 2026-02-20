const db = require('../database/database');
const { Markup } = require('telegraf');

class BroadcastManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Show broadcast panel
   */
  async showPanel(ctx) {
    const message = 
      '📢 *Broadcast Manager*\n\n' +
      'Send messages to all users or specific groups.\n\n' +
      'Select target audience:';
    
    const buttons = [
      [Markup.button.callback('👥 All Users', 'broadcast_all')],
      [Markup.button.callback('✅ Active Users', 'broadcast_active')],
      [Markup.button.callback('🔴 Blocked Users', 'broadcast_blocked')],
      [Markup.button.callback('📊 View History', 'broadcast_history')],
      [Markup.button.callback('↩️ Back to Admin', 'admin_back')]
    ];
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Start broadcast
   */
  async startBroadcast(ctx, target) {
    this.sessions.set(ctx.from.id, { 
      action: 'broadcasting',
      target,
      step: 'message'
    });
    
    const targetNames = {
      'all': 'All Users',
      'active': 'Active Users',
      'blocked': 'Blocked Users'
    };
    
    await ctx.editMessageText(
      `📢 *Send Broadcast*\n\n` +
      `Target: ${targetNames[target]}\n\n` +
      `Send the message you want to broadcast.\n` +
      `You can send text, photo, or video.`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', 'broadcast_cancel')]
        ]).reply_markup
      }
    );
  }

  /**
   * Process broadcast message
   */
  async processBroadcast(ctx, text, media) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'broadcasting') return false;
      
      // Store message
      session.message = text;
      session.media = media;
      session.step = 'confirm';
      this.sessions.set(ctx.from.id, session);
      
      const targetNames = {
        'all': 'All Users',
        'active': 'Active Users',
        'blocked': 'Blocked Users'
      };
      
      let preview = `📢 *Broadcast Preview*\n\n`;
      preview += `Target: ${targetNames[session.target]}\n`;
      preview += `Message:\n---\n${text || 'Media message'}\n---\n\n`;
      preview += `Confirm to send?`;
      
      await ctx.reply(preview, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Confirm', 'broadcast_confirm'),
            Markup.button.callback('❌ Cancel', 'broadcast_cancel')
          ]
        ]).reply_markup
      });
      
      return true;
      
    } catch (error) {
      console.error('Broadcast process error:', error);
      await ctx.reply('❌ Error processing broadcast');
      return true;
    }
  }

  /**
   * Confirm and send broadcast
   */
  async confirmBroadcast(ctx) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'broadcasting') {
        await ctx.answerCbQuery('❌ No broadcast session');
        return;
      }
      
      await ctx.answerCbQuery('📢 Sending broadcast...');
      
      // Get target users
      let users = [];
      if (session.target === 'all') {
        users = await db.getAllUsers();
      } else if (session.target === 'active') {
        users = await db.query(
          'SELECT * FROM users WHERE last_active > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
        );
      } else if (session.target === 'blocked') {
        users = await db.getBlockedUsers();
      }
      
      if (users.length === 0) {
        await ctx.editMessageText('❌ No users to send broadcast');
        this.sessions.delete(ctx.from.id);
        return;
      }
      
      await ctx.editMessageText(`📢 Sending to ${users.length} users...`);
      
      let sent = 0;
      let failed = 0;
      
      // Send to each user
      for (const user of users) {
        try {
          if (session.media) {
            // Send with media
            if (session.media.type === 'photo') {
              await ctx.telegram.sendPhoto(user.telegram_id, session.media.file_id, {
                caption: session.message,
                parse_mode: 'Markdown'
              });
            } else if (session.media.type === 'video') {
              await ctx.telegram.sendVideo(user.telegram_id, session.media.file_id, {
                caption: session.message,
                parse_mode: 'Markdown'
              });
            }
          } else {
            // Text only
            await ctx.telegram.sendMessage(user.telegram_id, session.message, {
              parse_mode: 'Markdown'
            });
          }
          sent++;
        } catch (e) {
          failed++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Save broadcast record
      await db.query(
        `INSERT INTO broadcast_messages 
         (message_text, file_id, target, sent_count, failed_count, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          session.message || 'Media message',
          session.media?.file_id || null,
          session.target,
          sent,
          failed,
          ctx.from.id
        ]
      );
      
      await ctx.reply(
        `✅ *Broadcast Complete*\n\n` +
        `Target: ${users.length} users\n` +
        `✅ Sent: ${sent}\n` +
        `❌ Failed: ${failed}`,
        { parse_mode: 'Markdown' }
      );
      
      this.sessions.delete(ctx.from.id);
      
    } catch (error) {
      console.error('Broadcast confirm error:', error);
      await ctx.editMessageText('❌ Error sending broadcast');
      this.sessions.delete(ctx.from.id);
    }
  }

  /**
   * Show broadcast history
   */
  async showHistory(ctx) {
    const broadcasts = await db.query(
      'SELECT * FROM broadcast_messages ORDER BY created_at DESC LIMIT 10'
    );
    
    if (broadcasts.length === 0) {
      await ctx.editMessageText('📢 No broadcast history');
      return;
    }
    
    let message = '📢 *Broadcast History*\n\n';
    
    broadcasts.forEach((b, i) => {
      const targetNames = {
        'all': 'All',
        'active': 'Active',
        'blocked': 'Blocked'
      };
      
      message += 
        `${i+1}. *${moment(b.created_at).format('DD/MM HH:mm')}*\n` +
        `   Target: ${targetNames[b.target] || b.target}\n` +
        `   Sent: ${b.sent_count} | Failed: ${b.failed_count}\n` +
        `   Message: ${b.message_text?.substring(0, 50)}${b.message_text?.length > 50 ? '...' : ''}\n\n`;
    });
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('↩️ Back', 'broadcast_back')]
      ]).reply_markup
    });
  }

  /**
   * Handle cancel
   */
  async handleCancel(ctx) {
    this.sessions.delete(ctx.from.id);
    await this.showPanel(ctx);
  }

  /**
   * Handle back
   */
  async handleBack(ctx) {
    await this.showPanel(ctx);
  }
}

module.exports = new BroadcastManager();
