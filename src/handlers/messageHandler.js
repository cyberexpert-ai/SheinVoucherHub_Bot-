const db = require('../database/database');
const startCommand = require('../commands/start');
const { showCategories } = require('../commands/user/buyVoucher');
const { showOrders } = require('../commands/user/myOrders');
const { startRecovery, processRecovery } = require('../commands/user/recoverVoucher');
const { startSupport, forwardToAdmin } = require('../commands/user/support');
const { showDisclaimer } = require('../commands/user/disclaimer');
const { requestUtr, submitOrder } = require('../commands/user/buyVoucher');
const { isAdmin } = require('../middlewares/auth');
const constants = require('../utils/constants');
const helpers = require('../utils/helpers');

async function handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    // Auto delete old messages
    if (global.lastMessages && global.lastMessages[userId] && msg.message_id !== global.lastMessages[userId]) {
        try {
            await bot.deleteMessage(chatId, global.lastMessages[userId]);
        } catch (error) {
            // Ignore deletion errors
        }
    }
    
    // Check if user is waiting for input
    if (global.waitingFor && global.waitingFor[userId]) {
        await handleWaitingInput(bot, msg);
        return;
    }
    
    // Handle commands
    if (text === '/start') {
        await startCommand(bot, msg);
        return;
    }
    
    // Handle main menu buttons
    switch (text) {
        case constants.MAIN_MENU.BUY:
            await showCategories(bot, chatId, userId);
            break;
            
        case constants.MAIN_MENU.ORDERS:
            await showOrders(bot, chatId, userId);
            break;
            
        case constants.MAIN_MENU.RECOVER:
            await startRecovery(bot, chatId, userId);
            break;
            
        case constants.MAIN_MENU.DISCLAIMER:
            await showDisclaimer(bot, chatId, userId);
            break;
            
        case constants.MAIN_MENU.SUPPORT:
            await startSupport(bot, chatId, userId);
            break;
            
        case constants.BUTTONS.BACK:
            // Go back to main menu
            const welcomeMsg = await bot.sendMessage(chatId, constants.WELCOME_MESSAGE, {
                reply_markup: {
                    keyboard: [
                        [constants.MAIN_MENU.BUY, constants.MAIN_MENU.RECOVER],
                        [constants.MAIN_MENU.ORDERS, constants.MAIN_MENU.DISCLAIMER],
                        [constants.MAIN_MENU.SUPPORT]
                    ],
                    resize_keyboard: true
                }
            });
            global.lastMessages[userId] = welcomeMsg.message_id;
            break;
            
        case constants.BUTTONS.LEAVE:
            // Clear keyboard
            const leaveMsg = await bot.sendMessage(chatId, '👋 Goodbye! Send /start to return.', {
                reply_markup: { remove_keyboard: true }
            });
            global.lastMessages[userId] = leaveMsg.message_id;
            break;
            
        default:
            // Unknown command
            const unknownMsg = await bot.sendMessage(chatId,
                '❌ Unknown command. Please use the buttons below.',
                {
                    reply_markup: {
                        keyboard: [
                            [constants.MAIN_MENU.BUY, constants.MAIN_MENU.RECOVER],
                            [constants.MAIN_MENU.ORDERS, constants.MAIN_MENU.DISCLAIMER],
                            [constants.MAIN_MENU.SUPPORT]
                        ],
                        resize_keyboard: true
                    }
                }
            );
            global.lastMessages[userId] = unknownMsg.message_id;
    }
}

async function handleWaitingInput(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const waiting = global.waitingFor[userId];
    
    // Delete the waiting prompt
    try {
        await bot.deleteMessage(chatId, waiting.messageId);
    } catch (error) {
        // Ignore
    }
    
    switch (waiting.type) {
        case 'screenshot':
            if (msg.photo) {
                const photoId = msg.photo[msg.photo.length - 1].file_id;
                await require('../commands/user/buyVoucher').requestUtr(bot, chatId, userId, photoId);
            } else {
                await bot.sendMessage(chatId, '❌ Please send a screenshot.');
            }
            break;
            
        case 'utr':
            if (text && helpers.validateUtr(text)) {
                await submitOrder(bot, chatId, userId, text);
            } else {
                await bot.sendMessage(chatId, '❌ Invalid UTR format. Please enter a valid UTR/Transaction ID.');
            }
            break;
            
        case 'recovery_order_id':
            await processRecovery(bot, chatId, userId, text);
            delete global.waitingFor[userId];
            break;
            
        case 'support_message':
            await forwardToAdmin(bot, chatId, userId, text, msg.message_id);
            delete global.waitingFor[userId];
            break;
            
        case 'custom_quantity':
            const quantity = parseInt(text);
            const categoryId = waiting.categoryId;
            const category = await db.getCategory(categoryId);
            const availableStock = await db.getVoucherCount(categoryId, false);
            
            if (isNaN(quantity) || quantity < 1) {
                await bot.sendMessage(chatId, '❌ Please enter a valid quantity (minimum 1).');
                return;
            }
            
            if (quantity > availableStock) {
                await bot.sendMessage(chatId, `❌ Only ${availableStock} codes available. Please enter a smaller quantity.`);
                return;
            }
            
            await require('../commands/user/buyVoucher').showPayment(bot, chatId, userId, categoryId, quantity);
            delete global.waitingFor[userId];
            break;
            
        default:
            delete global.waitingFor[userId];
    }
}

module.exports = {
    handleMessage
};
