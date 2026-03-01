const { Markup } = require('telegraf');

async function handle(ctx) {
  const action = ctx.callbackQuery.data;
  
  if (action === 'admin_category') {
    await showCategoryMenu(ctx);
  } else if (action.startsWith('admin_category_add')) {
    await addCategory(ctx);
  } else if (action.startsWith('admin_category_delete_')) {
    const categoryId = action.replace('admin_category_delete_', '');
    await deleteCategory(ctx, categoryId);
  } else if (action.startsWith('admin_category_edit_')) {
    const categoryId = action.replace('admin_category_edit_', '');
    await editCategory(ctx, categoryId);
  } else if (action.startsWith('admin_category_view_')) {
    const categoryId = action.replace('admin_category_view_', '');
    await viewCategory(ctx, categoryId);
  }
}

async function showCategoryMenu(ctx) {
  // Get all categories with stats
  const categories = await global.pool.query(`
    SELECT c.*, 
           COUNT(v.id) FILTER (WHERE v.status = 'available') as available_stock,
           COUNT(v.id) as total_stock
    FROM categories c
    LEFT JOIN vouchers v ON c.id = v.category_id
    GROUP BY c.id
    ORDER BY c.value ASC
  `);

  let message = "📊 *Category Management*\n\n";
  
  const buttons = [];
  
  for (const cat of categories.rows) {
    message += `*${cat.name}*\n`;
    message += `├ Available: ${cat.available_stock}\n`;
    message += `├ Total: ${cat.total_stock}\n`;
    message += `└ Status: ${cat.status}\n\n`;
    
    buttons.push([
      { text: `✏️ ${cat.name}`, callback_data: `admin_category_edit_${cat.id}` },
      { text: `🗑 Delete`, callback_data: `admin_category_delete_${cat.id}` }
    ]);
  }
  
  buttons.push(
    [{ text: '➕ Add New Category', callback_data: 'admin_category_add' }],
    [{ text: '🔙 Back to Admin', callback_data: 'admin_back' }]
  );

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function addCategory(ctx) {
  await ctx.reply(
    "➕ *Add New Category*\n\n" +
    "Send category details in format:\n" +
    "`Name|Value|Description`\n\n" +
    "Example: `₹5000|5000|Premium Vouchers`",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'add_category';
}

async function deleteCategory(ctx, categoryId) {
  // Check if category has any orders
  const orders = await global.pool.query(
    'SELECT COUNT(*) FROM orders WHERE category_id = $1',
    [categoryId]
  );

  if (parseInt(orders.rows[0].count) > 0) {
    return ctx.reply(
      "❌ Cannot delete category with existing orders.\n" +
      "Deactivate it instead."
    );
  }

  await global.pool.query(
    'DELETE FROM categories WHERE id = $1',
    [categoryId]
  );

  await ctx.answerCbQuery('✅ Category deleted successfully!');
  await showCategoryMenu(ctx);
}

async function editCategory(ctx, categoryId) {
  const category = await global.pool.query(
    'SELECT * FROM categories WHERE id = $1',
    [categoryId]
  );

  if (category.rows.length === 0) {
    return ctx.reply('Category not found.');
  }

  const cat = category.rows[0];

  const message = 
    `✏️ *Editing Category: ${cat.name}*\n\n` +
    `Current Details:\n` +
    `Name: ${cat.name}\n` +
    `Value: ₹${cat.value}\n` +
    `Description: ${cat.description || 'N/A'}\n` +
    `Status: ${cat.status}\n\n` +
    `What would you like to edit?`;

  const buttons = [
    [
      { text: '📝 Name', callback_data: `admin_category_edit_name_${cat.id}` },
      { text: '💰 Value', callback_data: `admin_category_edit_value_${cat.id}` }
    ],
    [
      { text: '📄 Description', callback_data: `admin_category_edit_desc_${cat.id}` },
      { text: '🔄 Status', callback_data: `admin_category_edit_status_${cat.id}` }
    ],
    [
      { text: '📊 Price Tiers', callback_data: `admin_category_price_${cat.id}` }
    ],
    [{ text: '🔙 Back', callback_data: 'admin_category' }]
  ];

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function viewCategory(ctx, categoryId) {
  const category = await global.pool.query(`
    SELECT c.*, 
           COUNT(v.id) FILTER (WHERE v.status = 'available') as available,
           COUNT(v.id) FILTER (WHERE v.status = 'sold') as sold,
           COUNT(v.id) as total
    FROM categories c
    LEFT JOIN vouchers v ON c.id = v.category_id
    WHERE c.id = $1
    GROUP BY c.id
  `, [categoryId]);

  if (category.rows.length === 0) {
    return ctx.reply('Category not found.');
  }

  const cat = category.rows[0];
  
  const message = 
    `📊 *Category Details*\n\n` +
    `*Name:* ${cat.name}\n` +
    `*Value:* ₹${cat.value}\n` +
    `*Description:* ${cat.description || 'N/A'}\n` +
    `*Status:* ${cat.status}\n` +
    `*Available Stock:* ${cat.available}\n` +
    `*Sold:* ${cat.sold}\n` +
    `*Total Vouchers:* ${cat.total}\n`;

  const buttons = [
    [{ text: '✏️ Edit', callback_data: `admin_category_edit_${cat.id}` }],
    [{ text: '🎟 View Vouchers', callback_data: `admin_voucher_category_${cat.id}` }],
    [{ text: '💰 Price Tiers', callback_data: `admin_category_price_${cat.id}` }],
    [{ text: '🔙 Back', callback_data: 'admin_category' }]
  ];

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

module.exports = { handle };
