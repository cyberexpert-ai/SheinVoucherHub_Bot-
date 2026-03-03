const { getPool } = require('../../database/database');
const logger = require('../../utils/logger');
const { generateOrderId, formatCurrency, isValidUTR, calculatePrice } = require('../../utils/helpers');
const { PAYMENT_QR, BUTTONS, MESSAGES, CHANNELS } = require('../../utils/constants');

const showCategories = async (msg) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    try {
        const pool = getPool();
        
        // Get active categories with stock
        const categories = await pool.query(
            'SELECT category_id, name, stock FROM categories WHERE is_active = true AND stock > 0 ORDER BY category_id'
        );
        
        if (categories.rows.length === 0) {
            await bot.sendMessage(chatId, '❌ No vouchers available at the moment.', {
                reply_markup: { keyboard: [['↩️ Back']], resize_keyboard: true }
            });
            return;
        }
        
        // Create category buttons
        const buttons = categories.rows.map(cat => [
            { text: `${cat.name} (Stock: ${cat.stock})`, callback_data: `category_${cat.category_id}` }
        ]);
        
        buttons.push([{ text: '↩️ Back', callback_data: 'back_main' }]);
        
        await bot.sendMessage(
            chatId,
            '🛒 Select voucher category:',
            {
                reply_markup: { inline_keyboard: buttons }
            }
        );
        
    } catch (error) {
        logger.error('Error showing categories:', error);
        await bot.sendMessage(chatId, '❌ Error loading categories. Please try again.');
    }
};

const selectCategory = async (bot, user, message, categoryId) => {
    const chatId = message.chat.id;
    const userId = user.id;
    
    try {
        const pool = getPool();
        
        // Get category details
        const category = await pool.query(
            'SELECT * FROM categories WHERE category_id = $1 AND is_active = true',
            [categoryId]
        );
        
        if (category.rows.length === 0) {
            await bot.sendMessage(chatId, '❌ Category not found.');
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
        
        // Show quantity selection
        const quantityButtons = [
            [
                { text: '1', callback_data: `qty_1_${cat.category_id}` },
                { text: '2', callback_data: `qty_2_${cat.category_id}` },
                { text: '3', callback_data: `qty_3_${cat.category_id}` }
            ],
            [
                { text: '4', callback_data: `qty_4_${cat.category_id}` },
                { text: '5', callback_data: `qty_5_${cat.category_id}` },
                { text: 'Custom', callback_data: `qty_custom_${cat.category_id}` }
            ],
            [{ text: '↩️ Back', callback_data: 'back_categories' }]
        ];
        
        await bot.sendMessage(
            chatId,
            `📦 Category: ${cat.name}\nAvailable Stock: ${cat.stock}\n\nSelect quantity:`,
            {
                reply_markup: { inline_keyboard: quantityButtons }
            }
        );
        
    } catch (error) {
        logger.error('Error selecting category:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again.');
    }
};

const selectQuantity = async (bot, user, message, quantity, categoryId) => {
    const chatId = message.chat.id;
    const userId = user.id;
    
    try {
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
                'Please enter quantity (max based on available stock):',
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
            await bot.sendMessage(chatId, '❌ Category not found.');
            return;
        }
        
        const cat = category.rows[0];
        
        // Check stock
        if (quantity > cat.stock) {
            await bot.sendMessage(chatId, `❌ Only ${cat.stock} items available. Please select a lower quantity.`);
            return;
        }
        
        // Calculate price
        let price;
        if (quantity <= 5) {
            price = cat[`price_${quantity}`] || cat.price_custom * quantity;
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
        const summary = `📋 Order Summary

Category: ${cat.name}
Quantity: ${quantity}
Total: ${formatCurrency(price)}

Proceed to payment?`;
        
        const confirmButtons = [
            [
                { text: '✅ Confirm', callback_data: `confirm_order_${categoryId}` },
                { text: '❌ Cancel', callback_data: 'back_categories' }
            ]
        ];
        
        await bot.sendMessage(chatId, summary, {
            reply_markup: { inline_keyboard: confirmButtons }
        });
        
    } catch (error) {
        logger.error('Error selecting quantity:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again.');
    }
};

const processCustomQuantity = async (msg, state) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    
    try {
        if (text === '↩️ Cancel') {
            await showCategories(msg);
            return;
        }
        
        const quantity = parseInt(text);
        if (isNaN(quantity) || quantity <= 0) {
            await bot.sendMessage(chatId, '❌ Please enter a valid number.');
            return;
        }
        
        const pool = getPool();
        
        // Get category and check stock
        const category = await pool.query(
            'SELECT * FROM categories WHERE category_id = $1',
            [state.categoryId]
        );
        
        if (category.rows.length === 0) {
            await bot.sendMessage(chatId, '❌ Category not found.');
            return;
        }
        
        const cat = category.rows[0];
        
        if (quantity > cat.stock) {
            await bot.sendMessage(chatId, `❌ Only ${cat.stock} items available. Please enter a lower quantity.`);
            return;
        }
        
        // Calculate price (use price_custom * quantity)
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
        const summary = `📋 Order Summary

Category: ${cat.name}
Quantity: ${quantity}
Total: ${formatCurrency(price)}

Proceed to payment?`;
        
        const confirmButtons = [
            [
                { text: '✅ Confirm', callback_data: `confirm_order_${cat.category_id}` },
                { text: '❌ Cancel', callback_data: 'back_categories' }
            ]
        ];
        
        await bot.sendMessage(chatId, summary, {
            reply_markup: { inline_keyboard: confirmButtons }
        });
        
    } catch (error) {
        logger.error('Error processing custom quantity:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again.');
    }
};

const confirmOrder = async (bot, user, message, categoryId) => {
    const chatId = message.chat.id;
    const userId = user.id;
    
    try {
        const pool = getPool();
        
        // Get session data
        const session = await pool.query(
            'SELECT temp_data FROM user_sessions WHERE user_id = $1',
            [userId]
        );
        
        if (session.rows.length === 0 || !session.rows[0].temp_data) {
            await bot.sendMessage(chatId, '❌ Session expired. Please start over.');
            return;
        }
        
        const orderData = session.rows[0].temp_data;
        
        // Generate order ID
        const orderId = generateOrderId();
        
        // Store in database
        await pool.query(
            `INSERT INTO orders (order_id, user_id, category_id, quantity, total_price, status, expires_at)
             VALUES ($1, $2, $3, $4, $5, 'pending', NOW() + INTERVAL '2 hours')`,
            [orderId, userId, categoryId, orderData.quantity, orderData.total]
        );
        
        // Update session
        await pool.query(
            `INSERT INTO user_sessions (user_id, temp_data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) DO UPDATE 
             SET temp_data = $2, updated_at = NOW()`,
            [userId, { action: 'awaiting_payment', orderId, ...orderData }]
        );
        
        // Show payment QR
        const paymentMessage = `💳 Payment Details

Order ID: ${orderId}
Amount: ${formatCurrency(orderData.total)}

Scan QR code or send payment to the address below:

Please send screenshot after payment.`;

        const paymentKeyboard = {
            inline_keyboard: [
                [{ text: '💰 Paid', callback_data: `paid_${orderId}` }],
                [{ text: '❌ Cancel', callback_data: 'back_categories' }]
            ]
        };
        
        await bot.sendPhoto(chatId, PAYMENT_QR, {
            caption: paymentMessage,
            reply_markup: paymentKeyboard
        });
        
    } catch (error) {
        logger.error('Error confirming order:', error);
        await bot.sendMessage(chatId, '❌ Error creating order. Please try again.');
    }
};

const paid = async (bot, user, message) => {
    const chatId = message.chat.id;
    const userId = user.id;
    
    try {
        await bot.sendMessage(
            chatId,
            'Please send your payment screenshot:',
            {
                reply_markup: { keyboard: [['↩️ Cancel']], resize_keyboard: true }
            }
        );
    } catch (error) {
        logger.error('Error in paid:', error);
    }
};

const processUTR = async (msg, state) => {
    const bot = global.bot;
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    
    try {
        if (text === '↩️ Cancel') {
            await showCategories(msg);
            return;
        }
        
        if (!isValidUTR(text)) {
            await bot.sendMessage(
                chatId,
                '❌ Invalid UTR format. Please enter a valid UTR/Transaction ID.'
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
            // Fraud detection - temp block
            await pool.query(
                `UPDATE users 
                 SET is_blocked = true, block_reason = 'Duplicate UTR attempt', 
                     block_expires = NOW() + INTERVAL '30 minutes'
                 WHERE user_id = $1`,
                [userId]
            );
            
            await bot.sendMessage(
                chatId,
                '⏳ You have been temporarily restricted for 30 minutes due to suspicious activity.'
            );
            return;
        }
        
        // Update order with UTR and screenshot
        await pool.query(
            `UPDATE orders 
             SET utr_number = $2, screenshot_file_id = $3, updated_at = NOW()
             WHERE order_id = $1`,
            [state.orderId, text, state.screenshot]
        );
        
        // Track UTR
        await pool.query(
            'INSERT INTO utr_tracking (utr_number, order_id, user_id) VALUES ($1, $2, $3)',
            [text, state.orderId, userId]
        );
        
        // Notify admin
        const order = await pool.query(
            `SELECT o.*, c.name as category_name, u.username, u.first_name
             FROM orders o
             JOIN categories c ON o.category_id = c.category_id
             JOIN users u ON o.user_id = u.user_id
             WHERE o.order_id = $1`,
            [state.orderId]
        );
        
        if (order.rows.length > 0) {
            const orderData = order.rows[0];
            
            const adminMessage = `🆕 New Order Submitted!

Order ID: ${orderData.order_id}
User: ${orderData.first_name} (@${orderData.username || 'N/A'})
User ID: ${orderData.user_id}
Category: ${orderData.category_name}
Quantity: ${orderData.quantity}
Total: ${formatCurrency(orderData.total_price)}
UTR: ${text}

Action required:`;

            const adminButtons = {
                inline_keyboard: [
                    [
                        { text: '✅ Accept', callback_data: `admin_accept_${orderData.order_id}` },
                        { text: '❌ Reject', callback_data: `admin_reject_${orderData.order_id}` }
                    ]
                ]
            };
            
            // Send screenshot to admin
            if (state.screenshot) {
                await bot.sendPhoto(process.env.ADMIN_ID, state.screenshot, {
                    caption: adminMessage,
                    reply_markup: adminButtons
                });
            } else {
                await bot.sendMessage(process.env.ADMIN_ID, adminMessage, {
                    reply_markup: adminButtons
                });
            }
            
            // Send notification to channel
            await bot.sendMessage(
                CHANNELS.NOTIFY_ID,
                `🎯 New Order Submitted\nOrder ID: ${orderData.order_id}\nAmount: ${formatCurrency(orderData.total_price)}`
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
            `✅ Order submitted successfully!\n\nOrder ID: ${state.orderId}\n\nYou will receive your vouchers once payment is confirmed.\n\nThank you for your purchase!`,
            {
                reply_markup: {
                    keyboard: [
                        ['🛒 Buy Voucher', '🔁 Recover Vouchers'],
                        ['📦 My Orders', '📜 Disclaimer'],
                        ['🆘 Support']
                    ],
                    resize_keyboard: true
                }
            }
        );
        
    } catch (error) {
        logger.error('Error processing UTR:', error);
        await bot.sendMessage(chatId, '❌ Error processing payment. Please try again.');
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
