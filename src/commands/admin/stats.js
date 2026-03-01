const { Markup } = require('telegraf');
const moment = require('moment');

async function show(ctx) {
  const stats = await global.pool.query(`
    SELECT
      -- User stats
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE joined_at > NOW() - INTERVAL '24 hours') as users_24h,
      (SELECT COUNT(*) FROM users WHERE joined_at > NOW() - INTERVAL '7 days') as users_7d,
      
      -- Order stats
      (SELECT COUNT(*) FROM orders) as total_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed') as total_revenue,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours') as revenue_24h,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at > NOW() - INTERVAL '7 days') as revenue_7d,
      
      -- Voucher stats
      (SELECT COUNT(*) FROM vouchers) as total_vouchers,
      (SELECT COUNT(*) FROM vouchers WHERE status = 'available') as available_vouchers,
      (SELECT COUNT(*) FROM vouchers WHERE status = 'sold') as sold_vouchers,
      
      -- Category stats
      (SELECT COUNT(*) FROM categories WHERE status = 'active') as active_categories,
      
      -- Support stats
      (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets,
      (SELECT COUNT(*) FROM support_tickets WHERE created_at > NOW() - INTERVAL '24 hours') as tickets_24h
  `);

  const s = stats.rows[0];

  const message = 
    "📈 *Bot Statistics*\n\n" +
    "👥 *Users*\n" +
    `├ Total: ${s.total_users}\n` +
    `├ Last 24h: ${s.users_24h}\n` +
    `└ Last 7d: ${s.users_7d}\n\n` +
    
    "📦 *Orders*\n" +
    `├ Total: ${s.total_orders}\n` +
    `├ Completed: ${s.completed_orders}\n` +
    `├ Pending: ${s.pending_orders}\n` +
    `└ Success Rate: ${s.total_orders > 0 ? Math.round((s.completed_orders / s.total_orders) * 100) : 0}%\n\n` +
    
    "💰 *Revenue*\n" +
    `├ Total: ₹${parseFloat(s.total_revenue).toFixed(2)}\n` +
    `├ Last 24h: ₹${parseFloat(s.revenue_24h).toFixed(2)}\n` +
    `└ Last 7d: ₹${parseFloat(s.revenue_7d).toFixed(2)}\n\n` +
    
    "🎟 *Vouchers*\n" +
    `├ Total: ${s.total_vouchers}\n` +
    `├ Available: ${s.available_vouchers}\n` +
    `├ Sold: ${s.sold_vouchers}\n` +
    `└ Utilization: ${s.total_vouchers > 0 ? Math.round((s.sold_vouchers / s.total_vouchers) * 100) : 0}%\n\n` +
    
    "📊 *Other*\n" +
    `├ Active Categories: ${s.active_categories}\n` +
    `├ Open Tickets: ${s.open_tickets}\n` +
    `└ Tickets (24h): ${s.tickets_24h}\n`;

  const buttons = [
    [
      { text: '📊 Detailed Report', callback_data: 'admin_stats_detailed' },
      { text: '📈 Export CSV', callback_data: 'admin_stats_export' }
    ],
    [{ text: '🔙 Back to Admin', callback_data: 'admin_back' }]
  ];

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

module.exports = { show };
