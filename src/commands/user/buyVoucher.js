const db = require('../../database/database');
const { deletePreviousMessage } = require('../../utils/helpers');
const paymentHandler = require('../../handlers/paymentHandler');

let userState = {};

// ==================== BUY VOUCHERS ====================
async function buyVouchers(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    await deletePreviousMessage(bot, chatId, userId);
    
    const categories = db.getCategories();
    
    if (categories.length === 0) {
        return bot.sendMessage(chatId, '❌ No categories available at the moment.');
    }
    
    const keyboard = {
        inline_keyboard: categories.map(cat => {
            const availableVouchers = db.getAvailableVouchersCount(cat.id);
            return [{
                text: `${cat.name} (Stock: ${availableVouchers})`,
                callback_data: `select_cat_${cat.id}`
            }];
        }).concat([[{ text: '← Back', callback_data: 'back_to_main' }]])
    };
    
    await bot.sendMessage(chatId, '**Choose Voucher Type From Below**', {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function selectCategory(bot, chatId, userId, categoryId) {
    await deletePreviousMessage(bot, chatId, userId);
    
    const cat = db.getCategory(categoryId);
    const availableVouchers = db.getAvailableVouchersCount(categoryId);
    
    if (!cat || availableVouchers <= 0) {
        return bot.sendMessage(chatId, '❌ This category is out of stock!');
    }
    
    const prices = cat.prices;
    
    userState[userId] = {
        categoryId: cat.id,
        categoryName: cat.name,
        availableVouchers: availableVouchers,
        prices: prices,
        step: 'selecting_quantity'
    };
    
    let priceText = `**${cat.name}**\n`;
    priceText += `Available stock: ${availableVouchers} codes\n\n`;
    priceText += `**Available Packages (per-code):**\n`;
    
    const quantities = Object.keys(prices).map(Number).sort((a, b) => a - b);
    quantities.forEach(qty => {
        priceText += `- ${qty} Code${qty > 1 ? 's' : ''} → ₹${prices[qty]}.00 / code\n`;
    });
    
    priceText += `\n**Select quantity:**`;
    
    const qtyButtons = quantities.map(qty => {
        return [{ text: `${qty} code${qty > 1 ? 's' : ''}`, callback_data: `qty_${qty}` }];
    });
    
    qtyButtons.push([{ text: 'Other amount', callback_data: 'qty_custom' }]);
    qtyButtons.push([{ text: 'Back', callback_data: 'back_to_categories' }]);
    
    const keyboard = {
        inline_keyboard: qtyButtons
    };
    
    await bot.sendMessage(chatId, priceText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function selectQuantity(bot, chatId, userId, quantity) {
    await deletePreviousMessage(bot, chatId, userId);
    
    if (quantity === 'custom') {
        userState[userId].step = 'awaiting_qty';
        return bot.sendMessage(chatId, '📝 **Enter quantity** (max available):\n\nExample: `7`', {
            parse_mode: 'Markdown',
            reply_markup: { force_reply: true }
        });
    }
    
    const state = userState[userId];
    const qty = parseInt(quantity);
    
    if (qty > state.availableVouchers) {
        return bot.sendMessage(chatId, `❌ Only ${state.availableVouchers} codes available!`);
    }
    
    const pricePerCode = db.getPriceForQuantity(state.categoryId, qty);
    const total = pricePerCode * qty;
    
    const orderId = db.createOrder(userId, state.categoryId, qty, total);
    
    userState[userId] = {
        ...state,
        orderId,
        quantity: qty,
        total,
        pricePerCode,
        step: 'payment'
    };
    
    await paymentHandler.sendPaymentInstructions(bot, chatId, userId, state.categoryName, qty, total, pricePerCode, orderId);
}

async function handleCustomQuantity(bot, chatId, userId, text) {
    const state = userState[userId];
    const qty = parseInt(text);
    
    if (isNaN(qty) || qty < 1) {
        await bot.sendMessage(chatId, '❌ Please enter a valid positive number!', {
            reply_markup: { force_reply: true }
        });
        return;
    }
    
    if (qty > state.availableVouchers) {
        await bot.sendMessage(chatId, `❌ Only ${state.availableVouchers} codes available!`, {
            reply_markup: { force_reply: true }
        });
        return;
    }
    
    const pricePerCode = db.getPriceForQuantity(state.categoryId, qty);
    const total = pricePerCode * qty;
    
    const confirmMsg = `📊 **Price Calculation**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nCategory: ${state.categoryName}\nQuantity: ${qty} codes\nPrice per code: ₹${pricePerCode}\nTotal Amount: ₹${total}\n\nDo you want to proceed?`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '✅ Yes, Proceed', callback_data: `confirm_qty_${qty}` },
                { text: '❌ No, Cancel', callback_data: 'back_to_categories' }
            ]
        ]
    };
    
    userState[userId].tempQty = qty;
    userState[userId].tempTotal = total;
    userState[userId].tempPricePerCode = pricePerCode;
    userState[userId].step = 'confirming_qty';
    
    await bot.sendMessage(chatId, confirmMsg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
}

async function confirmQuantity(bot, chatId, userId, qty) {
    await deletePreviousMessage(bot, chatId, userId);
    
    const state = userState[userId];
    
    const orderId = db.createOrder(userId, state.categoryId, qty, state.tempTotal);
    
    userState[userId] = {
        ...state,
        orderId,
        quantity: qty,
        total: state.tempTotal,
        pricePerCode: state.tempPricePerCode,
        step: 'payment'
    };
    
    await paymentHandler.sendPaymentInstructions(bot, chatId, userId, state.categoryName, qty, state.tempTotal, state.tempPricePerCode, orderId);
}

module.exports = {
    buyVouchers,
    selectCategory,
    selectQuantity,
    handleCustomQuantity,
    confirmQuantity,
    userState
};
