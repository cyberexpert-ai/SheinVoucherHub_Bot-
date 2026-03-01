const { Markup } = require('telegraf');

async function handle(ctx) {
  const action = ctx.callbackQuery.data;
  
  if (action === 'admin_voucher') {
    await showVoucherMenu(ctx);
  } else if (action.startsWith('admin_voucher_add_')) {
    const categoryId = action.replace('admin_voucher_add_', '');
    await addVoucher(ctx, categoryId);
  } else if (action.startsWith('admin_voucher_bulk_')) {
    const categoryId = action.replace('admin_voucher_bulk_', '');
    await bulkAddVouchers(ctx, categoryId);
  } else if (action.startsWith('admin_voucher_delete_')) {
    const voucherId = action.replace('admin_voucher_delete_', '');
    await deleteVoucher(ctx, voucherId);
  } else if (action.startsWith('admin_voucher_category_')) {
    const categoryId = action.replace('admin_voucher_category_', '');
    await showCategoryVouchers(ctx, categoryId);
  }
}

async function showVoucherMenu(ctx) {
  const categories = await global.pool.query(`
    SELECT c.*, COUNT(v.id) as voucher_count
    FROM categories c
    LEFT JOIN vouchers v ON c.id = v.category_id
    GROUP BY c.id
    ORDER BY c.value ASC
  `);

  let message = "🎟 *Voucher Management*\n\nSelect a category:\n\n";
  const buttons = [];

  for (const cat of categories.rows) {
    message += `• ${cat.name} - ${cat.voucher_count} vouchers\n`;
    buttons.push([
      { text: `📦 ${cat.name}`, callback_data: `admin_voucher_category_${cat.id}` }
    ]);
  }

  buttons.push([{ text: '🔙 Back to Admin', callback_data: 'admin_back' }]);

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function showCategoryVouchers(ctx, categoryId) {
  const category = await global.pool.query(
    'SELECT * FROM categories WHERE id = $1',
    [categoryId]
  );

  if (category.rows.length === 0) {
    return ctx.reply('Category not found.');
  }

  const cat = category.rows[0];

  const vouchers = await global.pool.query(`
    SELECT v.*, u.username as purchased_by_username
    FROM vouchers v
    LEFT JOIN users u ON v.purchased_by = u.user_id
    WHERE v.category_id = $1
    ORDER BY v.status, v.created_at DESC
    LIMIT 20
  `, [categoryId]);

  let message = `🎟 *Vouchers - ${cat.name}*\n\n`;
  message += `Total: ${vouchers.rowCount} vouchers\n\n`;

  const available = vouchers.rows.filter(v => v.status === 'available').length;
  const sold = vouchers.rows.filter(v => v.status === 'sold').length;
  
  message += `📦 Available: ${available}\n`;
  message += `✅ Sold: ${sold}\n\n`;

  if (vouchers.rows.length > 0) {
    message += "*Recent Vouchers:*\n";
    vouchers.rows.slice(0, 5).forEach((v, i) => {
      const statusEmoji = v.status === 'available' ? '🟢' : '🔴';
      message += `${statusEmoji} \`${v.code}\` - ${v.status}\n`;
    });
  }

  const buttons = [
    [
      { text: '➕ Add Single', callback_data: `admin_voucher_add_${categoryId}` },
      { text: '📚 Bulk Add', callback_data: `admin_voucher_bulk_${categoryId}` }
    ],
    [
      { text: '🗑 Delete All Available', callback_data: `admin_voucher_clear_${categoryId}` }
    ],
    [{ text: '🔙 Back', callback_data: 'admin_voucher' }]
  ];

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function addVoucher(ctx, categoryId) {
  await ctx.reply(
    "➕ *Add Single Voucher*\n\n" +
    "Send the voucher code:",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'add_voucher';
  ctx.session.categoryId = categoryId;
}

async function bulkAddVouchers(ctx, categoryId) {
  await ctx.reply(
    "📚 *Bulk Add Vouchers*\n\n" +
    "Send voucher codes (one per line):\n\n" +
    "Example:\n" +
    "CODE123\n" +
    "CODE456\n" +
    "CODE789",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'bulk_add_vouchers';
  ctx.session.categoryId = categoryId;
}

async function deleteVoucher(ctx, voucherId) {
  await global.pool.query(
    'DELETE FROM vouchers WHERE id = $1 AND status = $2',
    [voucherId, 'available']
  );
  
  await ctx.answerCbQuery('✅ Voucher deleted successfully!');
}

module.exports = { handle };
