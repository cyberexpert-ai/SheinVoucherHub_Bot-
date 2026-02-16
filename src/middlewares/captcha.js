const { saveCaptcha, verifyCaptcha } = require('../sheets/googleSheets');

const captchaMiddleware = {
    async generateCaptcha() {
        // Generate random math captcha
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operators = ['+', '-', '×'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        
        let answer;
        let text;
        
        switch(operator) {
            case '+':
                answer = (num1 + num2).toString();
                text = `🧮 Solve: ${num1} + ${num2} = ?`;
                break;
            case '-':
                answer = (num1 - num2).toString();
                text = `🧮 Solve: ${num1} - ${num2} = ?`;
                break;
            case '×':
                answer = (num1 * num2).toString();
                text = `🧮 Solve: ${num1} × ${num2} = ?`;
                break;
        }
        
        return { text, answer };
    },
    
    async sendCaptcha(bot, chatId, userId) {
        const { text, answer } = await this.generateCaptcha();
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
    
    async verifyUserCaptcha(userId, userInput) {
        return await verifyCaptcha(userId, userInput);
    }
};

module.exports = { captchaMiddleware };
