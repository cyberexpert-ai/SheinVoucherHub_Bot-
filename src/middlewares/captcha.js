const { createCanvas } = require('canvas');
const { saveCaptcha, verifyCaptcha } = require('../sheets/googleSheets');

const captchaMiddleware = {
    async generateCaptcha() {
        const canvas = createCanvas(300, 100);
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 300, 100);
        
        // Add noise
        for (let i = 0; i < 50; i++) {
            ctx.strokeStyle = `rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255})`;
            ctx.beginPath();
            ctx.moveTo(Math.random()*300, Math.random()*100);
            ctx.lineTo(Math.random()*300, Math.random()*100);
            ctx.stroke();
        }
        
        // Generate random text (mix of math and alphanumeric)
        const captchaTypes = ['math', 'text', 'mixed'];
        const type = captchaTypes[Math.floor(Math.random() * captchaTypes.length)];
        
        let text = '';
        let answer = '';
        
        if (type === 'math') {
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            const operator = ['+', '-', '×'][Math.floor(Math.random() * 3)];
            
            text = `${num1} ${operator} ${num2} = ?`;
            
            switch(operator) {
                case '+': answer = (num1 + num2).toString(); break;
                case '-': answer = (num1 - num2).toString(); break;
                case '×': answer = (num1 * num2).toString(); break;
            }
        } else {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            for (let i = 0; i < 6; i++) {
                answer += chars[Math.floor(Math.random() * chars.length)];
            }
            text = answer;
        }
        
        // Draw text
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#333';
        ctx.fillText(text, 20, 70);
        
        return {
            image: canvas.toBuffer(),
            answer: answer
        };
    },
    
    async sendCaptcha(bot, chatId, userId) {
        const { image, answer } = await this.generateCaptcha();
        await saveCaptcha(userId, answer);
        
        await bot.sendPhoto(chatId, image, {
            caption: '🔐 Please solve this captcha to continue:',
            reply_markup: {
                force_reply: true
            }
        });
    },
    
    async verifyUserCaptcha(userId, userInput) {
        return await verifyCaptcha(userId, userInput);
    }
};

module.exports = { captchaMiddleware };
