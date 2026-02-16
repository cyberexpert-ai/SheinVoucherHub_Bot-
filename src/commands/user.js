const { 
    getCategories, 
    getUserOrders, 
    getOrder,
    getAvailableVouchers
} = require('../sheets/googleSheets');
const { initiatePayment } = require('../handlers/paymentHandler');

let userState = {};

async function buyVouchers(bot, msg) {
    const chatId = msg.chat.id;
    const categories = await getCategories();
    
    if (categories.length === 0) {
        return bot.sendMessage(chatId, '❌ No categories available.');
    }
    
    const keyboard = categories.map(cat => {
        const match = cat.name.match(/₹(\d+)/);
        const displayName = match ? match[1] : cat.name;
        
        return [
            { text: `💰 ${displayName} - ₹${cat.price_per_code} (${cat.stock} left)`, 
              callback_data: `select_cat_${cat.category_id}` }
        ];
    });
    
    keyboard.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);
    
    await bot.sendMessage(chatId, '🛒 Select voucher category:', {
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function selectCategory(bot, chatId, userId, categoryId) {
    const categories = await getCategories();
    const category = categories.find(c => c.category_id === categoryId);
    
    if (!category || parseInt(category.stock) <= 0) {
        return bot.sendMessage(chatId, '❌ This category is out of stock!');
    }
    
    const match = category.name.match(/₹(\d+)/);
    const displayName = match ? match[1] : category.name;
    
    userState[userId] = { 
        categoryId: category.category_id,
        categoryName: category.name,
        displayName: displayName,
        price: category.price_per_code,
        maxStock: category.stock
    };
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: '1️⃣', callback_data: 'qty_1' },
                { text: '2️⃣', callback_data: 'qty_2' },
                { text: '3️⃣', callback_data: 'qty_3' }
            ],
            [
                { text: '4️⃣', callback_data: 'qty_4' },
                { text: '5️⃣', callback_data: 'qty_5' },
                { text: '🔢 Custom', callback_data: 'qty_custom' }
            ],
            [{ text: '🔙 Back', callback_data: 'back_to_categories' }]
        ]
    };
    
    await bot.sendMessage(chatId, 
        `📦 **Selected:** ₹${displayName} Voucher
💰 **Price per code:** ₹${category.price_per_code}
📊 **Available:** ${category.stock}

Select quantity:`,
        {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        }
    );
}

async function selectQuantity(bot, chatId, userId, quantity) {
    if (quantity === 'custom') {
        userState[userId].awaitingQty = true;
        return bot.sendMessage(chatId, '📝 Enter quantity (max available):', {
            reply_markup: { force_reply: true }
        });
    }
    
    const state = userState[userId];
    const qty = parseInt(quantity);
    
    if (qty > parseInt(state.maxStock)) {
        return bot.sendMessage(chatId, `❌ Only ${state.maxStock} codes available!`);
    }
    
    const totalPrice = qty * parseInt(state.price);
    
    await initiatePayment(
        bot,
        chatId,
        userId,
        state.categoryId,
        qty,
        totalPrice,
        state.displayName
    );
}

async function myOrders(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const orders = await getUserOrders(userId);
    
    if (orders.length === 0) {
        return bot.sendMessage(chatId, '📦 You don\'t have any orders yet.', {
            reply_markup: {
                keyboard: [['🔙 Back']],
                resize_keyboard: true
            }
        });
    }
    
    let message = '📦 **Your Orders**\n━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    orders.slice(0, 5).forEach(order => {
        const statusEmoji = order.status === 'delivered' ? '✅' : 
                           order.status === 'pending_approval' ? '⏳' :
                           order.status === 'rejected' ? '❌' : '🔄';
        
        message += `🧾 \`${order.order_id}\`\n`;
        message += `🎟 Category: ${order.category} | Qty: ${order.quantity}\n`;
        message += `💰 ₹${order.total_price} | ${statusEmoji} ${order.status}\n`;
        message += `📅 ${new Date(order.order_date).toLocaleDateString()}\n\n`;
    });
    
    const keyboard = orders.slice(0, 5).map(order => [
        { text: `📦 ${order.order_id}`, callback_data: `view_order_${order.order_id}` }
    ]);
    
    keyboard.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);
    
    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
    });
}

async function viewOrder(bot, chatId, orderId) {
    const order = await getOrder(orderId);
    
    if (!order) return;
    
    let message = `📦 **Order Details**
━━━━━━━━━━━━━━━━━━━━━

**Order ID:** \`${order.order_id}\`
**Date:** ${new Date(order.order_date).toLocaleString()}
**Category:** ${order.category}
**Quantity:** ${order.quantity}
**Total:** ₹${order.total_price}
**Status:** ${order.status === 'delivered' ? '✅ Delivered' : 
             order.status === 'pending_approval' ? '⏳ Pending Approval' :
             order.status === 'rejected' ? '❌ Rejected' : '🔄 Processing'}`;
    
    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔙 Back to Orders', callback_data: 'back_to_orders' }]
            ]
        }
    });
}

async function recoverVouchers(bot, msg) {
    const chatId = msg.chat.id;
    
    const message = `🔁 **Recover Vouchers**

Send your Order ID
Example: \`SVH-1234567890-ABC123\`

⚠️ Recovery available within 2 hours of purchase`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['🔙 Back']],
            resize_keyboard: true
        }
    });
    
    userState[msg.from.id] = { action: 'recovery' };
}

async function support(bot, msg) {
    const chatId = msg.chat.id;
    
    const message = `🆘 **Support**

For any issues, please contact our support robot:

👉 **@SheinSupportRobot**

They will assist you within 24 hours.

Thank you for using Shein Voucher Hub!`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📢 Contact Support', url: 'https://t.me/SheinSupportRobot' }]
            ],
            keyboard: [['🔙 Back']],
            resize_keyboard: true
        }
    });
}

async function disclaimer(bot, msg) {
    const chatId = msg.chat.id;
    
    const message = `📜 **Disclaimer**

• All coupons given are 100% OFF upto voucher amount with NO minimum order amount required.
• Contact Support if you're facing any issue with vouchers.
• Only replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.
• No returns.
• Refund will be only given if vouchers are out of stock.
• Fake payment attempts will result in permanent ban.`;

    await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [['🔙 Back']],
            resize_keyboard: true
        }
    });
}

module.exports = {
    buyVouchers,
    selectCategory,
    selectQuantity,
    myOrders,
    viewOrder,
    recoverVouchers,
    support,
    disclaimer
};
