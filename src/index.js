const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const multer = require('multer');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { setupGoogleSheets } = require('./sheets/googleSheets');
const { messageHandler } = require('./handlers/messageHandler');
const { callbackHandler } = require('./handlers/callbackHandler');
const { authMiddleware } = require('./middlewares/auth');
const { channelCheckMiddleware } = require('./middlewares/channelCheck');
const { getPaymentPageHTML } = require('./utils/paymentPage');

dotenv.config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage() });

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

global.bot = bot;

setupGoogleSheets();

// ==================== API Routes ====================

app.get('/pay', (req, res) => {
    const { orderId, amount, userId } = req.query;
    res.send(getPaymentPageHTML(orderId, amount, userId));
});

app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, orderId } = req.body;
        
        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: orderId,
            payment_capture: 1
        };
        
        const order = await razorpay.orders.create(options);
        
        res.json({
            success: true,
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/verify-payment', async (req, res) => {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, userId } = req.body;
        
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");
        
        const isAuthentic = expectedSignature === razorpaySignature;
        
        if (isAuthentic) {
            const { autoDeliverVouchers } = require('./handlers/paymentHandler');
            const result = await autoDeliverVouchers(orderId, 'razorpay', razorpayPaymentId);
            
            if (result.success) {
                res.json({ 
                    success: true, 
                    message: 'Payment verified! Vouchers delivered.',
                    vouchers: result.vouchers 
                });
            } else {
                res.json({ 
                    success: false, 
                    error: result.error 
                });
            }
        } else {
            res.json({ success: false, error: 'Invalid signature' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/submit-manual-payment', upload.single('screenshot'), async (req, res) => {
    try {
        const { orderId, utr, userId } = req.body;
        
        if (!req.file) {
            return res.json({ success: false, error: 'Screenshot required' });
        }
        
        const screenshotBase64 = req.file.buffer.toString('base64');
        const screenshotData = `data:${req.file.mimetype};base64,${screenshotBase64}`;
        
        const { submitManualPayment } = require('./handlers/paymentHandler');
        const result = await submitManualPayment(orderId, userId, utr, screenshotData);
        
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/payment-status', async (req, res) => {
    try {
        const { orderId } = req.query;
        const { getOrder } = require('./sheets/googleSheets');
        const order = await getOrder(orderId);
        
        res.json({
            success: true,
            status: order ? order.status : 'not_found'
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ==================== Bot Message Handlers ====================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId.toString() === process.env.ADMIN_ID) {
        return messageHandler(bot, msg);
    }

    const isBlocked = await authMiddleware.checkBlocked(userId);
    if (isBlocked) {
        return bot.sendMessage(chatId, '⛔ You are blocked. Contact @SheinVoucherHub');
    }

    const isMember = await channelCheckMiddleware.checkChannels(bot, userId);
    if (!isMember && msg.text !== '/start') {
        return channelCheckMiddleware.sendJoinMessage(bot, chatId);
    }

    messageHandler(bot, msg);
});

bot.on('callback_query', async (callbackQuery) => {
    const userId = callbackQuery.from.id;
    
    if (userId.toString() === process.env.ADMIN_ID) {
        return callbackHandler(bot, callbackQuery);
    }

    callbackHandler(bot, callbackQuery);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

console.log('Bot started successfully!');
