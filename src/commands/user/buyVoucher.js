const db = require('../../database/database');
const { Markup } = require('telegraf');

// Store user session data
const userSessions = new Map();

module.exports = async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Clear any existing session
    userSessions.delete(userId);
    
    // Get all active categories
    const categories = await db.getCategories();
    
    if (categories.length === 0) {
      return ctx.reply('❌ No vouchers available at the moment.', {
        reply_markup: {
          keyboard: [[{ text: '↩️ Back' }]],
          resize_keyboard: true
        }
      });
    }
    
    // Create category buttons
    const buttons = categories.map(cat => 
      [Markup.button.callback(cat.display_name, `cat_${cat.id}`)]
    );
    buttons.push([Markup.button.callback('↩️ Back', 'back_to_main')]);
    
    await ctx.reply('📌 *Select Voucher Type*', {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
    
    // Remove keyboard
    await ctx.reply('Choose from the options below:', {
      reply_markup: { remove_keyboard: true }
    });
    
  } catch (error) {
    console.error('Buy voucher error:', error);
    ctx.reply('An error occurred. Please try again later.');
  }
};

// Handle category selection
module.exports.handleCategory = async (ctx, categoryId) => {
  try {
    const userId = ctx.from.id;
    
    // Get category details
    const category = await db.getCategory(categoryId);
    if (!category) {
      return ctx.editMessageText('❌ Category not found.');
    }
    
    // Get stock
    const stock = await db.getAvailableStock(categoryId);
    
    // Store category in session
    userSessions.set(userId, { categoryId, categoryName: category.display_name });
    
    // Create quantity buttons
    const buttons = [
      [Markup.button.callback('1', `qty_${categoryId}_1`)],
      [Markup.button.callback('2', `qty_${categoryId}_2`)],
      [Markup.button.callback('3', `qty_${categoryId}_3`)],
      [Markup.button.callback('4', `qty_${categoryId}_4`)],
      [Markup.button.callback('5', `qty_${categoryId}_5`)],
      [Markup.button.callback('Custom', `qty_${categoryId}_custom`)],
      [Markup.button.callback('↩️ Back', 'back_to_categories')]
    ];
    
    await ctx.editMessageText(
      `*${category.display_name}*\n` +
      `Available Stock: ${stock} codes\n\n` +
      `Select quantity:`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      }
    );
    
  } catch (error) {
    console.error('Category selection error:', error);
    ctx.answerCbQuery('❌ Error loading category');
  }
};

// Handle quantity selection
module.exports.handleQuantity = async (ctx, categoryId, quantity) => {
  try {
    const userId = ctx.from.id;
    
    if (quantity === 'custom') {
      // Ask for custom quantity
      userSessions.set(userId, { 
        ...userSessions.get(userId),
        waitingForCustom: true 
      });
      
      await ctx.editMessageText(
        '✏️ Enter quantity (1-100):\n\n' +
        'Send a number between 1 and 100.',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Cancel', `cat_${categoryId}`)]
          ])
        }
      );
      return;
    }
    
    quantity = parseInt(quantity);
    
    // Check stock
    const stock = await db.getAvailableStock(categoryId);
    if (quantity > stock) {
      return ctx.answerCbQuery(`❌ Only ${stock} codes available!`, { alert: true });
    }
    
    // Get price
    const priceTier = await db.getPriceTier(categoryId, quantity);
    if (!priceTier) {
      return ctx.answerCbQuery('❌ Price not configured for this quantity', { alert: true });
    }
    
    // Store quantity in session
    userSessions.set(userId, { 
      ...userSessions.get(userId),
      quantity,
      totalPrice: priceTier.price
    });
    
    // Show payment page
    await showPaymentPage(ctx, userId, categoryId, quantity, priceTier.price);
    
  } catch (error) {
    console.error('Quantity selection error:', error);
    ctx.answerCbQuery('❌ Error processing quantity');
  }
};

// Handle custom quantity input
module.exports.handleCustomQuantity = async (ctx, text) => {
  try {
    const userId = ctx.from.id;
    const session = userSessions.get(userId);
    
    if (!session || !session.waitingForCustom) {
      return false;
    }
    
    const quantity = parseInt(text);
    if (isNaN(quantity) || quantity < 1 || quantity > 100) {
      await ctx.reply('❌ Invalid quantity. Please enter a number between 1 and 100.');
      return true;
    }
    
    const categoryId = session.categoryId;
    
    // Check stock
    const stock = await db.getAvailableStock(categoryId);
    if (quantity > stock) {
      await ctx.reply(`❌ Only ${stock} codes available!`);
      return true;
    }
    
    // Get price (calculate if not in price tiers)
    let priceTier = await db.getPriceTier(categoryId, quantity);
    if (!priceTier) {
      // Calculate price based on base price
      const baseTier = await db.getPriceTier(categoryId, 1);
      if (!baseTier) {
        await ctx.reply('❌ Price not configured for this category');
        return true;
      }
      
      // Apply bulk discount logic
      let pricePerUnit = baseTier.price;
      if (quantity >= 20) pricePerUnit = Math.round(baseTier.price * 0.85);
      else if (quantity >= 10) pricePerUnit = Math.round(baseTier.price * 0.9);
      else if (quantity >= 5) pricePerUnit = Math.round(baseTier.price * 0.95);
      
      const totalPrice = pricePerUnit * quantity;
      
      // Save temporary price
      session.tempPrice = totalPrice;
      session.quantity = quantity;
      session.totalPrice = totalPrice;
      userSessions.set(userId, session);
      
      await showPaymentPage(ctx, userId, categoryId, quantity, totalPrice);
      return true;
    }
    
    session.quantity = quantity;
    session.totalPrice = priceTier.price;
    userSessions.set(userId, session);
    
    await showPaymentPage(ctx, userId, categoryId, quantity, priceTier.price);
    return true;
    
  } catch (error) {
    console.error('Custom quantity error:', error);
    await ctx.reply('An error occurred. Please try again.');
    return true;
  }
};

// Show payment page
async function showPaymentPage(ctx, userId, categoryId, quantity, totalPrice) {
  const session = userSessions.get(userId);
  const category = await db.getCategory(categoryId);
  
  const paymentText = 
    `💳 *Payment Details*\n\n` +
    `Category: ${category.display_name}\n` +
    `Quantity: ${quantity}\n` +
    `Total Amount: ₹${totalPrice}\n\n` +
    `⚠️ *Important:*\n` +
    `• Send exact amount\n` +
    `• Fake payments = Permanent ban\n` +
    `• Screenshot required\n\n` +
    `📸 Click "I Have Paid" and send screenshot with UTR`;
  
  // Store payment info in session
  session.paymentPending = true;
  userSessions.set(userId, session);
  
  await ctx.editMessageText(paymentText, {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback('💰 I Have Paid', `paid_${categoryId}_${quantity}_${totalPrice}`)],
      [Markup.button.callback('↩️ Change Quantity', `cat_${categoryId}`)],
      [Markup.button.callback('↩️ Back to Categories', 'back_to_categories')]
    ]).reply_markup
  });
}

// Handle payment initiation
module.exports.handlePayment = async (ctx, categoryId, quantity, totalPrice) => {
  try {
    const userId = ctx.from.id;
    
    // Store payment data
    userSessions.set(userId, {
      ...userSessions.get(userId),
      paymentData: {
        categoryId,
        quantity,
        totalPrice,
        waitingForScreenshot: true
      }
    });
    
    const qrImage = process.env.QR_IMAGE;
    
    await ctx.editMessageText(
      '📸 *Send Payment Proof*\n\n' +
      '1️⃣ Make payment to the QR code\n' +
      '2️⃣ Take screenshot of payment\n' +
      '3️⃣ Send screenshot here\n' +
      '4️⃣ Then send UTR number\n\n' +
      '⚠️ Fake payments = Permanent Ban',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url('📱 View QR Code', qrImage)],
          [Markup.button.callback('↩️ Cancel', `cat_${categoryId}`)]
        ]).reply_markup
      }
    );
    
    // Send QR image
    await ctx.replyWithPhoto(qrImage, {
      caption: `Amount: ₹${totalPrice}\n\nSend screenshot after payment.`
    });
    
  } catch (error) {
    console.error('Payment error:', error);
    ctx.answerCbQuery('❌ Error processing payment');
  }
};

// Export session manager for other handlers
module.exports.userSessions = userSessions;
