const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { generateOrderId, formatCurrency, isValidUTR } = require('../../utils/helpers');
const { PAYMENT_QR, CHANNELS } = require('../../utils/constants');

// Store user states to prevent multiple displays
const userStates = new Map();

const showCategories = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    try {
        // Check if user already viewing categories
        if (userStates.has(userId)) {
            return;
        }
        
        userStates.set(userId, 'viewing_categories');
        
        const pool = getPool();
        
        // Get active categories with stock
        const categories = await pool.query(
            'SELECT category_id, name, stock FROM categories WHERE is_active = true ORDER BY category_id'
        );
        
        if (categories.rows.length === 0) {
            await bot.sendMessage(chatId, '❌ No categories available.', {
                reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
            });
            userStates.delete(userId);
            return;
        }
        
        // Create category buttons
        const buttons = [];
        categories.rows.forEach(cat => {
            const stockStatus = cat.stock > 0 ? `(Stock: ${cat.stock})` : '(Out of Stock)';
            buttons.push([
                { text: `${cat.name} ${stockStatus}`, callback_data: `category_${cat.category_id}` }
            ]);
        });
        
        buttons.push([{ text: '↩️ Back to Main Menu', callback_data: 'back_main' }]);
        
        await bot.sendMessage(
            chatId,
            '🛒 *Select Voucher Category:*\n\nClick on a category to see details and prices.',
            {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            }
        );
        
        // Clear state after 30 seconds
        setTimeout(() => {
            userStates.delete(userId);
        }, 30000);
        
    } catch (error) {
        logger.error('Error showing categories:', error);
        await bot.sendMessage(chatId, '❌ Error loading categories. Please try again.', {
            reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
        });
        userStates.delete(userId);
    }
};

const selectCategory = async (bot, user, message, categoryId) => {
    const chatId = message.chat.id;
    const userId = user.id;
    const messageId = message.message_id;
    
    try {
        // Delete previous message
        try {
            await bot.deleteMessage(chatId, messageId);
        } catch (e) {
            // Ignore if can't delete
        }
        
        const pool = getPool();
        
        // Get category details
        const category = await pool.query(
            'SELECT * FROM categories WHERE category_id = $1 AND is_active = true',
            [categoryId]
        );
        
        if (category.rows.length === 0) {
            await bot.sendMessage(chatId, '❌ Category not found.', {
                reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
            });
            userStates.delete(userId);
            return;
        }
        
        const cat = category.rows[0];
        
        // Store category in session
        await pool.query(
            `INSERT INTO user_sessions (user_id, temp_data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE 
             SET temp_data = $2, updated_at = NOW()`,
            [userId, { action: 'selecting_quantity', categoryId: cat.category_id, categoryName: cat.name }]
        );
        
        // Show quantity selection with prices
        const quantityButtons = [
            [
                { text: `1️⃣ 1x (${formatCurrency(cat.price_1)})`, callback_data: `qty_1_${cat.category_id}` },
                { text: `2️⃣ 2x (${formatCurrency(cat.price_2)})`, callback_data: `qty_2_${cat.category_id}` },
                { text: `3️⃣ 3x (${formatCurrency(cat.price_3)})`, callback_data: `qty_3_${cat.category_id}` }
            ],
            [
                { text: `4️⃣ 4x (${formatCurrency(cat.price_4)})`, callback_data: `qty_4_${cat.category_id}` },
                { text: `5️⃣ 5x (${formatCurrency(cat.price_5)})`, callback_data: `qty_5_${cat.category_id}` },
                { text: `✏️ Custom (${formatCurrency(cat.price_custom)}/each)`, callback_data: `qty_custom_${cat.category_id}` }
            ],
            [{ text: '↩️ Back to Categories', callback_data: 'back_categories' }]
        ];
        
        const stockMessage = cat.stock > 0 ? `✅ Available Stock: ${cat.stock}` : '❌ Out of Stock';
        
        await bot.sendMessage(
            chatId,
            `📦 *Category:* ${cat.name}\n` +
            `💰 *Prices:*\n` +
            `1 Qty: ${formatCurrency(cat.price_1)}\n` +
            `2 Qty: ${formatCurrency(cat.price_2)}\n` +
            `3 Qty: ${formatCurrency(cat.price_3)}\n` +
            `4 Qty: ${formatCurrency(cat.price_4)}\n` +
            `5 Qty: ${formatCurrency(cat.price_5)}\n` +
            `Custom: ${formatCurrency(cat.price_custom)} each\n\n` +
            `${stockMessage}\n\n` +
            `*Select quantity:*`,
            {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: quantityButtons }
            }
        );
        
        userStates.delete(userId);
        
    } catch (error) {
        logger.error('Error selecting category:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again.', {
            reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
        });
        userStates.delete(userId);
    }
};

const selectQuantity = async (bot, user, message, quantity, categoryId) => {
    const chatId = message.chat.id;
    const userId = user.id;
    const messageId = message.message_id;
    
    try {
        // Delete previous message
        try {
            await bot.deleteMessage(chatId, messageId);
        } catch (e) {
            // Ignore if can't delete
        }
        
        const pool = getPool();
        
        if (quantity === 'custom') {
            await pool.query(
                `INSERT INTO user_sessions (user_id, temp_data, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id) DO UPDATE 
                 SET temp_data = $2, updated_at = NOW()`,
                [userId, { action: 'awaiting_custom_quantity', categoryId }]
            );
            
            await bot.sendMessage(
                chatId,
                '✏️ Please enter the quantity you want (maximum based on available stock):',
                {
                    reply_markup: { keyboard: [['↩️ Cancel']], resize_keyboard: true }
                }
            );
            return;
        }
        
        quantity = parseInt(quantity);
        
        // Get category details
        const category = await pool.query(
            'SELECT * FROM categories WHERE category_id = $1',
            [categoryId]
        );
        
        if (category.rows.length === 0) {
            await bot.sendMessage(chatId, '❌ Category not found.', {
                reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
            });
            return;
        }
        
        const cat = category.rows[0];
        
        // Check stock
        if (quantity > cat.stock) {
            await bot.sendMessage(chatId, `❌ Only ${cat.stock} items available. Please select a lower quantity.`, {
                reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
            });
            return;
        }
        
        // Calculate price
        let price;
        if (quantity <= 5) {
            price = cat[`price_${quantity}`];
        } else {
            price = cat.price_custom * quantity;
        }
        
        // Store order details
        await pool.query(
            `INSERT INTO user_sessions (user_id, temp_data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE 
             SET temp_data = $2, updated_at = NOW()`,
            [userId, {
                action: 'confirm_order',
                categoryId,
                categoryName: cat.name,
                quantity,
                price,
                total: price
            }]
        );
        
        // Show order summary
        const summary = `📋 *Order Summary*\n\n` +
            `*Category:* ${cat.name}\n` +
            `*Quantity:* ${quantity}\n` +
            `*Total Amount:* ${formatCurrency(price)}\n\n` +
            `Proceed to payment?`;
        
        const confirmButtons = [
            [
                { text: '✅ Confirm Order', callback_data: `confirm_order_${categoryId}` },
                { text: '❌ Cancel', callback_data: 'back_categories' }
            ]
        ];
        
        await bot.sendMessage(chatId, summary, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: confirmButtons }
        });
        
    } catch (error) {
        logger.error('Error selecting quantity:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again.', {
            reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
        });
    }
};

const processCustomQuantity = async (msg, state) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    
    try {
        if (text === '↩️ Cancel') {
            // Clear session and show categories
            const pool = getPool();
            await pool.query(
                'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
                [userId]
            );
            await showCategories(msg);
            return;
        }
        
        const quantity = parseInt(text);
        if (isNaN(quantity) || quantity <= 0) {
            await bot.sendMessage(chatId, '❌ Please enter a valid number.', {
                reply_markup: { keyboard: [['↩️ Cancel']], resize_keyboard: true }
            });
            return;
        }
        
        const pool = getPool();
        
        // Get category and check stock
        const category = await pool.query(
            'SELECT * FROM categories WHERE category_id = $1',
            [state.categoryId]
        );
        
        if (category.rows.length === 0) {
            await bot.sendMessage(chatId, '❌ Category not found.', {
                reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
            });
            return;
        }
        
        const cat = category.rows[0];
        
        if (quantity > cat.stock) {
            await bot.sendMessage(chatId, `❌ Only ${cat.stock} items available. Please enter a lower quantity.`, {
                reply_markup: { keyboard: [['↩️ Cancel']], resize_keyboard: true }
            });
            return;
        }
        
        // Calculate price
        const price = cat.price_custom * quantity;
        
        // Store order details
        await pool.query(
            `INSERT INTO user_sessions (user_id, temp_data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE 
             SET temp_data = $2, updated_at = NOW()`,
            [userId, {
                action: 'confirm_order',
                categoryId: cat.category_id,
                categoryName: cat.name,
                quantity,
                price,
                total: price
            }]
        );
        
        // Show order summary
        const summary = `📋 *Order Summary*\n\n` +
            `*Category:* ${cat.name}\n` +
            `*Quantity:* ${quantity}\n` +
            `*Total Amount:* ${formatCurrency(price)}\n\n` +
            `Proceed to payment?`;
        
        const confirmButtons = [
            [
                { text: '✅ Confirm Order', callback_data: `confirm_order_${cat.category_id}` },
                { text: '❌ Cancel', callback_data: 'back_categories' }
            ]
        ];
        
        await bot.sendMessage(chatId, summary, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: confirmButtons }
        });
        
    } catch (error) {
        logger.error('Error processing custom quantity:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again.', {
            reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
        });
    }
};

const confirmOrder = async (bot, user, message, categoryId) => {
    const chatId = message.chat.id;
    const userId = user.id;
    const messageId = message.message_id;
    
    try {
        // Delete previous message
        try {
            await bot.deleteMessage(chatId, messageId);
        } catch (e) {
            // Ignore if can't delete
        }
        
        const pool = getPool();
        
        // Get session data
        const session = await pool.query(
            'SELECT temp_data FROM user_sessions WHERE user_id = $1',
            [userId]
        );
        
        if (session.rows.length === 0 || !session.rows[0].temp_data || session.rows[0].temp_data.action !== 'confirm_order') {
            await bot.sendMessage(chatId, '❌ Session expired. Please start over.', {
                reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
            });
            return;
        }
        
        const orderData = session.rows[0].temp_data;
        
        // Check stock again
        const category = await pool.query(
            'SELECT stock FROM categories WHERE category_id = $1',
            [categoryId]
        );
        
        if (category.rows.length === 0 || category.rows[0].stock < orderData.quantity) {
            await bot.sendMessage(chatId, '❌ Sorry, the stock has changed. Please try again.', {
                reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
            });
            return;
        }
        
        // Generate order ID
        const orderId = generateOrderId();
        
        // Store in database
        await pool.query(
            `INSERT INTO orders (order_id, user_id, category_id, quantity, total_price, status, expires_at)
             VALUES ($1, $2, $3, $4, $5, 'pending', NOW() + INTERVAL '2 hours')`,
            [orderId, userId, categoryId, orderData.quantity, orderData.total]
        );
        
        // Update session with order ID
        await pool.query(
            `INSERT INTO user_sessions (user_id, temp_data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE 
             SET temp_data = $2, updated_at = NOW()`,
            [userId, { 
                action: 'awaiting_payment', 
                orderId, 
                ...orderData 
            }]
        );
        
        // Show payment QR
        const paymentMessage = `💳 *Payment Details*\n\n` +
            `*Order ID:* \`${orderId}\`\n` +
            `*Amount:* ${formatCurrency(orderData.total)}\n\n` +
            `Please scan the QR code and send payment.\n\n` +
            `After payment, click "I Have Paid" button and send the screenshot.`;

        const paymentKeyboard = {
            inline_keyboard: [
                [{ text: '💰 I Have Paid', callback_data: `paid_${orderId}` }],
                [{ text: '❌ Cancel Order', callback_data: 'back_main' }]
            ]
        };
        
        await bot.sendPhoto(chatId, PAYMENT_QR, {
            caption: paymentMessage,
            parse_mode: 'Markdown',
            reply_markup: paymentKeyboard
        });
        
    } catch (error) {
        logger.error('Error confirming order:', error);
        await bot.sendMessage(chatId, '❌ Error creating order. Please try again.', {
            reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
        });
    }
};

const paid = async (bot, user, message) => {
    const chatId = message.chat.id;
    const userId = user.id;
    const messageId = message.message_id;
    
    try {
        // Delete previous message
        try {
            await bot.deleteMessage(chatId, messageId);
        } catch (e) {
            // Ignore if can't delete
        }
        
        const pool = getPool();
        
        // Check if user has pending payment session
        const session = await pool.query(
            'SELECT temp_data FROM user_sessions WHERE user_id = $1',
            [userId]
        );
        
        if (session.rows.length === 0 || !session.rows[0].temp_data || session.rows[0].temp_data.action !== 'awaiting_payment') {
            await bot.sendMessage(
                chatId,
                '❌ No pending payment found. Please start a new order.',
                {
                    reply_markup: {
                        keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']],
                        resize_keyboard: true
                    }
                }
            );
            return;
        }
        
        await bot.sendMessage(
            chatId,
            '📤 Please send your payment screenshot.\n\nAfter sending screenshot, you will need to provide the UTR/Transaction ID.',
            {
                reply_markup: { keyboard: [['↩️ Cancel Order']], resize_keyboard: true }
            }
        );
        
    } catch (error) {
        logger.error('Error in paid:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again.', {
            reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
        });
    }
};

const processUTR = async (msg, state) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    
    try {
        if (text === '↩️ Cancel Order') {
            // Clear session
            const pool = getPool();
            await pool.query(
                'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
                [userId]
            );
            
            await bot.sendMessage(
                chatId,
                '❌ Order cancelled.',
                {
                    reply_markup: {
                        keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']],
                        resize_keyboard: true
                    }
                }
            );
            return;
        }
        
        if (!isValidUTR(text)) {
            await bot.sendMessage(
                chatId,
                '❌ Invalid UTR format. Please enter a valid UTR/Transaction ID (8-20 characters, alphanumeric).',
                {
                    reply_markup: { keyboard: [['↩️ Cancel Order']], resize_keyboard: true }
                }
            );
            return;
        }
        
        const pool = getPool();
        
        // Check if UTR already used
        const utrCheck = await pool.query(
            'SELECT * FROM utr_tracking WHERE utr_number = $1',
            [text]
        );
        
        if (utrCheck.rows.length > 0) {
            await bot.sendMessage(
                chatId,
                '❌ This UTR number has already been used.',
                {
                    reply_markup: { keyboard: [['↩️ Cancel Order']], resize_keyboard: true }
                }
            );
            return;
        }
        
        // Get session data
        const session = await pool.query(
            'SELECT temp_data FROM user_sessions WHERE user_id = $1',
            [userId]
        );
        
        if (session.rows.length === 0 || !session.rows[0].temp_data) {
            await bot.sendMessage(chatId, '❌ Session expired. Please start over.', {
                reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
            });
            return;
        }
        
        const orderData = session.rows[0].temp_data;
        
        // Update order with UTR and screenshot
        await pool.query(
            `UPDATE orders 
             SET utr_number = $2, screenshot_file_id = $3, updated_at = NOW()
             WHERE order_id = $1`,
            [orderData.orderId, text, orderData.screenshot]
        );
        
        // Track UTR
        await pool.query(
            'INSERT INTO utr_tracking (utr_number, order_id, user_id) VALUES ($1, $2, $3)',
            [text, orderData.orderId, userId]
        );
        
        // Get order details for notification
        const order = await pool.query(
            `SELECT o.*, c.name as category_name, u.username, u.first_name
             FROM orders o
             JOIN categories c ON o.category_id = c.category_id
             JOIN users u ON o.user_id = u.user_id
             WHERE o.order_id = $1`,
            [orderData.orderId]
        );
        
        if (order.rows.length > 0) {
            const orderInfo = order.rows[0];
            
            const adminMessage = `🆕 *New Order Submitted!*\n\n` +
                `*Order ID:* \`${orderInfo.order_id}\`\n` +
                `*User:* ${orderInfo.first_name} (@${orderInfo.username || 'N/A'})\n` +
                `*User ID:* \`${orderInfo.user_id}\`\n` +
                `*Category:* ${orderInfo.category_name}\n` +
                `*Quantity:* ${orderInfo.quantity}\n` +
                `*Total:* ${formatCurrency(orderInfo.total_price)}\n` +
                `*UTR:* \`${text}\`\n\n` +
                `Please review and take action:`;

            const adminButtons = {
                inline_keyboard: [
                    [
                        { text: '✅ Accept Payment', callback_data: `admin_accept_${orderInfo.order_id}` },
                        { text: '❌ Reject', callback_data: `admin_reject_${orderInfo.order_id}` }
                    ]
                ]
            };
            
            // Send screenshot to admin
            if (orderData.screenshot) {
                await bot.sendPhoto(process.env.ADMIN_ID, orderData.screenshot, {
                    caption: adminMessage,
                    parse_mode: 'Markdown',
                    reply_markup: adminButtons
                });
            } else {
                await bot.sendMessage(process.env.ADMIN_ID, adminMessage, {
                    parse_mode: 'Markdown',
                    reply_markup: adminButtons
                });
            }
            
            // Send notification to channel
            await bot.sendMessage(
                CHANNELS.NOTIFY_ID,
                `🎯 *New Order Submitted*\n` +
                `Order ID: \`${orderInfo.order_id}\`\n` +
                `Amount: ${formatCurrency(orderInfo.total_price)}\n` +
                `Status: Pending Approval`
            );
        }
        
        // Clear session
        await pool.query(
            'UPDATE user_sessions SET temp_data = NULL WHERE user_id = $1',
            [userId]
        );
        
        // Thank you message
        await bot.sendMessage(
            chatId,
            `✅ *Order Submitted Successfully!*\n\n` +
            `*Order ID:* \`${orderData.orderId}\`\n` +
            `*Amount:* ${formatCurrency(orderData.total)}\n\n` +
            `Your order has been sent to admin for verification.\n` +
            `You will receive your vouchers once payment is confirmed.\n\n` +
            `Thank you for your purchase!`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']],
                    resize_keyboard: true
                }
            }
        );
        
    } catch (error) {
        logger.error('Error processing UTR:', error);
        await bot.sendMessage(chatId, '❌ Error processing payment. Please try again.', {
            reply_markup: { keyboard: [['🛒 Buy Voucher', '🔁 Recover Vouchers'], ['📦 My Orders', '📜 Disclaimer'], ['🆘 Support']], resize_keyboard: true }
        });
    }
};

module.exports = {
    showCategories,
    selectCategory,
    selectQuantity,
    processCustomQuantity,
    confirmOrder,
    paid,
    processUTR
};
