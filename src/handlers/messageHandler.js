const { startCommand, handleCaptchaResponse } = require("../commands/start");
const { adminCommand } = require("../commands/admin");
const { buyVoucher } = require("../commands/user/buyVoucher");
const { myOrders } = require("../commands/user/myOrders");
const { recoverVoucher, processRecovery } = require("../commands/user/recoverVoucher");
const { support, processSupportMessage } = require("../commands/user/support");
const { disclaimer } = require("../commands/user/disclaimer");
const { checkUserBlock } = require("../middlewares/auth");

async function messageHandler(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Check if user is blocked
    const blockStatus = await checkUserBlock(userId);
    if (blockStatus.blocked) {
        let blockMessage = "🚫 *You are blocked*\n\n";
        blockMessage += `Reason: ${blockStatus.reason}\n`;
        
        if (blockStatus.temporary) {
            blockMessage += `Blocked until: ${blockStatus.until}`;
        }

        const supportKeyboard = {
            inline_keyboard: [
                [{ text: "🆘 Contact Support", url: "https://t.me/SheinSupportRobot" }]
            ]
        };

        await bot.sendMessage(chatId, blockMessage, {
            parse_mode: "Markdown",
            reply_markup: supportKeyboard
        });
        return;
    }

    // Handle captcha response
    if (await handleCaptchaResponse(bot, msg)) {
        return;
    }

    // Handle support messages
    if (await processSupportMessage(bot, msg)) {
        return;
    }

    // Handle recovery messages
    const recoverySession = global.userSessions?.get(`recover_${userId}`);
    if (recoverySession && recoverySession.step === "waiting_order_id") {
        await processRecovery(bot, chatId, userId, text);
        global.userSessions.delete(`recover_${userId}`);
        return;
    }

    // Handle custom quantity
    const buySession = global.userSessions?.get(`buy_${userId}`);
    if (buySession && buySession.step === "custom_quantity") {
        const quantity = parseInt(text);
        if (isNaN(quantity) || quantity < 1 || quantity > 100) {
            await bot.sendMessage(chatId, "❌ Please enter a valid number between 1 and 100");
            return;
        }
        
        const { selectQuantity } = require("../commands/user/buyVoucher");
        await selectQuantity(bot, chatId, userId, buySession.category, quantity);
        global.userSessions.delete(`buy_${userId}`);
        return;
    }

    // Handle commands
    switch (text) {
        case "/start":
            await startCommand(bot, msg);
            break;
            
        case "/admin":
        case "👑 Admin Panel":
            await adminCommand(bot, msg);
            break;
            
        case "🛒 Buy Voucher":
            await buyVoucher(bot, msg);
            break;
            
        case "📦 My Orders":
            await myOrders(bot, msg);
            break;
            
        case "🔁 Recover Vouchers":
            await recoverVoucher(bot, msg);
            break;
            
        case "🆘 Support":
            await support(bot, msg);
            break;
            
        case "📜 Disclaimer":
            await disclaimer(bot, msg);
            break;
            
        case "↩️ Back":
        case "🏠 Main Menu":
            const { showWelcomeMessage } = require("../commands/start");
            await showWelcomeMessage(bot, chatId, userId);
            break;
            
        default:
            // Check if it's a recovery attempt
            if (text && text.startsWith("SVH-")) {
                await processRecovery(bot, chatId, userId, text);
            } else {
                await bot.sendMessage(chatId,
                    "❌ *Unknown command*\n\nPlease use the keyboard buttons or /start",
                    { parse_mode: "Markdown" }
                );
            }
            break;
    }
}

module.exports = messageHandler;
