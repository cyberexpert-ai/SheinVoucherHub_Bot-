const db = require('../database/database');
const { Markup } = require('telegraf');
const moment = require('moment');

class OrderManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Show order management panel
   */
  async showPanel(ctx) {
    const pending = await db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    const success = await db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'success'");
    const rejected = await db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'rejected'");
    const expired = await db.query("SELECT COUNT(*) as count FROM orders WHERE status = 'expired'");
    
    const message = 
      `📊 *Order Manager*\n\n` +
      `📈 *Statistics*\n` +
      `• ⏳ Pending: ${pending[0].count}\n` +
      `• ✅ Success: ${success[0].count}\n` +
      `• ❌ Rejected: ${rejected[0].count}\n` +
      `• ⌛ Expired: ${expired[0].count}\n\n` +
      `Select an option:`;
    
    const buttons = [
      [Markup.button.callback('⏳ View Pending Orders', 'order_pending')],
      [Markup.button.callback('✅ View Success Orders', 'order_success')],
      [Markup.button.callback('❌ View Rejected Orders', 'order_rejected')],
      [Markup.button.callback('🔍 Search Order', 'order_search')],
      [Markup.button.callback('📊 Today\'s Orders', 'order_today')],
      [Markup.button.callback('💰 Revenue Report', 'order_revenue')],
      [Markup.button.callback('↩️ Back to Admin', 'admin_back')]
    ];
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Show pending orders
   */
  async showPending(ctx) {
    const orders = await db.query(
      "SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 20"
    );
    
    if (orders.length === 0) {
      await ctx.editMessageText('✅ No pending orders!');
      return;
    }
    
    let message = '⏳ *Pending Orders*\n\n';
    
    orders.forEach(order => {
      message += 
        `• *${order.order_id}*\n` +
        `  User: \`${order.user_id}\`\n` +
        `  ${order.category_name} x${order.quantity}\n` +
        `  Amount: ₹${order.total_price}\n` +
        `  Time: ${moment(order.created_at).fromNow()}\n` +
        `  UTR: \`${order.utr_number || 'N/A'}\`\n\n`;
    });
    
    const buttons = orders.map(order => [
      Markup.button.callback(`📦 ${order.order_id}`, `order_view_${order.order_id}`)
    ]);
    buttons.push([Markup.button.callback('↩️ Back', 'order_back')]);
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * View single order
   */
  async viewOrder(ctx, orderId) {
    const order = await db.getOrder(orderId);
    if (!order) {
      await ctx.editMessageText('❌ Order not found');
      return;
    }
    
    const user = await db.getUser(order.user_id);
    const codes = order.status === 'success' ? await db.getDeliveredCodes(orderId) : [];
    
    let message = 
      `📦 *Order Details*\n\n` +
      `Order ID: \`${order.order_id}\`\n` +
      `User: ${user?.first_name || ''} (@${user?.username || 'N/A'})\n` +
      `User ID: \`${order.user_id}\`\n` +
      `Category: ${order.category_name}\n` +
      `Quantity: ${order.quantity}\n` +
      `Amount: ₹${order.total_price}\n` +
      `UTR: \`${order.utr_number || 'N/A'}\`\n` +
      `Status: ${this.getStatusEmoji(order.status)} ${order.status.toUpperCase()}\n` +
      `Created: ${moment(order.created_at).format('DD/MM/YYYY HH:mm')}\n` +
      `Expires: ${moment(order.expires_at).format('DD/MM/YYYY HH:mm')}\n`;
    
    if (order.status === 'success' && codes.length > 0) {
      message += '\n🔑 *Voucher Codes*\n';
      codes.forEach((code, i) => {
        message += `${i+1}. \`${code}\`\n`;
      });
    }
    
    if (order.admin_note) {
      message += `\n📝 Note: ${order.admin_note}\n`;
    }
    
    const buttons = [];
    
    if (order.status === 'pending') {
      buttons.push([
        Markup.button.callback('✅ Accept', `order_accept_${orderId}`),
        Markup.button.callback('❌ Reject', `order_reject_${orderId}`)
      ]);
    }
    
    buttons.push([
      Markup.button.callback('👤 View User', `user_view_${order.user_id}`),
      Markup.button.callback('🔨 Block UTR', `order_block_utr_${order.utr_number}`)
    ]);
    
    if (order.status === 'success') {
      buttons.push([Markup.button.callback('📋 Resend Codes', `order_resend_${orderId}`)]);
    }
    
    buttons.push([Markup.button.callback('↩️ Back', 'order_back')]);
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Accept order
   */
  async acceptOrder(ctx, orderId) {
    try {
      const order = await db.getOrder(orderId);
      if (!order) {
        await ctx.answerCbQuery('❌ Order not found');
        return;
      }
      
      if (order.status !== 'pending') {
        await ctx.answerCbQuery('❌ Order already processed');
        return;
      }
      
      // Check stock
      const stock = await db.getAvailableStock(order.category_id);
      if (stock < order.quantity) {
        await ctx.answerCbQuery(`❌ Insufficient stock! Available: ${stock}`, { alert: true });
        return;
      }
      
      // Deliver order
      const codes = await db.deliverOrder(orderId, ctx.from.id);
      
      if (!codes) {
        await ctx.answerCbQuery('❌ Failed to deliver order', { alert: true });
        return;
      }
      
      // Send codes to user
      let userMessage = `✅ *Order Approved!*\n\nOrder ID: \`${orderId}\`\n\n`;
      codes.forEach((code, index) => {
        userMessage += `🔑 Code ${index + 1}: \`${code}\`\n`;
      });
      
      await ctx.telegram.sendMessage(order.user_id, userMessage, { parse_mode: 'Markdown' });
      
      // Send notification to channel
      const user = await db.getUser(order.user_id);
      const channelMessage = 
        `🎯 𝗡𝗲𝘄 𝗢𝗿𝗱𝗲𝗿 𝗦𝘂𝗯𝗺𝗶𝘁𝘁𝗲𝗱\n` +
        `━━━━━━━━━━━•❈•━━━━━━━━━━━\n` +
        `╰➤👤 𝗨𝗦𝗘𝗥 𝗡𝗔𝗠𝗘 : ${user?.first_name || ''} ${user?.last_name || ''}\n` +
        `╰➤🆔 𝗨𝗦𝗘𝗥 𝗜𝗗 : \`${order.user_id}\`\n` +
        `╰➤📡 𝗦𝗧𝗔𝗧𝗨𝗦: ✅ Success\n` +
        `╰➤ 🔰𝗤𝗨𝗔𝗟𝗜𝗧𝗬: High 📶\n` +
        `╰➤ 📦𝗧𝗢𝗧𝗔𝗟 𝗤𝗨𝗔𝗡𝗧𝗜𝗧𝗬 : ${order.quantity}\n` +
        `╰➤ 💳𝗖𝗢𝗦𝗧 : ₹${order.total_price}\n\n` +
        `🤖𝗕𝗢𝗧 𝗡𝗔𝗠𝗘 : @SheinVoucherHub_Bot\n` +
        `━━━━━━━━━━━•❈•━━━━━━━━━━━`;
      
      await ctx.telegram.sendMessage(process.env.CHANNEL_2_ID, channelMessage, { parse_mode: 'Markdown' });
      
      await ctx.answerCbQuery('✅ Order accepted and delivered');
      
      // Show updated order
      await this.viewOrder(ctx, orderId);
      
    } catch (error) {
      console.error('Accept order error:', error);
      await ctx.answerCbQuery('❌ Error accepting order', { alert: true });
    }
  }

  /**
   * Reject order
   */
  async rejectOrder(ctx, orderId) {
    this.sessions.set(ctx.from.id, { 
      action: 'rejecting_order',
      orderId 
    });
    
    await ctx.editMessageText(
      `❌ *Reject Order*\n\n` +
      `Order: \`${orderId}\`\n\n` +
      'Please enter rejection reason:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', `order_view_${orderId}`)]
        ]).reply_markup
      }
    );
  }

  /**
   * Process rejection
   */
  async processRejection(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'rejecting_order') return false;
      
      const orderId = session.orderId;
      const order = await db.getOrder(orderId);
      
      if (!order) {
        await ctx.reply('❌ Order not found');
        return true;
      }
      
      // Update order status
      await db.updateOrderStatus(orderId, 'rejected', text);
      
      // Block UTR if fake payment
      if (text.toLowerCase().includes('fake') || text.toLowerCase().includes('fraud')) {
        await db.blockUTR(order.utr_number, text, ctx.from.id);
      }
      
      // Notify user
      await ctx.telegram.sendMessage(order.user_id,
        `❌ *Order Rejected*\n\n` +
        `Order ID: \`${orderId}\`\n` +
        `Reason: ${text}\n\n` +
        `Contact support if you have questions.`,
        { parse_mode: 'Markdown' }
      );
      
      await ctx.reply(`✅ Order ${orderId} rejected successfully`);
      
      // Show pending orders
      await this.showPending(ctx);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Rejection error:', error);
      await ctx.reply('❌ Error rejecting order');
      return true;
    }
  }

  /**
   * Block UTR
   */
  async blockUTR(ctx, utr) {
    this.sessions.set(ctx.from.id, { 
      action: 'blocking_utr',
      utr 
    });
    
    await ctx.editMessageText(
      `🔨 *Block UTR*\n\n` +
      `UTR: \`${utr}\`\n\n` +
      'Enter reason for blocking:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', 'order_back')]
        ]).reply_markup
      }
    );
  }

  /**
   * Process UTR block
   */
  async processBlockUTR(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'blocking_utr') return false;
      
      await db.blockUTR(session.utr, text, ctx.from.id);
      
      await ctx.reply(`✅ UTR \`${session.utr}\` blocked successfully`, {
        parse_mode: 'Markdown'
      });
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Block UTR error:', error);
      await ctx.reply('❌ Error blocking UTR');
      return true;
    }
  }

  /**
   * Search orders
   */
  async searchOrders(ctx) {
    this.sessions.set(ctx.from.id, { action: 'searching_order' });
    
    await ctx.editMessageText(
      '🔍 *Search Orders*\n\n' +
      'Enter Order ID or User ID to search:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', 'order_back')]
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
      if (!session || session.action !== 'searching_order') return false;
      
      // Search by order ID
      let orders = await db.query(
        'SELECT * FROM orders WHERE order_id LIKE ? OR user_id LIKE ? ORDER BY created_at DESC LIMIT 10',
        [`%${text}%`, `%${text}%`]
      );
      
      if (orders.length === 0) {
        await ctx.reply('❌ No orders found');
        return true;
      }
      
      let message = '🔍 *Search Results*\n\n';
      orders.forEach(order => {
        message += 
          `• *${order.order_id}*\n` +
          `  User: \`${order.user_id}\`\n` +
          `  ${order.category_name} x${order.quantity} | ₹${order.total_price}\n` +
          `  Status: ${this.getStatusEmoji(order.status)} ${order.status}\n` +
          `  ${moment(order.created_at).fromNow()}\n\n`;
      });
      
      const buttons = orders.map(order => [
        Markup.button.callback(`📦 ${order.order_id}`, `order_view_${order.order_id}`)
      ]);
      buttons.push([Markup.button.callback('❌ Close', 'order_back')]);
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Search error:', error);
      await ctx.reply('❌ Error searching orders');
      return true;
    }
  }

  /**
   * Show today's orders
   */
  async showToday(ctx) {
    const today = moment().format('YYYY-MM-DD');
    const orders = await db.query(
      'SELECT * FROM orders WHERE DATE(created_at) = ? ORDER BY created_at DESC',
      [today]
    );
    
    if (orders.length === 0) {
      await ctx.editMessageText('📊 No orders today');
      return;
    }
    
    const total = orders.reduce((sum, o) => sum + o.total_price, 0);
    const success = orders.filter(o => o.status === 'success');
    const pending = orders.filter(o => o.status === 'pending');
    const successTotal = success.reduce((sum, o) => sum + o.total_price, 0);
    
    let message = 
      `📊 *Today's Orders (${moment().format('DD/MM/YYYY')})*\n\n` +
      `Total Orders: ${orders.length}\n` +
      `✅ Success: ${success.length}\n` +
      `⏳ Pending: ${pending.length}\n` +
      `💰 Total Revenue: ₹${total}\n` +
      `💰 Success Revenue: ₹${successTotal}\n\n`;
    
    orders.slice(0, 10).forEach(order => {
      message += 
        `• ${this.getStatusEmoji(order.status)} \`${order.order_id}\`\n` +
        `  ${order.category_name} x${order.quantity} | ₹${order.total_price}\n`;
    });
    
    if (orders.length > 10) {
      message += `\n... and ${orders.length - 10} more orders`;
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('↩️ Back', 'order_back')]
      ]).reply_markup
    });
  }

  /**
   * Show revenue report
   */
  async showRevenue(ctx) {
    // Daily revenue for last 7 days
    const daily = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(CASE WHEN status = 'success' THEN total_price ELSE 0 END) as revenue,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    // Total stats
    const total = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'success' THEN total_price ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as total_success
      FROM orders
    `);
    
    let message = 
      `💰 *Revenue Report*\n\n` +
      `📊 *Overall*\n` +
      `Total Orders: ${total[0].total_orders}\n` +
      `Success Orders: ${total[0].total_success}\n` +
      `Total Revenue: ₹${total[0].total_revenue || 0}\n\n` +
      `📈 *Last 7 Days*\n`;
    
    daily.forEach(day => {
      message += 
        `• ${moment(day.date).format('DD/MM')}: ` +
        `${day.orders} orders | ₹${day.revenue || 0}\n`;
    });
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('📊 Detailed Report', 'order_detailed')],
        [Markup.button.callback('↩️ Back', 'order_back')]
      ]).reply_markup
    });
  }

  /**
   * Resend codes
   */
  async resendCodes(ctx, orderId) {
    try {
      const order = await db.getOrder(orderId);
      if (!order || order.status !== 'success') {
        await ctx.answerCbQuery('❌ Cannot resend codes for this order');
        return;
      }
      
      const codes = await db.getDeliveredCodes(orderId);
      if (!codes || codes.length === 0) {
        await ctx.answerCbQuery('❌ No codes found');
        return;
      }
      
      let message = `✅ *Codes Resent*\n\nOrder ID: \`${orderId}\`\n\n`;
      codes.forEach((code, i) => {
        message += `${i+1}. \`${code}\`\n`;
      });
      
      await ctx.telegram.sendMessage(order.user_id, message, { parse_mode: 'Markdown' });
      await ctx.answerCbQuery('✅ Codes resent to user');
      
    } catch (error) {
      console.error('Resend error:', error);
      await ctx.answerCbQuery('❌ Error resending codes');
    }
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

module.exports = new OrderManager();
