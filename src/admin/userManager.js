const db = require('../database/database');
const { Markup } = require('telegraf');
const moment = require('moment');

class UserManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Show user management panel
   */
  async showPanel(ctx) {
    const stats = await db.getStats();
    const blocked = await db.getBlockedUsers();
    
    const message = 
      `👥 *User Manager*\n\n` +
      `📊 *Statistics*\n` +
      `• Total Users: ${stats.totalUsers}\n` +
      `• Active Today: ${stats.activeUsers}\n` +
      `• Blocked Users: ${blocked.length}\n\n` +
      `Select an option:`;
    
    const buttons = [
      [Markup.button.callback('🔍 Search User', 'user_search')],
      [Markup.button.callback('🔨 Blocked Users', 'user_blocked')],
      [Markup.button.callback('📊 User Stats', 'user_stats')],
      [Markup.button.callback('📝 Message User', 'user_message')],
      [Markup.button.callback('📈 Top Users', 'user_top')],
      [Markup.button.callback('📋 List Users', 'user_list')],
      [Markup.button.callback('↩️ Back to Admin', 'admin_back')]
    ];
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Handle search user
   */
  async handleSearch(ctx) {
    this.sessions.set(ctx.from.id, { action: 'searching_user' });
    
    await ctx.editMessageText(
      '🔍 *Search User*\n\n' +
      'Enter User ID, Username, or Name:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', 'user_cancel')]
        ]).reply_markup
      }
    );
  }

  /**
   * Process search
   */
  async processSearch(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'searching_user') return false;
      
      const searchTerm = `%${text}%`;
      
      const users = await db.query(
        `SELECT * FROM users 
         WHERE telegram_id LIKE ? 
         OR username LIKE ? 
         OR first_name LIKE ? 
         OR last_name LIKE ?
         LIMIT 10`,
        [searchTerm, searchTerm, searchTerm, searchTerm]
      );
      
      if (users.length === 0) {
        await ctx.reply('❌ No users found');
        return true;
      }
      
      let message = '🔍 *Search Results*\n\n';
      users.forEach(user => {
        message += 
          `• ID: \`${user.telegram_id}\`\n` +
          `  Name: ${user.first_name || ''} ${user.last_name || ''}\n` +
          `  Username: @${user.username || 'N/A'}\n` +
          `  Orders: ${user.total_orders}\n` +
          `  Status: ${user.is_blocked ? '🔴 Blocked' : '🟢 Active'}\n\n`;
      });
      
      await ctx.reply(message, { parse_mode: 'Markdown' });
      
      // Show user options for each
      const buttons = users.map(user => [
        Markup.button.callback(
          `👤 ${user.first_name || user.telegram_id}`, 
          `user_view_${user.telegram_id}`
        )
      ]);
      buttons.push([Markup.button.callback('❌ Close', 'user_cancel')]);
      
      await ctx.reply('Select user to manage:', {
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Search error:', error);
      await ctx.reply('❌ Error searching users');
      return true;
    }
  }

  /**
   * Show user details
   */
  async showUserDetails(ctx, userId) {
    const user = await db.getUser(userId);
    if (!user) {
      await ctx.editMessageText('❌ User not found');
      return;
    }
    
    const orders = await db.getUserOrders(userId, 5);
    
    let message = 
      `👤 *User Details*\n\n` +
      `ID: \`${user.telegram_id}\`\n` +
      `Name: ${user.first_name || ''} ${user.last_name || ''}\n` +
      `Username: @${user.username || 'N/A'}\n` +
      `Joined: ${moment(user.joined_at).format('DD/MM/YYYY')}\n` +
      `Last Active: ${moment(user.last_active).fromNow()}\n` +
      `Status: ${user.is_blocked ? '🔴 Blocked' : '🟢 Active'}\n`;
    
    if (user.is_blocked) {
      message += `Block Reason: ${user.block_reason || 'No reason'}\n`;
      if (user.block_until) {
        message += `Block Until: ${moment(user.block_until).format('DD/MM/YYYY HH:mm')}\n`;
      }
    }
    
    message += 
      `\n📊 *Statistics*\n` +
      `Total Orders: ${user.total_orders}\n` +
      `Total Spent: ₹${user.total_spent || 0}\n\n`;
    
    if (orders.length > 0) {
      message += '📦 *Recent Orders*\n';
      orders.forEach(order => {
        message += 
          `• \`${order.order_id}\`\n` +
          `  ${order.category_name} x${order.quantity} | ₹${order.total_price}\n` +
          `  Status: ${this.getStatusEmoji(order.status)} ${order.status}\n`;
      });
    } else {
      message += '📦 No orders yet';
    }
    
    const buttons = [];
    
    if (user.is_blocked) {
      buttons.push([Markup.button.callback('✅ Unblock User', `user_unblock_${userId}`)]);
    } else {
      buttons.push([
        Markup.button.callback('🔨 Block User', `user_block_${userId}`),
        Markup.button.callback('⏱ Temp Block', `user_tempblock_${userId}`)
      ]);
    }
    
    buttons.push([
      Markup.button.callback('📝 Message User', `user_message_${userId}`),
      Markup.button.callback('📦 View Orders', `user_orders_${userId}`)
    ]);
    
    buttons.push([Markup.button.callback('↩️ Back', 'user_back')]);
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Block user
   */
  async blockUser(ctx, userId) {
    this.sessions.set(ctx.from.id, { 
      action: 'blocking_user',
      targetUserId: userId
    });
    
    await ctx.editMessageText(
      `🔨 *Block User*\n\n` +
      `User ID: \`${userId}\`\n\n` +
      'Enter block reason:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', `user_view_${userId}`)]
        ]).reply_markup
      }
    );
  }

  /**
   * Process block
   */
  async processBlock(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'blocking_user') return false;
      
      await db.blockUser(session.targetUserId, text);
      
      await ctx.reply(`✅ User \`${session.targetUserId}\` blocked successfully`, {
        parse_mode: 'Markdown'
      });
      
      // Show user details again
      await this.showUserDetails(ctx, session.targetUserId);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Block error:', error);
      await ctx.reply('❌ Error blocking user');
      return true;
    }
  }

  /**
   * Temp block user
   */
  async tempBlockUser(ctx, userId) {
    this.sessions.set(ctx.from.id, { 
      action: 'tempblock_user',
      targetUserId: userId
    });
    
    await ctx.editMessageText(
      `⏱ *Temporary Block*\n\n` +
      `User ID: \`${userId}\`\n\n` +
      'Enter: `reason minutes`\n' +
      'Example: `Spam 30`',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', `user_view_${userId}`)]
        ]).reply_markup
      }
    );
  }

  /**
   * Process temp block
   */
  async processTempBlock(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'tempblock_user') return false;
      
      const parts = text.split(' ');
      const minutes = parseInt(parts.pop());
      const reason = parts.join(' ');
      
      if (isNaN(minutes) || minutes < 1) {
        await ctx.reply('❌ Invalid minutes. Please enter a valid number.');
        return true;
      }
      
      await db.blockUser(session.targetUserId, reason, minutes);
      
      await ctx.reply(
        `✅ User \`${session.targetUserId}\` temporarily blocked\n` +
        `Duration: ${minutes} minutes\n` +
        `Reason: ${reason}`,
        { parse_mode: 'Markdown' }
      );
      
      // Show user details again
      await this.showUserDetails(ctx, session.targetUserId);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Temp block error:', error);
      await ctx.reply('❌ Error temporarily blocking user');
      return true;
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(ctx, userId) {
    try {
      await db.unblockUser(userId);
      
      await ctx.answerCbQuery('✅ User unblocked');
      
      // Show user details again
      await this.showUserDetails(ctx, userId);
      
    } catch (error) {
      console.error('Unblock error:', error);
      await ctx.answerCbQuery('❌ Error unblocking user');
    }
  }

  /**
   * Message user
   */
  async messageUser(ctx, userId) {
    this.sessions.set(ctx.from.id, { 
      action: 'messaging_user',
      targetUserId: userId
    });
    
    await ctx.editMessageText(
      `📝 *Message User*\n\n` +
      `User ID: \`${userId}\`\n\n` +
      'Enter your message:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', `user_view_${userId}`)]
        ]).reply_markup
      }
    );
  }

  /**
   * Process message
   */
  async processMessage(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'messaging_user') return false;
      
      await ctx.telegram.sendMessage(session.targetUserId,
        `📝 *Message from Admin*\n\n${text}`,
        { parse_mode: 'Markdown' }
      );
      
      await ctx.reply(`✅ Message sent to user \`${session.targetUserId}\``, {
        parse_mode: 'Markdown'
      });
      
      // Show user details again
      await this.showUserDetails(ctx, session.targetUserId);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Message error:', error);
      await ctx.reply('❌ Error sending message. User may have blocked the bot.');
      return true;
    }
  }

  /**
   * Show blocked users
   */
  async showBlocked(ctx) {
    const blocked = await db.getBlockedUsers();
    
    if (blocked.length === 0) {
      await ctx.editMessageText('✅ No blocked users');
      return;
    }
    
    let message = '🔨 *Blocked Users*\n\n';
    
    blocked.forEach(user => {
      message += 
        `• ID: \`${user.telegram_id}\`\n` +
        `  Name: ${user.first_name || ''}\n` +
        `  Reason: ${user.block_reason || 'No reason'}\n`;
      if (user.block_until) {
        message += `  Until: ${moment(user.block_until).format('DD/MM/YYYY HH:mm')}\n`;
      }
      message += '\n';
    });
    
    const buttons = blocked.map(user => [
      Markup.button.callback(`👤 ${user.telegram_id}`, `user_view_${user.telegram_id}`)
    ]);
    buttons.push([Markup.button.callback('↩️ Back', 'user_back')]);
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Show top users
   */
  async showTopUsers(ctx) {
    const users = await db.query(
      'SELECT * FROM users ORDER BY total_orders DESC, total_spent DESC LIMIT 10'
    );
    
    let message = '📈 *Top Users*\n\n';
    
    users.forEach((user, index) => {
      message += 
        `${index+1}. ${user.first_name || ''} (@${user.username || 'N/A'})\n` +
        `   Orders: ${user.total_orders} | Spent: ₹${user.total_spent || 0}\n\n`;
    });
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('↩️ Back', 'user_back')]
      ]).reply_markup
    });
  }

  /**
   * Show user list
   */
  async showUserList(ctx, page = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;
    
    const users = await db.query(
      'SELECT * FROM users ORDER BY joined_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    const total = await db.query('SELECT COUNT(*) as count FROM users');
    
    let message = `📋 *User List (Page ${page})*\n\n`;
    
    users.forEach(user => {
      message += 
        `• ID: \`${user.telegram_id}\`\n` +
        `  Name: ${user.first_name || ''} ${user.last_name || ''}\n` +
        `  Joined: ${moment(user.joined_at).format('DD/MM/YYYY')}\n` +
        `  Status: ${user.is_blocked ? '🔴' : '🟢'}\n\n`;
    });
    
    message += `Total: ${total[0].count} users`;
    
    const buttons = [];
    const navButtons = [];
    
    if (page > 1) {
      navButtons.push(Markup.button.callback('◀️ Prev', `user_list_${page - 1}`));
    }
    if (offset + limit < total[0].count) {
      navButtons.push(Markup.button.callback('Next ▶️', `user_list_${page + 1}`));
    }
    
    if (navButtons.length > 0) {
      buttons.push(navButtons);
    }
    
    buttons.push([Markup.button.callback('↩️ Back', 'user_back')]);
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Show user orders
   */
  async showUserOrders(ctx, userId) {
    const orders = await db.getUserOrders(userId, 10);
    
    if (orders.length === 0) {
      await ctx.editMessageText('📦 User has no orders');
      return;
    }
    
    let message = `📦 *User Orders*\n\nUser ID: \`${userId}\`\n\n`;
    
    orders.forEach(order => {
      message += 
        `• \`${order.order_id}\`\n` +
        `  ${order.category_name} x${order.quantity} | ₹${order.total_price}\n` +
        `  Status: ${this.getStatusEmoji(order.status)} ${order.status}\n` +
        `  ${moment(order.created_at).format('DD/MM/YYYY HH:mm')}\n\n`;
    });
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('↩️ Back', `user_view_${userId}`)]
      ]).reply_markup
    });
  }

  /**
   * Get status emoji
   */
  getStatusEmoji(status) {
    const emojis = {
      'pending': '⏳',
      'success': '✅',
      'rejected': '❌',
      'expired': '⌛'
    };
    return emojis[status] || '📦';
  }

  /**
   * Handle back
   */
  async handleBack(ctx) {
    await this.showPanel(ctx);
  }

  /**
   * Handle cancel
   */
  async handleCancel(ctx) {
    this.sessions.delete(ctx.from.id);
    await this.showPanel(ctx);
  }
}

module.exports = new UserManager();
