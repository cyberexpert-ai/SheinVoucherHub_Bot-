const db = require('../../database/database');

async function securityMenu(bot, chatId, userId) {
    const fraudCases = await db.query(
        'SELECT COUNT(*) as count FROM fraud_detection WHERE detected_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
    );
    
    const warnings = await db.query(
        'SELECT COUNT(*) as count FROM user_warnings WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
    );
    
    const message = `🔒 Security Center\n` +
                    `━━━━━━━━━━━━━━━━\n\n` +
                    `Fraud Cases (24h): ${fraudCases[0].count}\n` +
                    `Warnings (24h): ${warnings[0].count}\n\n` +
                    `Select option:`;
    
    const keyboard = [
        ['🚫 Fraud Detection', '⚠️ User Warnings'],
        ['🔍 Audit Log', '⚙️ Security Settings'],
        ['↩️ Back to Admin']
    ];
    
    await bot.sendMessage(chatId, message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    });
}

async function fraudDetection(bot, chatId) {
    const fraud = await db.query(
        `SELECT f.*, u.username, u.first_name 
         FROM fraud_detection f 
         LEFT JOIN users u ON f.user_id = u.telegram_id 
         ORDER BY f.detected_at DESC 
         LIMIT 20`
    );
    
    if (!fraud.length) {
        await bot.sendMessage(chatId, 'No fraud cases found.');
        return;
    }
    
    let message = '🚫 Fraud Detection Log\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const f of fraud) {
        message += `User: ${f.first_name} (@${f.username || 'N/A'})\n`;
        message += `ID: ${f.user_id}\n`;
        message += `UTR: ${f.utr_number}\n`;
        message += `Order: ${f.order_id || 'N/A'}\n`;
        message += `Reason: ${f.reason}\n`;
        message += `Time: ${f.detected_at}\n`;
        message += `━━━━━━━━━━━━━━━━\n\n`;
    }
    
    await bot.sendMessage(chatId, message);
}

async function userWarnings(bot, chatId) {
    const warnings = await db.query(
        `SELECT w.*, u.username, u.first_name 
         FROM user_warnings w 
         LEFT JOIN users u ON w.user_id = u.telegram_id 
         ORDER BY w.created_at DESC 
         LIMIT 20`
    );
    
    if (!warnings.length) {
        await bot.sendMessage(chatId, 'No warnings found.');
        return;
    }
    
    let message = '⚠️ User Warnings\n━━━━━━━━━━━━━━━━\n\n';
    
    for (const w of warnings) {
        message += `User: ${w.first_name} (@${w.username || 'N/A'})\n`;
        message += `ID: ${w.user_id}\n`;
        message += `Type: ${w.warning_type}\n`;
        message += `Reason: ${w.reason}\n`;
        message += `Time: ${w.created_at}\n`;
        if (w.expires_at) {
            message += `Expires: ${w.expires_at}\n`;
        }
        message += `━━━━━━━━━━━━━━━━\n\n`;
    }
    
    await bot.sendMessage(chatId, message);
}

async function securitySettings(bot, chatId) {
    const settings = {
        max_warnings: 3,
        fraud_cooldown: 24,
        recovery_hours: 2,
        temp_block_minutes: 30
    };
    
    const message = `⚙️ Security Settings\n` +
                    `━━━━━━━━━━━━━━━━\n\n` +
                    `Max Warnings: ${settings.max_warnings}\n` +
                    `Fraud Cooldown: ${settings.fraud_cooldown}h\n` +
                    `Recovery Window: ${settings.recovery_hours}h\n` +
                    `Temp Block: ${settings.temp_block_minutes}m\n\n` +
                    `To change settings, send:\n` +
                    `setting=value\n` +
                    `Example: max_warnings=5`;
    
    const msg = await bot.sendMessage(chatId, message, {
        reply_markup: {
            force_reply: true,
            selective: true
        }
    });
    
    global.waitingFor = global.waitingFor || {};
    global.waitingFor[chatId] = {
        type: 'admin_security_settings',
        messageId: msg.message_id
    };
}

module.exports = {
    securityMenu,
    fraudDetection,
    userWarnings,
    securitySettings
};
