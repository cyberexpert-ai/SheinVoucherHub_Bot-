const { Markup } = require('telegraf');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

async function handle(ctx) {
  const action = ctx.callbackQuery.data;
  
  if (action === 'admin_discount') {
    await showDiscountMenu(ctx);
  } else if (action === 'admin_discount_add') {
    await addDiscount(ctx);
  } else if (action.startsWith('admin_discount_delete_')) {
    const discountId = action.replace('admin_discount_delete_', '');
    await deleteDiscount(ctx, discountId);
  } else if (action.startsWith('admin_discount_edit_')) {
    const discountId = action.replace('admin_discount_edit_', '');
    await editDiscount(ctx, discountId);
  }
}

async function showDiscountMenu(ctx) {
  const discounts = await global.pool.query(`
    SELECT d.*, c.name as category_name
    FROM discounts d
    LEFT JOIN categories c ON d.category_id = c.id
    WHERE d.status = 'active'
    ORDER BY d.created_at DESC
  `);

  let message = "🏷 *Discount Code Management*\n\n";

  if (discounts.rows.length > 0) {
    message += "*Active Discounts:*\n";
    discounts.rows.forEach(d => {
      const typeEmoji = d.type === 'percentage' ? '%' : '💰';
      message += `${typeEmoji} *${d.code}*\n`;
      message += `  Value: ${d.value}${d.type === 'percentage' ? '%' : ' fixed'}\n`;
      message += `  Category: ${d.category_name || 'All'}\n`;
      message += `  Used: ${d.used_count}/${d.usage_limit || '∞'}\n`;
      message += `  Valid: ${moment(d.valid_from).format('DD/MM/YY')} - ${moment(d.valid_until).format('DD/MM/YY')}\n\n`;
    });
  } else {
    message += "No active discount codes.\n";
  }

  const buttons = [
    [{ text: '➕ Add New Discount', callback_data: 'admin_discount_add' }],
    [{ text: '📋 Expired Discounts', callback_data: 'admin_discount_expired' }],
    [{ text: '🔙 Back to Admin', callback_data: 'admin_back' }]
  ];

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function addDiscount(ctx) {
  await ctx.reply(
    "➕ *Add New Discount Code*\n\n" +
    "Enter discount details in format:\n\n" +
    "`code|type|value|category_id|min_qty|max_qty|valid_days|usage_limit`\n\n" +
    "Example:\n" +
    "`SAVE20|percentage|20|1|1|10|30|100`\n\n" +
    "Types: percentage, fixed\n" +
    "Category ID: 0 for all categories",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.adminAction = 'add_discount';
}

async function deleteDiscount(ctx, discountId) {
  await global.pool.query(
    'UPDATE discounts SET status = $1 WHERE id = $2',
    ['deleted', discountId]
  );

  await ctx.answerCbQuery('✅ Discount deleted!');
  await showDiscountMenu(ctx);
}

async function editDiscount(ctx, discountId) {
  const discount = await global.pool.query(
    'SELECT * FROM discounts WHERE id = $1',
    [discountId]
  );

  if (discount.rows.length === 0) {
    return ctx.reply('Discount not found.');
  }

  const d = discount.rows[0];

  const message = 
    `✏️ *Edit Discount: ${d.code}*\n\n` +
    `Current Values:\n` +
    `Type: ${d.type}\n` +
    `Value: ${d.value}\n` +
    `Category ID: ${d.category_id || 'All'}\n` +
    `Min Quantity: ${d.min_quantity}\n` +
    `Max Quantity: ${d.max_quantity || 'Unlimited'}\n` +
    `Valid From: ${moment(d.valid_from).format('DD/MM/YYYY')}\n` +
    `Valid Until: ${moment(d.valid_until).format('DD/MM/YYYY')}\n` +
    `Usage Limit: ${d.usage_limit || 'Unlimited'}\n` +
    `Used: ${d.used_count}\n\n` +
    `What would you like to edit?`;

  const buttons = [
    [
      { text: '💰 Value', callback_data: `admin_discount_edit_value_${d.id}` },
      { text: '📅 Dates', callback_data: `admin_discount_edit_dates_${d.id}` }
    ],
    [
      { text: '🔢 Limits', callback_data: `admin_discount_edit_limits_${d.id}` },
      { text: '🔄 Status', callback_data: `admin_discount_edit_status_${d.id}` }
    ],
    [{ text: '🔙 Back', callback_data: 'admin_discount' }]
  ];

  await ctx.editMessageText(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

module.exports = { handle };
