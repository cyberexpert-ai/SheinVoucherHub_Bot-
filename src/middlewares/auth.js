const db = require('../database/database');

async function isAdmin(userId) {
    if (userId.toString() === process.env.ADMIN_ID) return true;
    
    const user = await db.getUser(userId);
    return user && user.is_admin === true;
}

async function adminMiddleware(bot, msg, next) {
    const userId = msg.from.id;
    
    if (!await isAdmin(userId)) {
        await bot.sendMessage(userId, '⛔️ Access denied. Admin only.');
        return;
    }
    
    next();
}

async function userExistsMiddleware(bot, msg, next) {
    const userId = msg.from.id;
    
    const user = await db.getUser(userId);
    if (!user) {
        // Create user if not exists
        await db.createOrUpdateUser({
            telegram_id: userId,
            username: msg.from.username,
            first_name: msg.from.first_name,
            last_name: msg.from.last_name
        });
    }
    
    next();
}

module.exports = {
    isAdmin,
    adminMiddleware,
    userExistsMiddleware
};
