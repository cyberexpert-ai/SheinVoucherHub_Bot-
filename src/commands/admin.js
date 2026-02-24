const { query } = require("../database/database");
const moment = require("moment");

async function adminCommand(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Check if user is admin
    if (userId.toString() !== process.env.ADMIN_ID) {
        await bot.sendMessage(chatId, "❌ You are not authorized to use admin commands.");
        return;
    }

    // Parse command
    if (text === "/admin" || text === "👑 Admin Panel") {
        await showAdminPanel(bot, chatId);
    } else if (text.startsWith("/addcategory")) {
        await addCategory(bot, chatId, text);
    } else if (text.startsWith("/deletecategory")) {
        await deleteCategory(bot, chatId, text);
    } else if (text.startsWith("/addstock")) {
        await addStock(bot, chatId, text);
    } else if (text.startsWith("/addvoucher")) {
        await addVoucher(bot, chatId, text);
    } else if (text.startsWith("/bulkvoucher")) {
        await bulkAddVouchers(bot, chatId, text);
    } else if (text.startsWith("/updateprice")) {
        await updatePrice(bot, chatId, text);
    } else if (text.startsWith("/blockuser")) {
        await blockUser(bot, chatId, text);
    } else if (text.startsWith("/unblockuser")) {
        await unblockUser(bot, chatId, text);
    } else if (text.startsWith("/tempblock")) {
        await tempBlockUser(bot, chatId, text);
    } else if (text.startsWith("/broadcast")) {
        await broadcastMessage(bot, chatId, text);
    } else if (text.startsWith("/stats")) {
        await showStats(bot, chatId);
    } else if (text.startsWith("/orders")) {
        await showPendingOrders(bot, chatId);
    } else if (text.startsWith("/discount")) {
        await createDiscount(bot, chatId, text);
    } else {
        await bot.sendMessage(chatId, "❌ Unknown admin command. Use /admin for help.");
    }
}

async function showAdminPanel(bot, chatId) {
    const panelMessage = `👑 *Admin Control Panel*

📊 *Quick Stats*
• Total Users: ${await getTotalUsers()}
• Pending Orders: ${await getPendingOrders()}
• Total Categories: ${await getTotalCategories()}
• Total Vouchers: ${await getTotalVouchers()}

📌 *Available Commands:*

*Category Management*
/addcategory [name] - Add new category
/deletecategory [name] - Delete category
/updatestock [category] [stock] - Update stock

*Voucher Management*
/addvoucher [category] [code] - Add single voucher
/bulkvoucher [category] [codes] - Add bulk vouchers (comma separated)
/deletevoucher [code] - Delete specific voucher
/viewvouchers [category] - View all vouchers in category

*Price Management*
/updateprice [category] [qty] [price] - Update price
/setbulkprices [category] - Set all prices automatically

*User Management*
/blockuser [user_id] [reason] - Block user permanently
/tempblock [user_id] [minutes] [reason] - Temporary block
/unblockuser [user_id] - Unblock user
/messageuser [user_id] [text] - Send private message

*Order Management*
/orders - View pending orders
/acceptorder [order_id] - Accept order
/rejectorder [order_id] [reason] - Reject order
/deliver [order_id] [codes] - Manual delivery

*Discount System*
/discount [code] [category] [qty] [value] - Create discount
/deletediscount [code] - Delete discount

*Broadcast*
/broadcast [message] - Send to all users
/broadcastphoto [caption] - Send photo broadcast

*System*
/stats - Detailed statistics
/export - Export data
/backup - Backup database

*Security*
/blockutr [utr] - Block UTR
/checkutr [utr] - Check UTR usage
/fraudcheck - Run fraud detection`;

    const adminKeyboard = {
        reply_markup: {
            keyboard: [
                ["📊 Stats", "📦 Pending Orders"],
                ["➕ Add Category", "📝 Add Voucher"],
                ["👥 User Management", "📢 Broadcast"],
                ["🏠 Main Menu"]
            ],
            resize_keyboard: true
        }
    };

    await bot.sendMessage(chatId, panelMessage, {
        parse_mode: "Markdown",
        ...adminKeyboard
    });
}

async function addCategory(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 2) {
        await bot.sendMessage(chatId, "❌ Usage: /addcategory [name]\nExample: /addcategory 5000");
        return;
    }

    const categoryName = parts[1];
    
    try {
        await query(
            "INSERT INTO categories (name, display_name, stock) VALUES (?, ?, 0)",
            [categoryName, `₹${categoryName} Voucher`]
        );
        
        // Generate default prices for new category
        const basePrice = parseInt(categoryName) === 5000 ? 399 : 299;
        for (let qty = 1; qty <= 100; qty++) {
            let price;
            if (qty === 1) price = basePrice;
            else if (qty === 5) price = basePrice * 5 - 1;
            else price = Math.floor(basePrice * qty * 0.95);
            
            await query(
                "INSERT INTO prices (category_name, quantity, price) VALUES (?, ?, ?)",
                [categoryName, qty, price]
            );
        }
        
        await bot.sendMessage(chatId, `✅ Category *${categoryName}* added successfully with default prices!`, {
            parse_mode: "Markdown"
        });
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

async function deleteCategory(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 2) {
        await bot.sendMessage(chatId, "❌ Usage: /deletecategory [name]");
        return;
    }

    const categoryName = parts[1];
    
    try {
        await query("DELETE FROM categories WHERE name = ?", [categoryName]);
        await query("DELETE FROM prices WHERE category_name = ?", [categoryName]);
        await query("DELETE FROM vouchers WHERE category_name = ?", [categoryName]);
        
        await bot.sendMessage(chatId, `✅ Category *${categoryName}* deleted successfully!`, {
            parse_mode: "Markdown"
        });
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

async function addStock(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 3) {
        await bot.sendMessage(chatId, "❌ Usage: /addstock [category] [quantity]");
        return;
    }

    const categoryName = parts[1];
    const quantity = parseInt(parts[2]);
    
    try {
        await query(
            "UPDATE categories SET stock = stock + ? WHERE name = ?",
            [quantity, categoryName]
        );
        
        await bot.sendMessage(chatId, `✅ Added ${quantity} stock to *${categoryName}* category`, {
            parse_mode: "Markdown"
        });
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

async function addVoucher(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 3) {
        await bot.sendMessage(chatId, "❌ Usage: /addvoucher [category] [code]");
        return;
    }

    const categoryName = parts[1];
    const code = parts.slice(2).join(" ");
    
    try {
        await query(
            "INSERT INTO vouchers (code, category_name, added_by) VALUES (?, ?, ?)",
            [code, categoryName, chatId]
        );
        
        await bot.sendMessage(chatId, `✅ Voucher added to *${categoryName}* category`, {
            parse_mode: "Markdown"
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            await bot.sendMessage(chatId, "❌ This voucher code already exists!");
        } else {
            await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    }
}

async function bulkAddVouchers(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 3) {
        await bot.sendMessage(chatId, "❌ Usage: /bulkvoucher [category] [code1,code2,code3]");
        return;
    }

    const categoryName = parts[1];
    const codesText = parts.slice(2).join(" ");
    const codes = codesText.split(",").map(c => c.trim());
    
    let success = 0;
    let failed = 0;
    
    for (const code of codes) {
        try {
            await query(
                "INSERT INTO vouchers (code, category_name, added_by) VALUES (?, ?, ?)",
                [code, categoryName, chatId]
            );
            success++;
        } catch (error) {
            failed++;
        }
    }
    
    await bot.sendMessage(chatId, `✅ Bulk add complete!\nSuccess: ${success}\nFailed: ${failed} (duplicates)`, {
        parse_mode: "Markdown"
    });
}

async function updatePrice(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 4) {
        await bot.sendMessage(chatId, "❌ Usage: /updateprice [category] [quantity] [price]");
        return;
    }

    const categoryName = parts[1];
    const quantity = parseInt(parts[2]);
    const price = parseInt(parts[3]);
    
    try {
        await query(
            "INSERT INTO prices (category_name, quantity, price) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE price = ?",
            [categoryName, quantity, price, price]
        );
        
        await bot.sendMessage(chatId, `✅ Price updated for *${categoryName}* x${quantity} = ₹${price}`, {
            parse_mode: "Markdown"
        });
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

async function blockUser(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 3) {
        await bot.sendMessage(chatId, "❌ Usage: /blockuser [user_id] [reason]");
        return;
    }

    const targetUserId = parseInt(parts[1]);
    const reason = parts.slice(2).join(" ");
    
    try {
        await query(
            "UPDATE users SET is_blocked = TRUE, block_reason = ? WHERE user_id = ?",
            [reason, targetUserId]
        );
        
        await bot.sendMessage(chatId, `✅ User *${targetUserId}* blocked permanently.\nReason: ${reason}`, {
            parse_mode: "Markdown"
        });
        
        // Notify user
        try {
            await bot.sendMessage(targetUserId, 
                `🚫 *You have been blocked*\n\nReason: ${reason}\n\nContact @SheinSupportRobot for appeal.`,
                { parse_mode: "Markdown" }
            );
        } catch (e) {}
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

async function tempBlockUser(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 4) {
        await bot.sendMessage(chatId, "❌ Usage: /tempblock [user_id] [minutes] [reason]");
        return;
    }

    const targetUserId = parseInt(parts[1]);
    const minutes = parseInt(parts[2]);
    const reason = parts.slice(3).join(" ");
    
    const blockedUntil = moment().add(minutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    
    try {
        await query(
            "INSERT INTO temp_block (user_id, reason, blocked_until) VALUES (?, ?, ?)",
            [targetUserId, reason, blockedUntil]
        );
        
        await query(
            "UPDATE users SET is_blocked = TRUE, block_reason = ?, block_until = ? WHERE user_id = ?",
            [reason, blockedUntil, targetUserId]
        );
        
        await bot.sendMessage(chatId, 
            `✅ User *${targetUserId}* blocked temporarily.\nDuration: ${minutes} minutes\nReason: ${reason}\nUntil: ${blockedUntil}`,
            { parse_mode: "Markdown" }
        );
        
        // Notify user
        try {
            await bot.sendMessage(targetUserId,
                `🚫 *Temporary Block*\n\nDuration: ${minutes} minutes\nReason: ${reason}\n\nContact @SheinSupportRobot if you think this is a mistake.`,
                { parse_mode: "Markdown" }
            );
        } catch (e) {}
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

async function unblockUser(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 2) {
        await bot.sendMessage(chatId, "❌ Usage: /unblockuser [user_id]");
        return;
    }

    const targetUserId = parseInt(parts[1]);
    
    try {
        await query(
            "UPDATE users SET is_blocked = FALSE, block_reason = NULL, block_until = NULL WHERE user_id = ?",
            [targetUserId]
        );
        
        await query("DELETE FROM temp_block WHERE user_id = ?", [targetUserId]);
        
        await bot.sendMessage(chatId, `✅ User *${targetUserId}* unblocked successfully!`, {
            parse_mode: "Markdown"
        });
        
        // Notify user
        try {
            await bot.sendMessage(targetUserId,
                `✅ *You have been unblocked*\n\nYou can now use @SheinVoucherHub_Bot again.`,
                { parse_mode: "Markdown" }
            );
        } catch (e) {}
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

async function broadcastMessage(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 2) {
        await bot.sendMessage(chatId, "❌ Usage: /broadcast [message]");
        return;
    }

    const message = parts.slice(1).join(" ");
    
    try {
        const users = await query("SELECT user_id FROM users WHERE is_blocked = FALSE");
        
        let sent = 0;
        let failed = 0;
        
        for (const user of users) {
            try {
                await bot.sendMessage(user.user_id, `📢 *Broadcast Message*\n\n${message}`, {
                    parse_mode: "Markdown"
                });
                sent++;
            } catch (e) {
                failed++;
            }
            
            // Small delay to avoid flooding
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        await bot.sendMessage(chatId, 
            `📊 *Broadcast Complete*\n\nTotal Users: ${users.length}\n✅ Sent: ${sent}\n❌ Failed: ${failed}`,
            { parse_mode: "Markdown" }
        );
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

async function showStats(bot, chatId) {
    try {
        const totalUsers = await query("SELECT COUNT(*) as count FROM users");
        const blockedUsers = await query("SELECT COUNT(*) as count FROM users WHERE is_blocked = TRUE");
        const totalOrders = await query("SELECT COUNT(*) as count FROM orders");
        const pendingOrders = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
        const successOrders = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'success'");
        const totalRevenue = await query("SELECT SUM(total_price) as total FROM orders WHERE status = 'success'");
        const totalVouchers = await query("SELECT COUNT(*) as count FROM vouchers WHERE is_used = FALSE");
        const usedVouchers = await query("SELECT COUNT(*) as count FROM vouchers WHERE is_used = TRUE");
        
        const stats = `📊 *System Statistics*

👥 *Users*
Total Users: ${totalUsers[0].count}
Blocked Users: ${blockedUsers[0].count}
Active Users: ${totalUsers[0].count - blockedUsers[0].count}

📦 *Orders*
Total Orders: ${totalOrders[0].count}
Pending: ${pendingOrders[0].count}
Success: ${successOrders[0].count}
Total Revenue: ₹${totalRevenue[0].total || 0}

🎟 *Vouchers*
Available: ${totalVouchers[0].count}
Used: ${usedVouchers[0].count}
Total: ${totalVouchers[0].count + usedVouchers[0].count}

📊 *Categories*`;

        await bot.sendMessage(chatId, stats, { parse_mode: "Markdown" });
        
        // Show category wise stats
        const categories = await query(`
            SELECT c.name, c.stock, COUNT(v.id) as total_vouchers,
                   SUM(CASE WHEN v.is_used = FALSE THEN 1 ELSE 0 END) as available
            FROM categories c
            LEFT JOIN vouchers v ON c.name = v.category_name
            GROUP BY c.name
        `);
        
        for (const cat of categories) {
            await bot.sendMessage(chatId, 
                `*${cat.name}*\nStock: ${cat.stock}\nVouchers: ${cat.available}/${cat.total_vouchers}`,
                { parse_mode: "Markdown" }
            );
        }
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

async function showPendingOrders(bot, chatId) {
    try {
        const orders = await query(`
            SELECT o.*, u.username, u.first_name 
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.status = 'pending'
            ORDER BY o.created_at DESC
            LIMIT 20
        `);
        
        if (orders.length === 0) {
            await bot.sendMessage(chatId, "✅ No pending orders found!");
            return;
        }
        
        for (const order of orders) {
            const orderInfo = `📦 *Pending Order*

🆔 Order: ${order.order_id}
👤 User: ${order.first_name} (${order.user_id})
📦 Category: ₹${order.category_name} x${order.quantity}
💰 Amount: ₹${order.total_price}
🔢 UTR: ${order.utr_number || 'N/A'}
⏱ Created: ${moment(order.created_at).format('DD/MM/YYYY HH:mm')}
⏳ Expires: ${moment(order.expires_at).format('DD/MM/YYYY HH:mm')}

*Actions:*
/acceptorder ${order.order_id}
/rejectorder ${order.order_id} [reason]`;

            const actionKeyboard = {
                inline_keyboard: [
                    [
                        { text: "✅ Accept", callback_data: `admin_accept_${order.order_id}` },
                        { text: "❌ Reject", callback_data: `admin_reject_${order.order_id}` }
                    ]
                ]
            };
            
            await bot.sendMessage(chatId, orderInfo, {
                parse_mode: "Markdown",
                reply_markup: actionKeyboard
            });
        }
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

async function createDiscount(bot, chatId, text) {
    const parts = text.split(" ");
    if (parts.length < 5) {
        await bot.sendMessage(chatId, "❌ Usage: /discount [code] [category] [quantity] [value] [type=fixed]\nExample: /discount SAVE50 1000 5 50 fixed");
        return;
    }

    const code = parts[1];
    const category = parts[2];
    const quantity = parseInt(parts[3]);
    const value = parseInt(parts[4]);
    const type = parts[5] || 'fixed';
    
    try {
        await query(
            `INSERT INTO discounts (code, category_name, quantity, discount_type, discount_value, valid_from, valid_until, created_by)
             VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), ?)`,
            [code, category, quantity, type, value, chatId]
        );
        
        await bot.sendMessage(chatId, 
            `✅ Discount code *${code}* created!\nCategory: ${category} x${quantity}\n${type === 'fixed' ? '₹' + value + ' off' : value + '% off'}`,
            { parse_mode: "Markdown" }
        );
    } catch (error) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

// Helper functions
async function getTotalUsers() {
    const result = await query("SELECT COUNT(*) as count FROM users");
    return result[0].count;
}

async function getPendingOrders() {
    const result = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    return result[0].count;
}

async function getTotalCategories() {
    const result = await query("SELECT COUNT(*) as count FROM categories");
    return result[0].count;
}

async function getTotalVouchers() {
    const result = await query("SELECT COUNT(*) as count FROM vouchers");
    return result[0].count;
}

module.exports = { adminCommand };
