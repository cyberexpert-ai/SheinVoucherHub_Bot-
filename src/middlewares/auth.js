const { query } = require("../database/database");
const moment = require("moment");

async function checkUserBlock(userId) {
    try {
        // Check if user is permanently blocked
        const user = await query(
            "SELECT is_blocked, block_reason, block_until FROM users WHERE user_id = ?",
            [userId]
        );

        if (user.length > 0) {
            if (user[0].is_blocked) {
                if (user[0].block_until) {
                    const blockUntil = moment(user[0].block_until);
                    if (moment().isBefore(blockUntil)) {
                        return {
                            blocked: true,
                            temporary: true,
                            until: blockUntil.format("DD/MM/YYYY HH:mm"),
                            reason: user[0].block_reason || "No reason provided"
                        };
                    } else {
                        // Block expired, unblock user
                        await query(
                            "UPDATE users SET is_blocked = FALSE, block_until = NULL WHERE user_id = ?",
                            [userId]
                        );
                        return { blocked: false };
                    }
                } else {
                    return {
                        blocked: true,
                        temporary: false,
                        reason: user[0].block_reason || "Permanently blocked"
                    };
                }
            }
        }

        // Check temporary blocks
        const tempBlock = await query(
            "SELECT * FROM temp_block WHERE user_id = ? AND blocked_until > NOW()",
            [userId]
        );

        if (tempBlock.length > 0) {
            return {
                blocked: true,
                temporary: true,
                until: moment(tempBlock[0].blocked_until).format("DD/MM/YYYY HH:mm"),
                reason: tempBlock[0].reason
            };
        }

        return { blocked: false };
    } catch (error) {
        console.error("Check user block error:", error);
        return { blocked: false };
    }
}

async function registerUser(user) {
    try {
        const existing = await query(
            "SELECT * FROM users WHERE user_id = ?",
            [user.id]
        );

        if (existing.length === 0) {
            await query(
                `INSERT INTO users (user_id, username, first_name, last_name) 
                 VALUES (?, ?, ?, ?)`,
                [user.id, user.username || "", user.first_name || "", user.last_name || ""]
            );
        } else {
            await query(
                `UPDATE users SET username = ?, first_name = ?, last_name = ?, last_active = NOW() 
                 WHERE user_id = ?`,
                [user.username || "", user.first_name || "", user.last_name || "", user.id]
            );
        }
    } catch (error) {
        console.error("Register user error:", error);
    }
}

module.exports = { checkUserBlock, registerUser };
