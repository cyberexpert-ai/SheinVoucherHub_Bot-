const db = require('../../database/database');
const helpers = require('../../utils/helpers');

async function broadcastMenu(bot, chatId, userId) {
    const message = `📢 Broadcast Management\n\n` +
                    `Send messages to users\n` +
                    `━━━━━━━━━━━━━━━━\n\n` +
                    `Select option:`;
    
    const keyboard = [
        ['📢 New Broadcast', '📋 Scheduled'],
        ['👤 Personal Message', '🗑 Delete Broadcast'],
        ['↩️ Back to Admin']
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    });
}

async function newBroadcast(bot, chatId, userId) {
    const msg = await bot.sendMessage(chatId,
        `📢 New Broadcast\n\n` +
        `Send your broadcast message.\n\n` +
        `You can include:\n` +
        `• Text\n` +
        `• Photo (as caption)\n` +
        `• Buttons (format: button text|url)\n\n` +
        `Example with button:\n` +
        `Hello users!\n` +
        `--button--\n` +
        `Visit Site|https://example.com`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'admin_broadcast_message',
        messageId: msg.message_id
    };
}

async function processBroadcast(bot, adminId, msg) {
    const chatId = msg.chat.id;
    const text = msg.text || msg.caption;
    const photo = msg.photo;
    
    // Parse buttons
    let messageText = text;
    let buttons = [];
    
    if (text.includes('--button--')) {
        const parts = text.split('--button--');
        messageText = parts[0].trim();
        
        const buttonLines = parts[1].trim().split('\n');
        for (const line of buttonLines) {
            const [btnText, btnUrl] = line.split('|').map(s => s.trim());
            if (btnText && btnUrl) {
                buttons.push([{ text: btnText, url: btnUrl }]);
            }
        }
    }
    
    // Get all users
    const users = await db.query('SELECT telegram_id FROM users WHERE is_blocked = FALSE');
    
    await bot.sendMessage(chatId, `📢 Sending broadcast to ${users.length} users...`);
    
    let sent = 0;
    let failed = 0;
    
    for (const user of users) {
        try {
            if (photo) {
                await bot.sendPhoto(user.telegram_id, photo[photo.length - 1].file_id, {
                    caption: messageText,
                    reply_markup: buttons.length ? { inline_keyboard: buttons } : undefined
                });
            } else {
                await bot.sendMessage(user.telegram_id, messageText, {
                    reply_markup: buttons.length ? { inline_keyboard: buttons } : undefined
                });
            }
            sent++;
            
            // Small delay to avoid rate limits
            await helpers.delay(50);
        } catch (error) {
            failed++;
        }
    }
    
    // Save broadcast record
    await db.query(
        `INSERT INTO broadcasts (message_text, media_url, button_text, button_url, sent_count, delivered_count, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [messageText, photo ? 'photo' : null, 
         buttons.length ? buttons[0][0].text : null,
         buttons.length ? buttons[0][0].url : null,
         users.length, sent, adminId]
    );
    
    await bot.sendMessage(chatId,
        `✅ Broadcast completed!\n\n` +
        `Total users: ${users.length}\n` +
        `Delivered: ${sent}\n` +
        `Failed: ${failed}`
    );
}

async function personalMessage(bot, chatId, userId) {
    const msg = await bot.sendMessage(chatId,
        `👤 Personal Message\n\n` +
        `Send User ID and message in format:\n` +
        `USER_ID|Your message\n\n` +
        `Example:\n` +
        `123456789|Hello, how can I help you?`,
        {
            reply_markup: {
                force_reply: true,
                selective: true
            }
        }
    );
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[userId] = {
        type: 'admin_personal_message',
        messageId: msg.message_id
    };
}

async function sendPersonalMessage(bot, adminId, text) {
    const [targetId, ...messageParts] = text.split('|');
    const message = messageParts.join('|').trim();
    
    if (!targetId || !message) {
        await bot.sendMessage(adminId, '❌ Invalid format. Use: USER_ID|Your message');
        return;
    }
    
    try {
        await bot.sendMessage(parseInt(targetId.trim()),
            `📨 Message from Admin:\n\n${message}`
        );
        await bot.sendMessage(adminId, `✅ Message sent to user ${targetId}`);
    } catch (error) {
        await bot.sendMessage(adminId, `❌ Failed to send message.`);
    }
}

async function listBroadcasts(bot, chatId) {
    const broadcasts = await db.query(
        'SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 10'
    );
    
    if (!broadcasts.length) {
        await bot.sendMessage(chatId, 'No broadcasts found.');
        return;
    }
    
    let message = '📋 Recent Broadcasts\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const b of broadcasts) {
        message += `ID: ${b.id}\n`;
        message += `Date: ${helpers.formatDate(b.created_at)}\n`;
        message += `Sent: ${b.sent_count}/${b.delivered_count}\n`;
        message += `Preview: ${b.message_text.substring(0, 50)}...\n`;
        message += `━━━━━━━━━━━━━━━━\n\n`;
    }
    
    await bot.sendMessage(chatId, message);
}

module.exports = {
    broadcastMenu,
    newBroadcast,
    processBroadcast,
    personalMessage,
    sendPersonalMessage,
    listBroadcasts
};
