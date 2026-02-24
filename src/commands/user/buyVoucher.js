const { query } = require("../../database/database");
const moment = require("moment");

async function buyVoucher(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const sessionKey = `buy_${userId}`;

    // Get available categories
    const categories = await query(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM vouchers WHERE category_name = c.name AND is_used = FALSE) as available_vouchers
        FROM categories c
        WHERE c.stock > 0 OR (SELECT COUNT(*) FROM vouchers WHERE category_name = c.name AND is_used = FALSE) > 0
    `);

    if (categories.length === 0) {
        await bot.sendMessage(chatId, "❌ No vouchers available at the moment. Please check back later.");
        return;
    }

    // Create category selection keyboard
    const keyboard = {
        inline_keyboard: categories.map(cat => [
            { text: `₹${cat.name} (${cat.available_vouchers} available)`, callback_data: `buy_cat_${cat.name}` }
        ])
    };

    // Add back button
    keyboard.inline_keyboard.push([{ text: "↩️ Back", callback_data: "back_to_main" }]);

    const message = await bot.sendMessage(chatId, 
        "🛒 *Buy Voucher*\n\nSelect voucher category:", 
        {
            parse_mode: "Markdown",
            reply_markup: keyboard
        }
    );

    // Store session
    if (!global.userSessions) global.userSessions = new Map();
    global.userSessions.set(sessionKey, {
        step: "category",
        messageId: message.message_id
    });
}

async function selectCategory(bot, chatId, userId, category) {
    const sessionKey = `buy_${userId}`;
    
    // Get category details
    const catData = await query(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM vouchers WHERE category_name = c.name AND is_used = FALSE) as available_vouchers
        FROM categories c
        WHERE c.name = ?
    `, [category]);

    if (catData.length === 0) {
        await bot.sendMessage(chatId, "❌ Category not found!");
        return;
    }

    const categoryName = catData[0].name;
    const available = catData[0].available_vouchers;

    // Create quantity selection keyboard
    const quantityButtons = [];
    const quantities = [1, 2, 3, 5, 10, 20, 30, 50];
    
    for (let i = 0; i < quantities.length; i += 2) {
        const row = [];
        if (quantities[i] <= available) {
            row.push({ text: `${quantities[i]}`, callback_data: `buy_qty_${categoryName}_${quantities[i]}` });
        }
        if (i + 1 < quantities.length && quantities[i + 1] <= available) {
            row.push({ text: `${quantities[i + 1]}`, callback_data: `buy_qty_${categoryName}_${quantities[i + 1]}` });
        }
        if (row.length > 0) {
            quantityButtons.push(row);
        }
    }

    // Add custom quantity option
    quantityButtons.push([{ text: "✏️ Custom", callback_data: `buy_custom_${categoryName}` }]);
    quantityButtons.push([{ text: "↩️ Back", callback_data: "back_to_categories" }]);

    const keyboard = { inline_keyboard: quantityButtons };

    const message = await bot.sendMessage(chatId,
        `🛒 *Buy Voucher - ₹${categoryName}*

Available: ${available} vouchers

Select quantity:`,
        {
            parse_mode: "Markdown",
            reply_markup: keyboard
        }
    );

    // Update session
    global.userSessions.set(sessionKey, {
        step: "quantity",
        category: categoryName,
        messageId: message.message_id
    });
}

async function selectQuantity(bot, chatId, userId, category, quantity) {
    const sessionKey = `buy_${userId}`;
    
    // Check if quantity is available
    const available = await query(`
        SELECT COUNT(*) as count FROM vouchers 
        WHERE category_name = ? AND is_used = FALSE
    `, [category]);

    if (available[0].count < quantity) {
        await bot.answerCallbackQuery(chatId, {
            text: `❌ Only ${available[0].count} vouchers available!`,
            show_alert: true
        });
        return;
    }

    // Get price for this quantity
    const priceData = await query(
        "SELECT price FROM prices WHERE category_name = ? AND quantity = ?",
        [category, quantity]
    );

    let totalPrice;
    if (priceData.length > 0) {
        totalPrice = priceData[0].price;
    } else {
        // Calculate price based on pattern
        const basePrice = await query(
            "SELECT price FROM prices WHERE category_name = ? AND quantity = 1",
            [category]
        );
        
        if (basePrice.length > 0) {
            totalPrice = basePrice[0].price * quantity;
            // Round to pattern
            if (totalPrice < 100) {
                totalPrice = Math.floor(totalPrice / 10) * 10 + 9;
            } else if (totalPrice < 1000) {
                totalPrice = Math.floor(totalPrice / 100) * 100 + 99;
            } else {
                totalPrice = Math.floor(totalPrice / 1000) * 1000 + 999;
            }
        } else {
            totalPrice = parseInt(category) * quantity / 10; // Fallback
        }
    }

    // Show payment page
    const paymentMessage = `💳 *Payment Details*

📦 Category: ₹${category}
🔢 Quantity: ${quantity}
💰 Total Amount: ₹${totalPrice}

${quantity > available[0].count ? '⚠️ Note: Quantity exceeds available stock!' : ''}

Please send payment to the following UPI ID or scan QR code:

📱 UPI ID: sheinvoucher@okhdfcbank
💳 QR Code: [Click to view](${process.env.QR_IMAGE})

After payment:
1️⃣ Click "I have paid"
2️⃣ Upload screenshot
3️⃣ Enter UTR/Transaction ID`;

    const paymentKeyboard = {
        inline_keyboard: [
            [{ text: "✅ I have paid", callback_data: `pay_${category}_${quantity}_${totalPrice}` }],
            [{ text: "↩️ Back to quantity", callback_data: `back_to_qty_${category}` }]
        ]
    };

    await bot.sendPhoto(chatId, process.env.QR_IMAGE, {
        caption: paymentMessage,
        parse_mode: "Markdown",
        reply_markup: paymentKeyboard
    });

    // Update session
    global.userSessions.set(sessionKey, {
        step: "payment",
        category: category,
        quantity: quantity,
        totalPrice: totalPrice,
        expiresAt: moment().add(30, 'minutes').toISOString()
    });
}

async function handleCustomQuantity(bot, chatId, userId, category) {
    const sessionKey = `buy_${userId}`;
    
    const message = await bot.sendMessage(chatId,
        `✏️ *Enter Custom Quantity*

Maximum available: ${await getAvailableStock(category)}

Please enter the quantity you want to buy (1-100):`,
        {
            parse_mode: "Markdown",
            reply_markup: {
                force_reply: true
            }
        }
    );

    global.userSessions.set(sessionKey, {
        step: "custom_quantity",
        category: category,
        messageId: message.message_id
    });
}

async function getAvailableStock(category) {
    const result = await query(
        "SELECT COUNT(*) as count FROM vouchers WHERE category_name = ? AND is_used = FALSE",
        [category]
    );
    return result[0].count;
}

module.exports = { 
    buyVoucher, 
    selectCategory, 
    selectQuantity, 
    handleCustomQuantity 
};
