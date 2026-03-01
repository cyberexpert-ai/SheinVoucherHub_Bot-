const { Markup } = require('telegraf');
const { deleteOldMessage } = require('../../utils/helpers');

async function showCategories(ctx) {
  try {
    // Get active categories with stock count
    const categories = await global.pool.query(`
      SELECT c.*, COUNT(v.id) as stock_count 
      FROM categories c
      LEFT JOIN vouchers v ON c.id = v.category_id AND v.status = 'available'
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.value ASC
    `);

    if (categories.rows.length === 0) {
      return ctx.reply('📦 No categories available at the moment.');
    }

    const buttons = categories.rows.map(cat => [
      Markup.button.callback(
        `${cat.name} (${cat.stock_count} left)`, 
        `select_cat_${cat.id}`
      )
    ]);

    buttons.push([Markup.button.callback('🔙 Back', 'back_to_main')]);

    await ctx.reply('🛒 *Select Voucher Category*\n\nChoose a category to continue:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    });

  } catch (error) {
    console.error('Show categories error:', error);
    ctx.reply('An error occurred. Please try again.');
  }
}

async function selectCategory(ctx, categoryId) {
  try {
    // Get category details with stock
    const category = await global.pool.query(`
      SELECT c.*, COUNT(v.id) as stock_count 
      FROM categories c
      LEFT JOIN vouchers v ON c.id = v.category_id AND v.status = 'available'
      WHERE c.id = $1
      GROUP BY c.id
    `, [categoryId]);

    if (category.rows.length === 0) {
      return ctx.reply('Category not found.');
    }

    const cat = category.rows[0];
    
    // Store selected category in session
    ctx.session = ctx.session || {};
    ctx.session.selectedCategory = cat;

    // Show quantity selection
    await showQuantitySelection(ctx, cat);

  } catch (error) {
    console.error('Select category error:', error);
    ctx.reply('An error occurred. Please try again.');
  }
}

async function showQuantitySelection(ctx, category) {
  const maxStock = category.stock_count;
  
  const buttons = [
    [
      Markup.button.callback('1', `qty_${category.id}_1`),
      Markup.button.callback('2', `qty_${category.id}_2`),
      Markup.button.callback('3', `qty_${category.id}_3`)
    ],
    [
      Markup.button.callback('4', `qty_${category.id}_4`),
      Markup.button.callback('5', `qty_${category.id}_5`),
      Markup.button.callback('10', `qty_${category.id}_10`)
    ],
    [
      Markup.button.callback('✏️ Custom', `custom_qty_${category.id}`)
    ],
    [Markup.button.callback('🔙 Back', 'buy_voucher')]
  ];

  await ctx.reply(
    `🛒 *Buy ${category.name} Vouchers*\n\n` +
    `📦 Available Stock: *${maxStock}*\n\n` +
    `Select quantity:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    }
  );
}

async function selectQuantity(ctx, categoryId, quantity) {
  try {
    // Check stock availability
    const stockCheck = await global.pool.query(`
      SELECT COUNT(*) as available 
      FROM vouchers 
      WHERE category_id = $1 AND status = 'available'
    `, [categoryId]);

    const available = parseInt(stockCheck.rows[0].available);
    
    if (available < quantity) {
      return ctx.reply(`❌ Only ${available} vouchers available. Please select a lower quantity.`);
    }

    // Get price for this quantity
    const price = await global.pool.query(`
      SELECT price FROM price_tiers 
      WHERE category_id = $1 AND quantity = $2
    `, [categoryId, quantity]);

    if (price.rows.length === 0) {
      return ctx.reply('Price not configured for this quantity.');
    }

    const totalAmount = price.rows[0].price * quantity;

    // Store order details in session
    ctx.session = ctx.session || {};
    ctx.session.pendingOrder = {
      categoryId,
      quantity,
      totalAmount,
      categoryName: ctx.session.selectedCategory.name
    };

    // Show payment page
    await showPaymentPage(ctx);

  } catch (error) {
    console.error('Select quantity error:', error);
    ctx.reply('An error occurred. Please try again.');
  }
}

async function showPaymentPage(ctx) {
  const order = ctx.session.pendingOrder;
  
  const message = 
    "💳 *Payment Details*\n\n" +
    `📦 Category: *${order.categoryName}*\n` +
    `🔢 Quantity: *${order.quantity}*\n` +
    `💰 Total Amount: *₹${order.totalAmount.toFixed(2)}*\n\n` +
    "👇 *Scan QR Code to Pay*\n" +
    "After payment, click the 'Paid' button and send the screenshot.";

  const buttons = [
    [Markup.button.callback('✅ I Have Paid', 'paid_confirm')],
    [Markup.button.callback('🔙 Back', 'buy_voucher')]
  ];

  // Send QR code image
  await ctx.replyWithPhoto(process.env.PAYMENT_QR, {
    caption: message,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

async function confirmPaid(ctx) {
  await ctx.reply(
    "📤 *Please send your payment screenshot*\n\n" +
    "After sending the screenshot, you'll need to provide your UTR/Transaction ID.\n\n" +
    "⚠️ *Warning:* Fake or illegal screenshots will result in permanent ban!",
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  // Set user state to expect screenshot
  ctx.session = ctx.session || {};
  ctx.session.awaitingScreenshot = true;
}

async function handleCustomQuantity(ctx, categoryId) {
  await ctx.reply(
    "✏️ *Enter custom quantity*\n\n" +
    `Maximum available: ${ctx.session.selectedCategory.stock_count}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true
      }
    }
  );
  
  ctx.session = ctx.session || {};
  ctx.session.awaitingCustomQuantity = categoryId;
}

module.exports = {
  showCategories,
  selectCategory,
  selectQuantity,
  handleCustomQuantity,
  confirmPaid
};
