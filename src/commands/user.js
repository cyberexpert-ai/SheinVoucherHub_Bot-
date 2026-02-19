const { 
    getCategories, 
    getUserOrders, 
    getOrder,
    createOrder
} = require('../sheets/googleSheets');
const { initiateManualPayment } = require('../handlers/paymentHandler');

let userState = {};

async function buyVouchers(bot, msg) {
    const chatId = msg.chat.id;
    const categories = await getCategories();
    
    if (categories.length === 0) {
        return bot.sendMessage(chatId, '❌ No categories available.');
    }
    
    const keyboard = {
        inline_keyboard: categories.map(cat => {
            const match = cat.name.match(/₹(\d+)/);
            const displayName = match ? match[1] : cat.name;
            
            return [{
                text: `💰 ₹${displayName} - ₹${cat.price_per_code} (${cat.stock} left)`,
                callback_data: `select_cat_${cat.category_id}`
            }];
        }).concat([[{ text: '🔙 Back', callback_data: 'back_to_main' }]])
    };
    
    await bot.sendMessage(chatId, '🛒 **Select Category**', {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function selectCategory(bot, chatId, userId, categoryId) {
    const categories = await getCategories();
    const category = categories.find(c => c.category_id === categoryId);
    
    if (!category || parseInt(category.stock) <= 0) {
        return bot.sendMessage(chatId, '❌ Out of stock!');
    }
    
    const match = category.name.match(/₹(\d+)/);
    const displayName = match ? match[1] : category.name;
    
    userState[userId] = { 
        categoryId: category.category_id,
        categoryName: category.name,
        displayName,
        price: category.price_per_code,
        maxStock: category.stock
    };
    
    const keyboard = {
        inline_keyboard: [
            [
                { text: '1', callback_data: 'qty_1' },
                { text: '2', callback_data: 'qty_2' },
                { text: '3', callback_data: 'qty_3' }
            ],
            [
                { text: '4', callback_data: 'qty_4' },
                { text: '5', callback_data: 'qty_5' },
                { text: 'Custom', callback_data: 'qty_custom' }
            ],
            [{ text: '🔙 Back', callback_data: 'back_to_categories' }]
        ]
    };
    
    await bot.sendMessage(chatId, 
        `📦 **₹${displayName}**\n💰 ₹${category.price_per_code}\n📊 ${category.stock} left\n\nSelect quantity:`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
    );
}

async function selectQuantity(bot, chatId, userId, quantity) {
    if (quantity === 'custom') {
        userState[userId].awaitingQty = true;
        return bot.sendMessage(chatId, '📝 Enter quantity:', { reply_markup: { force_reply: true } });
    }
    
    const state = userState[userId];
    const qty = parseInt(quantity);
    
    if (qty > parseInt(state.maxStock)) {
        return bot.sendMessage(chatId, `❌ Only ${state.maxStock} available!`);
    }
    
    const totalPrice = qty * parseInt(state.price);
    const orderId = await createOrder(userId, state.categoryId, qty, totalPrice, 'pending');
    
    state.orderId = orderId;
    state.quantity = qty;
    state.totalPrice = totalPrice;
    
    await bot.sendMessage(chatId, 
        `✅ Order created: \`${orderId}\`\nAmount: ₹${totalPrice}\n\nAdmin will contact you for payment.`,
        { parse_mode: 'Markdown' }
    );
}

async function myOrders(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const orders = await getUserOrders(userId);
    
    if (orders.length === 0) {
        return bot.sendMessage(chatId, '📦 No orders yet.', {
            reply_markup: { keyboard: [['🔙 Back']], resize_keyboard: true }
        });
    }
    
    let message = '📦 **Your Orders**\n\n';
    orders.slice(0, 5).forEach(order => {
        const statusEmoji = order.status === 'delivered' ? '✅' : '⏳';
        message += `\`${order.order_id}\` - ₹${order.total_price} ${statusEmoji}\n`;
    });
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

async function viewOrder(bot, chatId, orderId) {
    const order = await getOrder(orderId);
    if (!order) return;
    
    const message = `📦 **Order:** \`${order.order_id}\`\n📅 ${new Date(order.order_date).toLocaleString()}\n📦 ${order.category}\n🔢 ${order.quantity}\n💰 ₹${order.total_price}\n📊 ${order.status}`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

async function recoverVouchers(bot, msg) {
    await bot.sendMessage(msg.chat.id, '🔁 Send your Order ID:', {
        reply_markup: { keyboard: [['🔙 Back']], resize_keyboard: true }
    });
    userState[msg.from.id] = { action: 'recovery' };
}

async function support(bot, msg) {
    await bot.sendMessage(msg.chat.id, '🆘 Contact @SheinSupportRobot', {
        reply_markup: { keyboard: [['🔙 Back']], resize_keyboard: true }
    });
}

async function disclaimer(bot, msg) {
    await bot.sendMessage(msg.chat.id, '📜 **Terms:**\n• No refunds after delivery\n• Fake payment = ban', {
        parse_mode: 'Markdown',
        reply_markup: { keyboard: [['🔙 Back']], resize_keyboard: true }
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
    disclaimer,
    userState
};
