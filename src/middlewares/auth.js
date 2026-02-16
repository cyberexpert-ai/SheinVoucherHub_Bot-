const { 
    getUser, 
    isUserBlocked
} = require('../sheets/googleSheets');

const authMiddleware = {
    async checkBlocked(userId) {
        return await isUserBlocked(userId);
    },
    
    async checkVerified(userId) {
        const user = await getUser(userId);
        return true; // Always verified (no captcha)
    }
};

module.exports = { authMiddleware };
