const { 
    getUser, 
    updateUserVerification,
    isUserBlocked,
    saveCaptcha,
    verifyCaptcha
} = require('../sheets/googleSheets');

const authMiddleware = {
    async checkBlocked(userId) {
        return await isUserBlocked(userId);
    },
    
    async checkVerified(userId) {
        const user = await getUser(userId);
        return user && user.verified === 'true';
    },
    
    async sendCaptcha(bot, chatId, userId) {
        // Generate math captcha
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operators = ['+', '-', '×'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        
        let answer;
        let text;
        
        switch(operator) {
            case '+':
                answer = (num1 + num2).toString();
                text = `🧮 **Solve:** ${num1} + ${num2} = ?`;
                break;
            case '-':
                answer = (num1 - num2).toString();
                text = `🧮 **Solve:** ${num1} - ${num2} = ?`;
                break;
            case '×':
                answer = (num1 * num2).toString();
                text = `🧮 **Solve:** ${num1} × ${num2} = ?`;
                break;
        }
        
        await saveCaptcha(userId, answer);
        
        await bot.sendMessage(chatId, 
            `🔐 **Verification Required**\n\n${text}\n\nPlease type the answer:`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    force_reply: true
                }
            }
        );
    },
    
    async verifyUserCaptcha(bot, chatId, userId, userInput) {
        const isValid = await verifyCaptcha(userId, userInput);
        
        if (isValid) {
            const { handleVerificationSuccess } = require('../commands/start');
            await handleVerificationSuccess(bot, chatId);
            return true;
        } else {
            await bot.sendMessage(chatId, 
                '❌ **Wrong Answer!**\n\nPlease try again or click /start to restart.',
                { parse_mode: 'Markdown' }
            );
            return false;
        }
    }
};

module.exports = { authMiddleware };
