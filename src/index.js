require("dotenv").config();
const express = require("express");
const { Telegraf, session, Markup } = require("telegraf");
const pool = require("./database/database");
const channelCheck = require("./middlewares/channelCheck");

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = parseInt(process.env.ADMIN_ID);

// Express Middleware for Render
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.status(200).send("Bot is running perfectly!"));
app.get("/health", (req, res) => res.status(200).send("OK"));

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${process.env.PORT || 3000}`);
});

// Bot Session Middleware
bot.use(session());
bot.use((ctx, next) => {
    if (!ctx.session) ctx.session = {};
    return next();
});

// Helper for Auto-Delete Message System
async function sendMenu(ctx, text, keyboard) {
    if (ctx.session.lastMsgId) {
        try { await ctx.deleteMessage(ctx.session.lastMsgId); } catch (e) {}
    }
    const msg = await ctx.reply(text, keyboard);
    ctx.session.lastMsgId = msg.message_id;
}

// ---------------- USER COMMANDS ---------------- //

bot.command("start", channelCheck, async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || "Unknown";
    
    await pool.query(
        "INSERT IGNORE INTO users (user_id, username, is_verified) VALUES (?, ?, true)", 
        [userId, username]
    );

    const keyboard = Markup.keyboard([
        ["🛒 Buy Voucher", "🔁 Recover Vouchers"],
        ["📦 My Orders", "📜 Disclaimer"],
        ["🆘 Support"]
    ]).resize();

    await sendMenu(ctx, "🎯 Welcome to Shein Voucher Hub S!\n\n🚀 Get exclusive Shein vouchers at the best prices!\n📌 Choose an option below:", keyboard);
});

bot.action("verify_join", async (ctx) => {
    try {
        const chatMember = await ctx.telegram.getChatMember(process.env.CHANNEL_MAIN, ctx.from.id);
        if (['member', 'administrator', 'creator'].includes(chatMember.status)) {
            await ctx.deleteMessage();
            await pool.query("UPDATE users SET is_verified = true WHERE user_id = ?", [ctx.from.id]);
            ctx.reply("✅ Verified successfully! Press /start to open the menu.");
        } else {
            ctx.answerCbQuery("❌ You haven't joined the channel yet!", { show_alert: true });
        }
    } catch (err) {
        ctx.answerCbQuery("❌ Error verifying.", { show_alert: true });
    }
});

// Message Handlers
bot.on("text", channelCheck, async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;

    // Check Active State
    if (ctx.session.state === 'support') {
        if (text === "↩️ Leave") {
            ctx.session.state = null;
            return ctx.reply("Left Support Mode. Select an option from the menu.", Markup.keyboard([
                ["🛒 Buy Voucher", "🔁 Recover Vouchers"],["📦 My Orders", "📜 Disclaimer"],
                ["🆘 Support"]
            ]).resize());
        }
        await ctx.telegram.sendMessage(ADMIN_ID, `🆘 𝗦𝘂𝗽𝗽𝗼𝗿𝘁 𝗠𝗲𝘀𝘀𝗮𝗴𝗲\nFrom: ${ctx.from.first_name} [<code>${userId}</code>]\n\n${text}`, { parse_mode: 'HTML' });
        return ctx.reply("✅ Message sent to Admin.");
    }

    if (ctx.session.state === 'recover_voucher') {
        if (text === "↩️ Back") {
            ctx.session.state = null;
            return ctx.reply("Action cancelled.", Markup.keyboard([
                ["🛒 Buy Voucher", "🔁 Recover Vouchers"],["📦 My Orders", "📜 Disclaimer"],
                ["🆘 Support"]
            ]).resize());
        }
        
        // Anti-Fake ID Check
        const [order] = await pool.query("SELECT * FROM orders WHERE order_id = ?", [text]);
        if (order.length === 0) {
            await pool.query("UPDATE users SET ban_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE user_id = ?",[userId]);
            return ctx.reply(`⚠️ Order not found: ${text}\n🚫 You have been temporarily restricted for 15 minutes for entering a fake/invalid Order ID.`);
        }
        if (order[0].user_id !== userId) {
            return ctx.reply(`⚠️ This Order ID belongs to a different account. You can only recover your own orders!`);
        }
        
        const orderDate = new Date(order[0].created_at);
        const hoursPassed = Math.abs(new Date() - orderDate) / 36e5;
        if (hoursPassed > 2) {
            return ctx.reply(`⏳ Order ID expired. Recovery is only allowed within 2 hours of delivery.`);
        }

        await ctx.telegram.sendMessage(ADMIN_ID, `🔁 𝗥𝗲𝗰𝗼𝘃𝗲𝗿𝘆 𝗥𝗲𝗾𝘂𝗲𝘀𝘁\nUser: ${userId}\nOrder ID: <code>${text}</code>`, { parse_mode: 'HTML' });
        return ctx.reply("✅ Recovery request sent to Admin.");
    }

    if (ctx.session.state === 'waiting_utr') {
        if (text === "↩️ Back") {
            ctx.session.state = null;
            return ctx.reply("Payment cancelled.");
        }
        // Save UTR and process Order ID
        const utr = text;
        const orderId = `SVH-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        await pool.query(
            "INSERT INTO orders (order_id, user_id, category_id, quantity, total_price, utr) VALUES (?, ?, ?, ?, ?, ?)",[orderId, userId, ctx.session.cat_id, ctx.session.qty, ctx.session.total, utr]
        );

        ctx.reply(`✅ Thank you! Your payment is under review.\n🧾 Order ID: <code>${orderId}</code>\nWait for admin confirmation.`, { parse_mode: 'HTML' });
        
        // Notify Admin
        await ctx.telegram.sendPhoto(ADMIN_ID, ctx.session.screenshot, {
            caption: `💳 𝗡𝗲𝘄 𝗣𝗮𝘆𝗺𝗲𝗻𝘁\n👤 User: <code>${userId}</code>\n📦 Category: ${ctx.session.cat_name}\n🔢 Qty: ${ctx.session.qty}\n💰 Amount: ₹${ctx.session.total}\n🧾 UTR: <code>${utr}</code>\n🆔 Order ID: <code>${orderId}</code>`,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: "Accept ✅", callback_data: `accept_${orderId}` }, { text: "Reject ❌", callback_data: `reject_${orderId}` }]
                ]
            }
        });
        
        ctx.session.state = null;
        return;
    }

    // MAIN MENU COMMANDS
    switch (text) {
        case "🛒 Buy Voucher":
            const [categories] = await pool.query("SELECT * FROM categories");
            const catButtons = categories.map(c =>[{ text: `🎟 ${c.name} (Stock: ${c.stock})`, callback_data: `cat_${c.id}` }]);
            await sendMenu(ctx, "🛍 Select a Voucher Category:", Markup.inlineKeyboard(catButtons));
            break;

        case "🔁 Recover Vouchers":
            ctx.session.state = 'recover_voucher';
            await ctx.reply("🔁 Recover Vouchers\nSend your Order ID\nExample: SVH-1234567890-ABC123", Markup.keyboard([["↩️ Back"]]).resize());
            break;

        case "📦 My Orders":
            const [orders] = await pool.query("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5", [userId]);
            if (orders.length === 0) return ctx.reply("📦 You don't have any orders yet.");
            
            let resTxt = "📦 Your Orders\n\n";
            orders.forEach(o => {
                resTxt += `🧾 <code>${o.order_id}</code>\n🎟 Qty ${o.quantity}\n💰 ₹${o.total_price} | ${o.status.toUpperCase()}\n\n`;
            });
            await ctx.reply(resTxt, { parse_mode: 'HTML' });
            break;

        case "📜 Disclaimer":
            await ctx.reply("📜 Disclaimer\n\nAll coupons given are 100% OFF upto voucher amount with NO minimum order amount required.\nContact Support if you're facing any issue with vouchers.\nOnly replacements are allowed if support ticket is raised within 1–2 hours of voucher delivery.\nNo returns.\nRefund will be only given if vouchers are out of stock.", Markup.keyboard([["↩️ Back"]]).resize());
            break;

        case "🆘 Support":
            ctx.session.state = 'support';
            await ctx.reply("🆘 Please type your message below. It will be sent to our support team.\n⚠️ Fake/Timepass messages will result in an instant ban.", Markup.keyboard([["↩️ Leave"]]).resize());
            break;

        case "↩️ Back":
            ctx.session.state = null;
            await ctx.reply("Returned to Main Menu.", Markup.keyboard([
                ["🛒 Buy Voucher", "🔁 Recover Vouchers"],["📦 My Orders", "📜 Disclaimer"],
                ["🆘 Support"]
            ]).resize());
            break;

        default:
            if (userId === ADMIN_ID && ctx.session.state === 'admin_replying') {
                // Admin sending reply
                await ctx.telegram.sendMessage(ctx.session.reply_to, `👨‍💻 Admin Reply:\n\n${text}`);
                ctx.session.state = null;
                ctx.reply("✅ Reply sent to user.");
            } else if (!ctx.session.state) {
                ctx.reply("⚠️ Unknown command. Please select an option from the menu.");
            }
    }
});

// Photo upload handler for Payment Screenshot
bot.on("photo", channelCheck, async (ctx) => {
    if (ctx.session.state === 'waiting_payment') {
        ctx.session.screenshot = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        ctx.session.state = 'waiting_utr';
        await ctx.reply("📸 Screenshot received!\n\nNow, please type and send your 12-Digit UTR / Transaction ID.", Markup.keyboard([["↩️ Back"]]).resize());
    }
});

// Callback Queries (Inline Buttons)
bot.on("callback_query", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;

    // Buy -> Select Category -> Quantity Selection
    if (data.startsWith("cat_")) {
        const catId = data.split("_")[1];
        const [catData] = await pool.query("SELECT * FROM categories WHERE id = ?", [catId]);
        ctx.session.cat_id = catId;
        ctx.session.cat_name = catData[0].name;
        
        await ctx.editMessageText(`You selected: ${catData[0].name}\nAvailable Stock: ${catData[0].stock}\nSelect Quantity:`, Markup.inlineKeyboard([[{ text: "1", callback_data: `qty_1` }, { text: "2", callback_data: `qty_2` }, { text: "3", callback_data: `qty_3` }],[{ text: "Custom Quantity", callback_data: `qty_custom` }]
        ]));
    }

    if (data.startsWith("qty_")) {
        const qty = parseInt(data.split("_")[1]);
        if (isNaN(qty)) {
            // Logic for Custom quantity can be added here
            return ctx.answerCbQuery("Feature coming soon!");
        }

        const[priceRow] = await pool.query("SELECT price FROM prices WHERE category_id = ? AND quantity = ?",[ctx.session.cat_id, qty]);
        const amount = priceRow.length > 0 ? priceRow[0].price : 999 * qty; // fallback

        ctx.session.qty = qty;
        ctx.session.total = amount;
        ctx.session.state = 'waiting_payment';

        await ctx.deleteMessage();
        await ctx.replyWithPhoto("https://i.supaimg.com/00332ad4-8aa7-408f-8705-55dbc91ea737.jpg", {
            caption: `💳 𝗣𝗮𝘆𝗺𝗲𝗻𝘁 𝗗𝗲𝘁𝗮𝗶𝗹𝘀\n\n🎟 Category: ${ctx.session.cat_name}\n📦 Quantity: ${qty}\n💰 Total to Pay: ₹${amount}\n\nPlease scan the QR code and make the payment.\n\n⚠️ After payment, tap "Paid" and upload the screenshot.`,
            reply_markup: {
                inline_keyboard: [[{ text: "Paid ✅", callback_data: "payment_done" }]]
            }
        });
    }

    if (data === "payment_done") {
        ctx.session.state = 'waiting_payment'; // ensure state
        await ctx.deleteMessage();
        await ctx.reply("📸 Please send the Payment Screenshot here.", Markup.keyboard([["↩️ Back"]]).resize());
    }

    // --- ADMIN ACCEPT/REJECT LOGIC ---
    if (userId === ADMIN_ID) {
        if (data.startsWith("accept_")) {
            const orderId = data.split("_")[1];
            
            const [orderInfo] = await pool.query("SELECT * FROM orders WHERE order_id = ?",[orderId]);
            if(orderInfo[0].status !== 'pending') return ctx.answerCbQuery("Already processed.");

            const reqQty = orderInfo[0].quantity;
            const catId = orderInfo[0].category_id;

            // Fetch Codes
            const [codes] = await pool.query("SELECT code FROM vouchers WHERE category_id = ? AND is_used = false LIMIT ?", [catId, reqQty]);
            
            if (codes.length < reqQty) {
                return ctx.reply("❌ Not enough stock available to fulfill this order!");
            }

            // Update DB
            await pool.query("UPDATE orders SET status = 'successful' WHERE order_id = ?",[orderId]);
            await pool.query("UPDATE categories SET stock = stock - ? WHERE id = ?",[reqQty, catId]);
            
            let codeString = "";
            for (let c of codes) {
                await pool.query("UPDATE vouchers SET is_used = true, used_by = ? WHERE code = ?", [orderInfo[0].user_id, c.code]);
                codeString += `<code>${c.code}</code>\n`;
            }

            // Send to User
            await ctx.telegram.sendMessage(orderInfo[0].user_id, `🎉 𝗣𝗮𝘆𝗺𝗲𝗻𝘁 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹!\n\n🧾 Order ID: <code>${orderId}</code>\nHere are your codes (Tap to copy):\n\n${codeString}`, { parse_mode: 'HTML' });
            
            // Notify Channel
            const channelMsg = `🎯 𝗡𝗲𝘄 𝗢𝗿𝗱𝗲𝗿 𝗦𝘂𝗯𝗺𝗶𝘁𝘁𝗲𝗱\n━━━━━━━━━━━•❈•━━━━━━━━━━━\n╰➤👤 𝗨𝗦𝗘𝗥 𝗜𝗗 : <code>${orderInfo[0].user_id}</code>\n╰➤📡 𝗦𝗧𝗔𝗧𝗨𝗦: ✅ Success\n╰➤ 🔰𝗤𝗨𝗔𝗟𝗜𝗧𝗬: High 📶\n╰➤ 📦𝗧𝗢𝗧𝗔𝗟 𝗤𝗨𝗔𝗡𝗧𝗜𝗧𝗬 : ${reqQty}\n╰➤ 💳𝗖𝗢𝗦𝗧 : ₹${orderInfo[0].total_price}\n\n🤖𝗕𝗢𝗧 𝗡𝗔𝗠𝗘 : @SheinVoucherHub_Bot\n━━━━━━━━━━━•❈•━━━━━━━━━━━`;
            await ctx.telegram.sendMessage(process.env.CHANNEL_ORDERS, channelMsg, { parse_mode: 'HTML' });

            await ctx.editMessageCaption("✅ Order Accepted and Codes Sent!");
        }

        if (data.startsWith("reject_")) {
            const orderId = data.split("_")[1];
            await pool.query("UPDATE orders SET status = 'rejected' WHERE order_id = ?", [orderId]);
            const [orderInfo] = await pool.query("SELECT user_id FROM orders WHERE order_id = ?", [orderId]);
            
            await ctx.telegram.sendMessage(orderInfo[0].user_id, `❌ Your order <code>${orderId}</code> has been rejected by Admin.\nPlease contact Support if you think this is a mistake.`, { parse_mode: 'HTML' });
            await ctx.editMessageCaption("❌ Order Rejected.");
        }
    }
});

// ADMIN PANEL - ADVANCED
bot.command("admin", async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const keyboard = Markup.inlineKeyboard([[{ text: "📊 Add Category", callback_data: "admin_addcat" }, { text: "🎟 Add Bulk Codes", callback_data: "admin_addcode" }],[{ text: "💰 Update Prices", callback_data: "admin_price" }, { text: "📢 Broadcast", callback_data: "admin_broadcast" }],[{ text: "👥 Manage Users (Block/Unblock)", callback_data: "admin_users" }, { text: "📈 Stats", callback_data: "admin_stats" }]
    ]);
    ctx.reply("👑 𝗔𝗗𝗠𝗜𝗡 𝗣𝗔𝗡𝗘𝗟 (Ultra Control)", keyboard);
});

// Error handling
bot.catch((err) => console.log('Bot Error:', err));
