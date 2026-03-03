const { getPool } = require('../database/database');
const logger = require('../utils/logger');
const { MESSAGES } = require('../utils/constants');

const checkUserStatus = async (userId) => {
    const pool = getPool();
    
    try {
        const result = await pool.query(
            'SELECT is_blocked, block_reason, block_expires FROM users WHERE user_id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            // New user
            await pool.query(
                `INSERT INTO users (user_id, username, first_name, last_name, joined_at) 
                 VALUES ($1, $2, $3, $4, NOW())`,
                [userId, null, null, null]
            );
            return { isBlocked: false };
        }
        
        const user = result.rows[0];
        
        // Check if temporary block expired
        if (user.block_expires && new Date() > user.block_expires) {
            await pool.query(
                'UPDATE users SET is_blocked = false, block_reason = NULL, block_expires = NULL WHERE user_id = $1',
                [userId]
            );
            return { isBlocked: false };
        }
        
        return {
            isBlocked: user.is_blocked,
            reason: user.block_reason,
            expires: user.block_expires
        };
    } catch (error) {
        logger.error('Error checking user status:', error);
        return { isBlocked: false };
    }
};

const checkAdmin = async (userId) => {
    const pool = getPool();
    
    try {
        const result = await pool.query(
            'SELECT is_admin FROM users WHERE user_id = $1',
            [userId]
        );
        
        return result.rows[0]?.is_admin || false;
    } catch (error) {
        logger.error('Error checking admin status:', error);
        return false;
    }
};

const blockUser = async (userId, reason, duration = null) => {
    const pool = getPool();
    
    try {
        const query = duration ?
            'UPDATE users SET is_blocked = true, block_reason = $2, block_expires = NOW() + $3::interval WHERE user_id = $1' :
            'UPDATE users SET is_blocked = true, block_reason = $2, block_expires = NULL WHERE user_id = $1';
        
        const params = duration ? [userId, reason, `${duration} minutes`] : [userId, reason];
        
        await pool.query(query, params);
        return true;
    } catch (error) {
        logger.error('Error blocking user:', error);
        return false;
    }
};

const unblockUser = async (userId) => {
    const pool = getPool();
    
    try {
        await pool.query(
            'UPDATE users SET is_blocked = false, block_reason = NULL, block_expires = NULL WHERE user_id = $1',
            [userId]
        );
        return true;
    } catch (error) {
        logger.error('Error unblocking user:', error);
        return false;
    }
};

const checkChannelJoin = async (bot, userId) => {
    try {
        const channel1 = await bot.getChatMember('@SheinVoucherHub', userId);
        const channel2 = await bot.getChatMember('@OrdersNotify', userId);
        
        const isMember1 = ['member', 'administrator', 'creator'].includes(channel1.status);
        const isMember2 = ['member', 'administrator', 'creator'].includes(channel2.status);
        
        return isMember1 && isMember2;
    } catch (error) {
        logger.error('Error checking channel join:', error);
        return false;
    }
};

module.exports = {
    checkUserStatus,
    checkAdmin,
    blockUser,
    unblockUser,
    checkChannelJoin
};
