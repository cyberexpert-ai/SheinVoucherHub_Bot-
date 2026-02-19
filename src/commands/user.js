const db = require('../database/database');

let userState = {};

async function buyVouchers(bot, msg) {
    const chatId = msg.chat.id;
    const categories = db.getCategories();
    
    if (categories.length === 0) {
        return bot.sendMessage(chatId, '❌ No categories available.');
    }
    
    const keyboard = {
        inline_keyboard: categories.map(cat => {
            const name = cat.name.replace(' Voucher', '');
            return [{
                text: `💰 ${name} - ₹${cat.price} (${cat.stock} left)`,
                callback_data: `select_cat_${cat.id}`
            }];
        }).concat([[{ text: '🔙 Back', callback_data: 'back_to_main' }]])
    };
    
    await bot.sendMessage(chatId, '🛒 **Select Category**', {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function selectCategory(bot, chatId, userId, categoryId) {
    const cat = db.getCategory(categoryId);
    
    if (!cat || cat.stock <= 0) {
        return bot.sendMessage(chatId, '❌ Out of stock!');
    }
    
    const name = cat.name.replace(' Voucher', '');
    
    userState[userId] = {
        categoryId: cat.id,
        categoryName: cat.name,
        displayName: name,
        price: cat.price,
        maxStock: cat.stock
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
        `📦 **${name}**\n💰 ₹${cat.price}\n📊 ${cat.stock} left\n\nQuantity:`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
    );
}

async function selectQuantity(bot, chatId, userId, quantity) {
    if (quantity === 'custom') {
        userState[userId].awaitingQty = true;
        return bot.sendMessage(chatId, '📝 Enter quantity:', {
            reply_markup: { force_reply: true }
        });
    }
    
    const state = userState[userId];
    const qty = parseInt(quantity);
    
    if (qty > state.maxStock) {
        return bot.sendMessage(chatId, `❌ Only ${state.maxStock} available!`);
    }
    
    const total = qty * state.price;
    const orderId = db.createOrder(userId, state.categoryId, qty, total, 'pending');
    
    await bot.sendMessage(chatId, 
        `✅ Order Created!\n\nID: \`${orderId}\`\nAmount: ₹${total}\n\nAdmin will contact you for payment.`,
        { parse_mode: 'Markdown' }
    );
    
    delete userState[userId];
}

async function myOrders(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const orders = db.getUserOrders(userId);
    
    if (orders.length === 0) {
        return bot.sendMessage(chatId, '📦 No orders yet.', {
            reply_markup: { keyboard: [['🔙 Back']], resize_keyboard: true }
        });
    }
    
    let text = '📦 **Your Orders**\n\n';
    orders.slice(-5).reverse().forEach(o => {
        const status = o.status === 'delivered' ? '✅' : '⏳';
        text += `\`${o.id}\` - ₹${o.totalPrice} ${status}\n`;
    });
    
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
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
    await bot.sendMessage(msg.chat.id, 
        '📜 **Terms**\n• No refunds after delivery\n• Fake payment = ban',
        { parse_mode: 'Markdown', reply_markup: { keyboard: [['🔙 Back']], resize_keyboard: true } }
    );
}

module.exports = {
    buyVouchers,
    selectCategory,
    selectQuantity,
    myOrders,
    recoverVouchers,
    support,
    disclaimer
};
