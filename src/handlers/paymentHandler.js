const { Markup } = require('telegraf');
const { v4: uuidv4 } = require('uuid');

async function handleScreenshot(ctx) {
  try {
    const userId = ctx.from.id;
    const photos = ctx.message.photo;
    const fileId = photos[photos.length - 1].file_id;

    // Check if user has a pending order
    if (!ctx.session?.pendingOrder) {
      return ctx.reply(
        "❌ No pending order found.\n" +
        "Please start a new order from /start"
      );
    }

    // Store screenshot
    ctx.session.screenshotFileId = fileId;

    // Ask for UTR
    await ctx.reply(
      "📝 *Enter UTR/Transaction ID*\n\n" +
      "Please send your UTR/Transaction ID:\n\n" +
      "⚠️ *Warning:* Fake UTRs will result in permanent ban!",
      {
        parse_mode: 'Markdown',
        reply_markup: {
          force_reply: true
        }
      }
    );

    ctx.session.awaitingUTR = true;

  } catch (error) {
    console.error('Payment screenshot error:', error);
    ctx.reply('An error occurred. Please try again.');
  }
}

async function handleDocument(ctx) {
  // Handle document as screenshot if needed
  await handleScreenshot(ctx);
}

async function handleUTR(ctx, utrNumber) {
  try {
    const userId = ctx.from.id;
    
    // Check if UTR is blocked
    const blockedUTR = await global.pool.query(
      'SELECT * FROM blocked_utrs WHERE utr_number = $1',
      [utrNumber]
    );

    if (blockedUTR.rows.length > 0) {
      // Block user for using blocked UTR
      await global.pool.query(
        `UPDATE users 
         SET status = 'blocked_permanent', 
             block_reason = 'Attempted to use blocked UTR: ' || $1 
         WHERE user_id = $2`,
        [utrNumber, userId]
      );

      return ctx.reply(
        "⛔ *Fraudulent Activity Detected*\n\n" +
        "Your account has been permanently blocked for using a fraudulent UTR.",
        { parse_mode: 'Markdown' }
      );
    }

    // Check if UTR was already used
    const usedUTR = await global.pool.query(
      'SELECT * FROM orders WHERE utr_number = $1',
      [utrNumber]
    );

    if (usedUTR.rows.length > 0) {
      // Temporary block for duplicate UTR
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 30);

      await global.pool.query(
        `UPDATE users 
         SET status = 'blocked_temp', 
             block_reason = 'Duplicate UTR usage', 
             block_expiry = $1 
         WHERE user_id = $2`,
        [expiryTime, userId]
      );

      return ctx.reply(
        "⏳ *Duplicate UTR Detected*\n\n" +
        "This UTR has already been used. Your account has been temporarily restricted for 30 minutes.",
        { parse_mode: 'Markdown' }
      );
    }

    // Generate order ID
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = uuidv4().slice(0, 6).toUpperCase();
    const orderId = `SVH-${year}${month}${day}-${random}`;

    // Create order
    const order = await global.pool.query(
      `INSERT INTO orders (order_id, user_id, category_id, quantity, total_amount, utr_number, screenshot_file_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        orderId,
        userId,
        ctx.session.pendingOrder.categoryId,
        ctx.session.pendingOrder.quantity,
        ctx.session.pendingOrder.totalAmount,
        utrNumber,
        ctx.session.screenshotFileId,
        'pending'
      ]
    );

    // Mark UTR as used
    await global.pool.query(
      'INSERT INTO used_order_ids (order_id, user_id) VALUES ($1, $2)',
      [orderId, userId]
    );

    // Notify user
    await ctx.reply(
      "✅ *Order Submitted Successfully!*\n\n" +
      `🧾 *Order ID:* \`${orderId}\`\n` +
      `📦 *Category:* ${ctx.session.pendingOrder.categoryName}\n` +
      `🔢 *Quantity:* ${ctx.session.pendingOrder.quantity}\n` +
      `💰 *Amount:* ₹${ctx.session.pendingOrder.totalAmount}\n\n` +
      "Your order is being processed. You'll receive vouchers shortly.",
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: "📦 My Orders", callback_data: "my_orders" }],
            [{ text: "🏠 Main Menu", callback_data: "back_to_main" }]
          ]
        }
      }
    );

    // Notify admin
    await sendOrderToAdmin(ctx, order.rows[0]);

    // Clear session
    ctx.session.pendingOrder = null;
    ctx.session.screenshotFileId = null;
    ctx.session.awaitingUTR = false;

    // Log activity
    await global.pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, $2, $3)`,
      [userId, 'order_created', { order_id: orderId }]
    );

  } catch (error) {
    console.error('UTR processing error:', error);
    ctx.reply('An error occurred. Please try again.');
  }
}

async function sendOrderToAdmin(ctx, order) {
  const adminId = process.env.ADMIN_ID;
  
  // Get category name
  const category = await global.pool.query(
    'SELECT name FROM categories WHERE id = $1',
    [order.category_id]
  );

  const message = 
    "🛍 *New Order Received*\n\n" +
    `🧾 *Order ID:* \`${order.order_id}\`\n` +
    `👤 *User ID:* \`${order.user_id}\`\n` +
    `📦 *Category:* ${category.rows[0].name}\n` +
    `🔢 *Quantity:* ${order.quantity}\n` +
    `💰 *Amount:* ₹${order.total_amount}\n` +
    `💳 *UTR:* \`${order.utr_number}\`\n` +
    `📅 *Time:* ${new Date().toLocaleString()}`;

  // Send screenshot
  await ctx.telegram.sendPhoto(adminId, order.screenshot_file_id, {
    caption: message,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Accept', callback_data: `admin_order_accept_${order.order_id}` },
          { text: '❌ Reject', callback_data: `admin_order_reject_${order.order_id}` }
        ]
      ]
    }
  });
}

module.exports = { handleScreenshot, handleDocument, handleUTR };
