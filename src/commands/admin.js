const db = require('../database/database');
const { Markup } = require('telegraf');
const moment = require('moment');

// Admin ID from env
const ADMIN_ID = parseInt(process.env.ADMIN_ID);

// Admin sessions
const adminSessions = new Map();

module.exports = async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Check if user is admin
    if (userId !== ADMIN_ID) {
      return ctx.reply('⛔ Unauthorized access');
    }
    
    // Show admin panel
    const stats = await db.getStats();
    
    const adminMessage = 
      `👑 *Admin Panel*\n\n` +
      `📊 *Statistics*\n` +
      `• Total Users: ${stats.totalUsers}\n` +
      `• Active Users (24h): ${stats.activeUsers}\n` +
      `• Total Orders: ${stats.totalOrders}\n` +
      `   ✅ Success: ${stats.successOrders}\n` +
      `   ⏳ Pending: ${stats.pendingOrders}\n` +
      `   ❌ Rejected: ${stats.rejectedOrders}\n` +
      `• Total Revenue: ₹${stats.totalRevenue}\n` +
      `• Total Stock: ${stats.totalStock}\n\n` +
      `Select an option:`;
    
    const buttons = [
      [Markup.button.callback('📦 Category Manager', 'admin_categories')],
      [Markup.button.callback('🎟 Code Manager', 'admin_codes')],
      [Markup.button.callback('👥 User Manager', 'admin_users')],
      [Markup.button.callback('📢 Broadcast', 'admin_broadcast')],
      [Markup.button.callback('📊 Orders', 'admin_orders')],
      [Markup.button.callback('⚙️ Settings', 'admin_settings')],
      [Markup.button.callback('📈 Full Stats', 'admin_stats')],
      [Markup.button.callback('🆘 Support Tickets', 'admin_tickets')]
    ];
    
    await ctx.reply(adminMessage, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
    
  } catch (error) {
    console.error('Admin command error:', error);
    ctx.reply('An error occurred');
  }
};

// Handle admin callbacks
module.exports.handleCallback = async (ctx) => {
  try {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    
    if (userId !== ADMIN_ID) {
      return ctx.answerCbQuery('⛔ Unauthorized');
    }
    
    // Category Manager
    if (data === 'admin_categories') {
      const categories = await db.getCategories();
      
      let message = '📦 *Category Manager*\n\n';
      categories.forEach(cat => {
        message += `• ${cat.display_name}\n  Stock: ${cat.stock} | Active: ${cat.is_active ? '✅' : '❌'}\n  ID: ${cat.id}\n\n`;
      });
      
      const buttons = [
        [Markup.button.callback('➕ Add Category', 'admin_add_category')],
        [Markup.button.callback('✏️ Edit Category', 'admin_edit_category')],
        [Markup.button.callback('🗑 Delete Category', 'admin_delete_category')],
        [Markup.button.callback('💰 Manage Prices', 'admin_manage_prices')],
        [Markup.button.callback('↩️ Back to Admin', 'admin_back')]
      ];
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      return;
    }
    
    // Add Category
    if (data === 'admin_add_category') {
      adminSessions.set(userId, { action: 'adding_category' });
      
      await ctx.editMessageText(
        '➕ *Add New Category*\n\n' +
        'Send category details in format:\n' +
        '`Name|Display Name|Initial Stock`\n\n' +
        'Example: `500|₹500 Shein Voucher|0`',
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ Cancel', 'admin_categories')]
          ]).reply_markup
        }
      );
      return;
    }
    
    // Code Manager
    if (data === 'admin_codes') {
      const categories = await db.getCategories();
      
      let message = '🎟 *Code Manager*\n\nSelect category:';
      
      const buttons = categories.map(cat => 
        [Markup.button.callback(cat.display_name, `admin_codes_cat_${cat.id}`)]
      );
      buttons.push([Markup.button.callback('↩️ Back', 'admin_back')]);
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      return;
    }
    
    // Code actions for specific category
    if (data.startsWith('admin_codes_cat_')) {
      const categoryId = data.split('_')[3];
      const category = await db.getCategory(categoryId);
      const stock = await db.getAvailableStock(categoryId);
      
      const message = 
        `🎟 *Code Manager - ${category.display_name}*\n\n` +
        `Available Stock: ${stock}\n\n` +
        `Choose action:`;
      
      const buttons = [
        [Markup.button.callback('➕ Add Single Code', `admin_add_code_${categoryId}`)],
        [Markup.button.callback('📦 Add Bulk Codes', `admin_bulk_codes_${categoryId}`)],
        [Markup.button.callback('📋 View Codes', `admin_view_codes_${categoryId}`)],
        [Markup.button.callback('🗑 Delete All Codes', `admin_delete_codes_${categoryId}`)],
        [Markup.button.callback('↩️ Back', 'admin_codes')]
      ];
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      return;
    }
    
    // Add single code
    if (data.startsWith('admin_add_code_')) {
      const categoryId = data.split('_')[3];
      adminSessions.set(userId, { action: 'adding_code', categoryId });
      
      await ctx.editMessageText(
        '✏️ Send the voucher code:',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ Cancel', `admin_codes_cat_${categoryId}`)]
          ]).reply_markup
        }
      );
      return;
    }
    
    // Bulk codes
    if (data.startsWith('admin_bulk_codes_')) {
      const categoryId = data.split('_')[3];
      adminSessions.set(userId, { action: 'adding_bulk_codes', categoryId });
      
      await ctx.editMessageText(
        '📦 *Add Bulk Codes*\n\n' +
        'Send codes separated by new lines:\n\n' +
        'Example:\n' +
        'CODE123\n' +
        'CODE456\n' +
        'CODE789',
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ Cancel', `admin_codes_cat_${categoryId}`)]
          ]).reply_markup
        }
      );
      return;
    }
    
    // User Manager
    if (data === 'admin_users') {
      const users = await db.getAllUsers();
      
      let message = '👥 *User Manager*\n\n';
      users.slice(0, 10).forEach(user => {
        message += `• ${user.first_name || 'No name'} (@${user.username || 'N/A'})\n`;
        message += `  ID: \`${user.telegram_id}\` | Orders: ${user.total_orders}\n\n`;
      });
      message += `Showing first 10 of ${users.length} users`;
      
      const buttons = [
        [Markup.button.callback('🔍 Search User', 'admin_search_user')],
        [Markup.button.callback('🔨 Blocked Users', 'admin_blocked_users')],
        [Markup.button.callback('📊 User Stats', 'admin_user_stats')],
        [Markup.button.callback('↩️ Back', 'admin_back')]
      ];
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      return;
    }
    
    // Broadcast
    if (data === 'admin_broadcast') {
      adminSessions.set(userId, { action: 'broadcast' });
      
      await ctx.editMessageText(
        '📢 *Broadcast Message*\n\n' +
        'Send the message you want to broadcast to all users.\n\n' +
        'You can also send a photo with caption.',
        {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ Cancel', 'admin_back')]
          ]).reply_markup
        }
      );
      return;
    }
    
    // Orders
    if (data === 'admin_orders') {
      const pending = await db.query(
        "SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10"
      );
      
      let message = '📊 *Pending Orders*\n\n';
      if (pending.length === 0) {
        message += 'No pending orders.';
      } else {
        pending.forEach(order => {
          message += 
            `• Order: \`${order.order_id}\`\n` +
            `  User: \`${order.user_id}\`\n` +
            `  ${order.category_name} | Qty ${order.quantity}\n` +
            `  ₹${order.total_price} | ${moment(order.created_at).fromNow()}\n\n`;
        });
      }
      
      const buttons = [
        [Markup.button.callback('✅ Success Orders', 'admin_success_orders')],
        [Markup.button.callback('❌ Rejected Orders', 'admin_rejected_orders')],
        [Markup.button.callback('🔍 Search Order', 'admin_search_order')],
        [Markup.button.callback('↩️ Back', 'admin_back')]
      ];
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      return;
    }
    
    // Settings
    if (data === 'admin_settings') {
      const recoveryHours = await db.getSetting('recovery_hours') || '2';
      
      const message = 
        '⚙️ *Settings*\n\n' +
        `Recovery Hours: ${recoveryHours}\n\n` +
        'Choose setting to update:';
      
      const buttons = [
        [Markup.button.callback('⏱ Recovery Hours', 'admin_set_recovery')],
        [Markup.button.callback('📝 Welcome Message', 'admin_set_welcome')],
        [Markup.button.callback('↩️ Back', 'admin_back')]
      ];
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      return;
    }
    
    // Stats
    if (data === 'admin_stats') {
      const stats = await db.getStats();
      
      const message = 
        '📈 *Full Statistics*\n\n' +
        `👥 **Users**\n` +
        `• Total: ${stats.totalUsers}\n` +
        `• Active (24h): ${stats.activeUsers}\n` +
        `• Blocked: ${stats.blockedUsers || 0}\n\n` +
        `📦 **Orders**\n` +
        `• Total: ${stats.totalOrders}\n` +
        `• Pending: ${stats.pendingOrders}\n` +
        `• Success: ${stats.successOrders}\n` +
        `• Rejected: ${stats.rejectedOrders}\n\n` +
        `💰 **Revenue**\n` +
        `• Total: ₹${stats.totalRevenue}\n` +
        `• Avg per order: ₹${stats.totalOrders ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : 0}\n\n` +
        `📊 **Stock**\n` +
        `• Total: ${stats.totalStock}`;
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('↩️ Back', 'admin_back')]
        ]).reply_markup
      });
      return;
    }
    
    // Support Tickets
    if (data === 'admin_tickets') {
      const tickets = await db.getSupportTickets('open');
      
      let message = '🆘 *Open Support Tickets*\n\n';
      if (tickets.length === 0) {
        message += 'No open tickets.';
      } else {
        tickets.forEach(ticket => {
          message += 
            `• Ticket: \`${ticket.ticket_id}\`\n` +
            `  User: ${ticket.first_name || ''} (@${ticket.username || 'N/A'})\n` +
            `  Message: ${ticket.message.substring(0, 50)}${ticket.message.length > 50 ? '...' : ''}\n` +
            `  ${moment(ticket.created_at).fromNow()}\n\n`;
        });
      }
      
      const buttons = [
        [Markup.button.callback('✅ Closed Tickets', 'admin_closed_tickets')],
        [Markup.button.callback('↩️ Back', 'admin_back')]
      ];
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      return;
    }
    
    // Back to admin main
    if (data === 'admin_back') {
      const stats = await db.getStats();
      
      const message = 
        `👑 *Admin Panel*\n\n` +
        `📊 *Statistics*\n` +
        `• Total Users: ${stats.totalUsers}\n` +
        `• Active Users (24h): ${stats.activeUsers}\n` +
        `• Total Orders: ${stats.totalOrders}\n` +
        `   ✅ Success: ${stats.successOrders}\n` +
        `   ⏳ Pending: ${stats.pendingOrders}\n` +
        `   ❌ Rejected: ${stats.rejectedOrders}\n` +
        `• Total Revenue: ₹${stats.totalRevenue}\n` +
        `• Total Stock: ${stats.totalStock}\n\n` +
        `Select an option:`;
      
      const buttons = [
        [Markup.button.callback('📦 Category Manager', 'admin_categories')],
        [Markup.button.callback('🎟 Code Manager', 'admin_codes')],
        [Markup.button.callback('👥 User Manager', 'admin_users')],
        [Markup.button.callback('📢 Broadcast', 'admin_broadcast')],
        [Markup.button.callback('📊 Orders', 'admin_orders')],
        [Markup.button.callback('⚙️ Settings', 'admin_settings')],
        [Markup.button.callback('📈 Full Stats', 'admin_stats')],
        [Markup.button.callback('🆘 Support Tickets', 'admin_tickets')]
      ];
      
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      });
      return;
    }
    
  } catch (error) {
    console.error('Admin callback error:', error);
    ctx.answerCbQuery('❌ Error');
  }
};

// Handle accept order
module.exports.handleAcceptOrder = async (ctx, orderId) => {
  try {
    const order = await db.getOrder(orderId);
    if (!order) {
      return ctx.answerCbQuery('Order not found', { alert: true });
    }
    
    // Deliver order
    const codes = await db.deliverOrder(orderId, ctx.from.id);
    
    if (!codes) {
      return ctx.answerCbQuery('Insufficient stock!', { alert: true });
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
      `╰➤👤 𝗨𝗦𝗘𝗥 𝗡𝗔𝗠𝗘 : ${user.first_name || ''} ${user.last_name || ''}\n` +
      `╰➤🆔 𝗨𝗦𝗘𝗥 𝗜𝗗 : \`${order.user_id}\`\n` +
      `╰➤📡 𝗦𝗧𝗔𝗧𝗨𝗦: ✅ Success\n` +
      `╰➤ 🔰𝗤𝗨𝗔𝗟𝗜𝗧𝗬: High 📶\n` +
      `╰➤ 📦𝗧𝗢𝗧𝗔𝗟 𝗤𝗨𝗔𝗡𝗧𝗜𝗧𝗬 : ${order.quantity}\n` +
      `╰➤ 💳𝗖𝗢𝗦𝗧 : ₹${order.total_price}\n\n` +
      `🤖𝗕𝗢𝗧 𝗡𝗔𝗠𝗘 : @SheinVoucherHub_Bot\n` +
      `━━━━━━━━━━━•❈•━━━━━━━━━━━`;
    
    await ctx.telegram.sendMessage(process.env.CHANNEL_2_ID, channelMessage, { parse_mode: 'Markdown' });
    
    await ctx.answerCbQuery('✅ Order approved and delivered');
    await ctx.editMessageText(`✅ Order ${orderId} approved and delivered to user.`);
    
  } catch (error) {
    console.error('Accept order error:', error);
    ctx.answerCbQuery('❌ Error accepting order');
  }
};

// Handle reject order
module.exports.handleRejectOrder = async (ctx, orderId) => {
  try {
    adminSessions.set(ctx.from.id, { action: 'rejecting_order', orderId });
    
    await ctx.editMessageText(
      `❌ *Reject Order*\n\nOrder: \`${orderId}\`\n\n` +
      'Send rejection reason:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('↩️ Cancel', 'admin_back')]
        ]).reply_markup
      }
    );
    
  } catch (error) {
    console.error('Reject order error:', error);
    ctx.answerCbQuery('❌ Error');
  }
};

// Handle broadcast send
module.exports.handleBroadcastSend = async (ctx, text, photo) => {
  try {
    const users = await db.getAllUsers();
    let sent = 0;
    let failed = 0;
    
    await ctx.reply(`📢 Broadcasting to ${users.length} users...`);
    
    for (const user of users) {
      try {
        if (photo) {
          await ctx.telegram.sendPhoto(user.telegram_id, photo, {
            caption: text,
            parse_mode: 'Markdown'
          });
        } else {
          await ctx.telegram.sendMessage(user.telegram_id, text, {
            parse_mode: 'Markdown'
          });
        }
        sent++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (e) {
        failed++;
      }
    }
    
    await ctx.reply(`✅ Broadcast complete!\nSent: ${sent}\nFailed: ${failed}`);
    adminSessions.delete(ctx.from.id);
    
  } catch (error) {
    console.error('Broadcast error:', error);
    ctx.reply('❌ Broadcast failed');
  }
};

// Export sessions for other handlers
module.exports.adminSessions = adminSessions;
