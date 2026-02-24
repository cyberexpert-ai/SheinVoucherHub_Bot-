const { registerUser } = require("../middlewares/auth");
const { checkUserBlock } = require("../middlewares/auth");
const { generateCaptcha, verifyCaptcha } = require("../utils/captcha");

async function startCommand(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = msg.from;

    // Register user in database
    await registerUser(user);

    // Check if user is blocked
    const blockStatus = await checkUserBlock(userId);
    if (blockStatus.blocked) {
        let blockMessage = "🚫 *You are blocked from using this bot*\n\n";
        blockMessage += `Reason: ${blockStatus.reason}\n`;
        
        if (blockStatus.temporary) {
            blockMessage += `Blocked until: ${blockStatus.until}\n\n`;
            blockMessage += "For support, contact @SheinSupportRobot";
        } else {
            blockMessage += "\nThis is a permanent block.";
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

    // Check if this is a new start (no active session)
    const sessionKey = `session_${userId}`;
    const hasSession = await global.botSession?.get(sessionKey);

    if (!hasSession) {
        // Show captcha for new users
        const captcha = await generateCaptcha();
        
        // Store captcha in session
        if (!global.botSession) global.botSession = new Map();
        global.botSession.set(sessionKey, {
            step: "captcha",
            captcha: captcha.text,
            messageIds: []
        });

        const captchaMessage = await bot.sendPhoto(chatId, captcha.image, {
            caption: "🔐 *Verification Required*\n\nPlease enter the numbers shown in the image above.\n\nThis is to prevent bots.",
            parse_mode: "Markdown",
            reply_markup: {
                force_reply: true
            }
        });

        // Store message ID for later deletion
        const session = global.botSession.get(sessionKey);
        session.messageIds.push(captchaMessage.message_id);
        global.botSession.set(sessionKey, session);

        return;
    }

    // Show welcome message
    await showWelcomeMessage(bot, chatId, userId);
}

async function showWelcomeMessage(bot, chatId, userId) {
    const welcomeMessage = `🎯 *Welcome to Shein Voucher Hub!*

🚀 Get exclusive Shein vouchers at the best prices!

📌 *Choose an option below:*`;

    const mainKeyboard = {
        reply_markup: {
            keyboard: [
                ["🛒 Buy Voucher"],
                ["🔁 Recover Vouchers", "📦 My Orders"],
                ["📜 Disclaimer", "🆘 Support"]
            ],
            resize_keyboard: true
        }
    };

    // Delete previous messages if any
    const sessionKey = `session_${userId}`;
    const session = global.botSession?.get(sessionKey);
    if (session?.messageIds) {
        for (const msgId of session.messageIds) {
            try {
                await bot.deleteMessage(chatId, msgId);
            } catch (e) {}
        }
    }

    const sentMsg = await bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: "Markdown",
        ...mainKeyboard
    });

    // Update session
    if (!global.botSession) global.botSession = new Map();
    global.botSession.set(sessionKey, {
        step: "main_menu",
        messageIds: [sentMsg.message_id]
    });
}

async function handleCaptchaResponse(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const sessionKey = `session_${userId}`;
    const session = global.botSession?.get(sessionKey);

    if (!session || session.step !== "captcha") {
        return false;
    }

    if (text === session.captcha) {
        // Captcha verified
        await bot.sendMessage(chatId, "✅ *Verification successful!*", {
            parse_mode: "Markdown"
        });

        // Update session
        session.step = "verified";
        global.botSession.set(sessionKey, session);

        // Show welcome message
        await showWelcomeMessage(bot, chatId, userId);
        return true;
    } else {
        // Wrong captcha
        await bot.sendMessage(chatId, "❌ *Wrong code!*\n\nPlease try again with /start", {
            parse_mode: "Markdown"
        });
        
        // Clear session to restart
        global.botSession.delete(sessionKey);
        return true;
    }
}

module.exports = { startCommand, handleCaptchaResponse, showWelcomeMessage };
