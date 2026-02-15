const { 
    getUser, 
    updateUserVerification,
    isUserBlocked,
    saveCaptcha,
    verifyCaptcha
} = require('../sheets/googleSheets');
const { captchaMiddleware } = require('./captcha');

const authMiddleware = {
    async checkBlocked(userId) {
        return await isUserBlocked(userId);
    },
    
    async checkVerified(userId) {
        const user = await getUser(userId);
        return user && user.verified === 'true';
    },
    
    async sendCaptcha(bot, chatId, userId) {
        await captchaMiddleware.sendCaptcha(bot, chatId, userId);
    },
    
    async verifyUserCaptcha(userId, userInput) {
        return await verifyCaptcha(userId, userInput);
    },
    
    async checkPermission(userId, requiredRole = 'user') {
        if (userId.toString() === process.env.ADMIN_ID) {
            return true;
        }
        
        const user = await getUser(userId);
        if (!user) return false;
        
        // Check if user has required role
        const userRole = user.role || 'user';
        const roles = {
            'admin': 3,
            'moderator': 2,
            'user': 1
        };
        
        return roles[userRole] >= roles[requiredRole];
    },
    
    async logUserAction(userId, action, details = {}) {
        console.log(`User ${userId} performed action: ${action}`, details);
        // Store in Google Sheets if needed
    },
    
    async checkRateLimit(userId, action) {
        // Implement rate limiting
        const limits = {
            'buy': 5, // 5 purchases per hour
            'recover': 3, // 3 recovery attempts per hour
            'support': 10 // 10 support messages per hour
        };
        
        // Store in memory or database
        return true; // Placeholder
    },
    
    async validatePayment(userId, amount, method) {
        // Validate payment based on method
        if (method === 'manual') {
            return true; // Manual verification by admin
        } else if (method === 'baratpay') {
            // Auto verification logic
            return false;
        }
        return false;
    },
    
    async checkTemporaryBlock(userId) {
        const user = await getUser(userId);
        if (user && user.temp_block_until) {
            const blockUntil = new Date(user.temp_block_until);
            if (new Date() < blockUntil) {
                return {
                    blocked: true,
                    expires: blockUntil
                };
            }
        }
        return { blocked: false };
    },
    
    async getUserRestrictions(userId) {
        const user = await getUser(userId);
        return user ? JSON.parse(user.restrictions || '{}') : {};
    },
    
    async applyRestriction(userId, restriction, duration) {
        const user = await getUser(userId);
        if (user) {
            const restrictions = JSON.parse(user.restrictions || '{}');
            restrictions[restriction] = {
                applied: new Date().toISOString(),
                expires: new Date(Date.now() + duration * 3600000).toISOString()
            };
            user.restrictions = JSON.stringify(restrictions);
            await user.save();
        }
    },
    
    async removeRestriction(userId, restriction) {
        const user = await getUser(userId);
        if (user) {
            const restrictions = JSON.parse(user.restrictions || '{}');
            delete restrictions[restriction];
            user.restrictions = JSON.stringify(restrictions);
            await user.save();
        }
    },
    
    async checkDeviceLimit(userId, deviceId) {
        // Check if user is using multiple devices
        const user = await getUser(userId);
        if (user && user.devices) {
            const devices = JSON.parse(user.devices || '[]');
            if (!devices.includes(deviceId) && devices.length >= 3) {
                return false; // Too many devices
            }
        }
        return true;
    },
    
    async generateSessionToken(userId) {
        const token = Math.random().toString(36).substr(2, 32) + Date.now().toString(36);
        // Store token in database with expiry
        return token;
    },
    
    async validateSessionToken(userId, token) {
        // Validate session token
        return true; // Placeholder
    },
    
    async logoutUser(userId) {
        // Clear user session
        return true;
    },
    
    async getLoginHistory(userId) {
        // Return user login history
        return [];
    },
    
    async setTwoFactorAuth(userId, enabled) {
        const user = await getUser(userId);
        if (user) {
            user.two_factor = enabled ? 'true' : 'false';
            await user.save();
        }
    },
    
    async verifyTwoFactorCode(userId, code) {
        // Verify 2FA code
        return true;
    },
    
    async generateBackupCodes(userId) {
        // Generate backup codes for 2FA
        const codes = [];
        for (let i = 0; i < 8; i++) {
            codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
        }
        return codes;
    }
};

module.exports = { authMiddleware };
