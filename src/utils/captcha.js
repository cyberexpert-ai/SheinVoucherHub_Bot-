const { createCanvas } = require('canvas');

async function generateCaptcha() {
    const width = 200;
    const height = 80;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    // Generate random number
    const captchaText = Math.floor(1000 + Math.random() * 9000).toString();

    // Add noise
    for (let i = 0; i < 50; i++) {
        ctx.strokeStyle = `rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255})`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
    }

    // Add text
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(captchaText, 30, 55);

    // Add more noise
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255})`;
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    const buffer = canvas.toBuffer('image/png');
    
    return {
        text: captchaText,
        image: buffer
    };
}

function verifyCaptcha(input, expected) {
    return input === expected;
}

module.exports = { generateCaptcha, verifyCaptcha };
