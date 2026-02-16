const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const dotenv = require('dotenv');

dotenv.config();

const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

// Service account credentials
const credentials = {
    type: "service_account",
    project_id: "flarechamp-4288c",
    private_key_id: "aed2a23fd6b7c8e493f97d4d3c2d768b8fe8f965",
    private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: "firebase-adminsdk-fbsvc@flarechamp-4288c.iam.gserviceaccount.com",
    client_id: "111209605377977991419",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40flarechamp-4288c.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
};

let doc;

// Main function to setup Google Sheets
async function setupGoogleSheets() {
    try {
        console.log('Setting up Google Sheets...');
        
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        doc = new GoogleSpreadsheet(GOOGLE_SHEETS_ID, serviceAccountAuth);
        await doc.loadInfo();
        
        console.log('✅ Google Sheets connected successfully!');
        
        // Initialize sheets if they don't exist
        await initializeSheets();
        
        return true;
    } catch (error) {
        console.error('❌ Google Sheets connection error:', error);
        return false;
    }
}

async function initializeSheets() {
    try {
        const sheets = ['Users', 'Vouchers', 'Orders', 'Categories', 'BlockedUsers', 'Captcha', 'Settings', 'Notifications', 'Discounts', 'Recovery'];
        
        for (const sheetTitle of sheets) {
            let sheet = doc.sheetsByTitle[sheetTitle];
            if (!sheet) {
                sheet = await doc.addSheet({ title: sheetTitle });
                console.log(`Created sheet: ${sheetTitle}`);
            }
        }
        
        // Add default settings
        await addDefaultSettings();
        
    } catch (error) {
        console.error('Error initializing sheets:', error);
    }
}

async function addDefaultSettings() {
    try {
        const settingsSheet = doc.sheetsByTitle['Settings'];
        const rows = await settingsSheet.getRows();
        
        const defaultSettings = [
            ['bot_status', 'active', 'Bot active/inactive status'],
            ['payment_method', 'both', 'manual/razorpay/both'],
            ['captcha_enabled', 'true', 'Enable captcha verification'],
            ['recovery_hours', '2', 'Hours until recovery expires'],
            ['order_prefix', 'SVH', 'Order ID prefix'],
            ['min_quantity', '1', 'Minimum purchase quantity'],
            ['max_quantity', '100', 'Maximum purchase quantity'],
            ['currency', 'INR', 'Default currency'],
            ['currency_symbol', '₹', 'Currency symbol'],
            ['tax_enabled', 'false', 'Enable tax'],
            ['tax_rate', '0', 'Tax rate percentage']
        ];
        
        for (const setting of defaultSettings) {
            const exists = rows.find(row => row.key === setting[0]);
            if (!exists) {
                await settingsSheet.addRow({
                    key: setting[0],
                    value: setting[1],
                    description: setting[2]
                });
            }
        }
    } catch (error) {
        console.error('Error adding default settings:', error);
    }
}

// ============= User Functions =============

async function addUser(userId, username, firstName) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const existingUser = rows.find(row => row.user_id === userId.toString());
        
        if (!existingUser) {
            await sheet.addRow({
                user_id: userId.toString(),
                username: username || 'N/A',
                first_name: firstName || 'N/A',
                join_date: new Date().toISOString(),
                verified: 'false',
                orders_count: '0',
                total_spent: '0',
                role: 'user',
                restrictions: '{}',
                devices: '[]'
            });
        }
        return true;
    } catch (error) {
        console.error('Error adding user:', error);
        return false;
    }
}

async function getUser(userId) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        return rows.find(row => row.user_id === userId.toString());
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

async function getAllUsers() {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        return await sheet.getRows();
    } catch (error) {
        console.error('Error getting all users:', error);
        return [];
    }
}

async function updateUserVerification(userId, status) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const user = rows.find(row => row.user_id === userId.toString());
        
        if (user) {
            user.verified = status.toString();
            await user.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating user verification:', error);
        return false;
    }
}

// ============= Block/Unblock Functions =============

async function blockUser(userId, reason, blockedBy, blockType = 'permanent', expiryDate = null) {
    try {
        const sheet = doc.sheetsByTitle['BlockedUsers'];
        await sheet.addRow({
            user_id: userId.toString(),
            reason: reason,
            blocked_by: blockedBy.toString(),
            block_date: new Date().toISOString(),
            block_type: blockType,
            expiry_date: expiryDate ? expiryDate.toISOString() : ''
        });
        return true;
    } catch (error) {
        console.error('Error blocking user:', error);
        return false;
    }
}

async function unblockUser(userId) {
    try {
        const sheet = doc.sheetsByTitle['BlockedUsers'];
        const rows = await sheet.getRows();
        const userBlocks = rows.filter(row => row.user_id === userId.toString());
        
        for (const block of userBlocks) {
            await block.delete();
        }
        return true;
    } catch (error) {
        console.error('Error unblocking user:', error);
        return false;
    }
}

async function isUserBlocked(userId) {
    try {
        const sheet = doc.sheetsByTitle['BlockedUsers'];
        const rows = await sheet.getRows();
        const blocks = rows.filter(row => row.user_id === userId.toString());
        
        if (blocks.length === 0) return false;
        
        // Check for temporary blocks
        for (const block of blocks) {
            if (block.block_type === 'temporary' && block.expiry_date) {
                const expiry = new Date(block.expiry_date);
                if (new Date() > expiry) {
                    await block.delete();
                    return false;
                }
            }
        }
        
        return blocks.length > 0;
    } catch (error) {
        console.error('Error checking block status:', error);
        return false;
    }
}

async function getBlockedUsers() {
    try {
        const sheet = doc.sheetsByTitle['BlockedUsers'];
        return await sheet.getRows();
    } catch (error) {
        console.error('Error getting blocked users:', error);
        return [];
    }
}

// ============= Category Functions =============

async function getCategories() {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        return await sheet.getRows();
    } catch (error) {
        console.error('Error getting categories:', error);
        return [];
    }
}

async function addCategory(name, price, stock) {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        const categoryId = (rows.length + 1).toString();
        
        await sheet.addRow({
            category_id: categoryId,
            name: name,
            price_per_code: price.toString(),
            stock: stock.toString(),
            total_sold: '0',
            discount: '0',
            description: ''
        });
        return true;
    } catch (error) {
        console.error('Error adding category:', error);
        return false;
    }
}

async function updateCategoryStock(categoryId, newStock) {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        const category = rows.find(row => row.category_id === categoryId.toString());
        
        if (category) {
            category.stock = newStock.toString();
            await category.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating category stock:', error);
        return false;
    }
}

async function deleteCategory(categoryId) {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        const category = rows.find(row => row.category_id === categoryId.toString());
        
        if (category) {
            await category.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting category:', error);
        return false;
    }
}

// ============= Voucher Functions =============

async function addVoucher(code, category, price) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const voucherId = `VCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        await sheet.addRow({
            voucher_id: voucherId,
            code: code,
            category: category,
            price: price.toString(),
            status: 'available',
            buyer_id: '',
            order_id: '',
            purchase_date: ''
        });
        return voucherId;
    } catch (error) {
        console.error('Error adding voucher:', error);
        return null;
    }
}

async function getAvailableVouchers(category) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.category === category && row.status === 'available');
    } catch (error) {
        console.error('Error getting available vouchers:', error);
        return [];
    }
}

async function getVouchersByCategory(categoryId) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.category === categoryId);
    } catch (error) {
        console.error('Error getting vouchers by category:', error);
        return [];
    }
}

async function assignVoucherToOrder(voucherId, buyerId, orderId) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        const voucher = rows.find(row => row.voucher_id === voucherId);
        
        if (voucher) {
            voucher.status = 'sold';
            voucher.buyer_id = buyerId.toString();
            voucher.order_id = orderId;
            voucher.purchase_date = new Date().toISOString();
            await voucher.save();
        }
        return true;
    } catch (error) {
        console.error('Error assigning voucher:', error);
        return false;
    }
}

async function deleteVoucher(code) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        const voucher = rows.find(row => row.code === code);
        
        if (voucher) {
            await voucher.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting voucher:', error);
        return false;
    }
}

async function updateVoucherPrice(categoryId, newPrice) {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        const category = rows.find(row => row.category_id === categoryId.toString());
        
        if (category) {
            category.price_per_code = newPrice.toString();
            await category.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating voucher price:', error);
        return false;
    }
}

// ============= Order Functions =============

async function createOrder(userId, category, quantity, totalPrice, status) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const orderId = `SVH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const recoveryExpiry = new Date();
        recoveryExpiry.setHours(recoveryExpiry.getHours() + 2); // 2 hours recovery time
        
        const user = await getUser(userId);
        
        await sheet.addRow({
            order_id: orderId,
            user_id: userId.toString(),
            username: user?.username || '',
            category: category,
            quantity: quantity.toString(),
            total_price: totalPrice.toString(),
            payment_method: '',
            transaction_id: '',
            screenshot: '',
            status: status,
            order_date: new Date().toISOString(),
            delivery_date: '',
            recovery_expiry: recoveryExpiry.toISOString()
        });
        
        return orderId;
    } catch (error) {
        console.error('Error creating order:', error);
        return null;
    }
}

async function getOrder(orderId) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        return rows.find(row => row.order_id === orderId);
    } catch (error) {
        console.error('Error getting order:', error);
        return null;
    }
}

async function getUserOrders(userId) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.user_id === userId.toString());
    } catch (error) {
        console.error('Error getting user orders:', error);
        return [];
    }
}

async function getAllOrders() {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        return await sheet.getRows();
    } catch (error) {
        console.error('Error getting all orders:', error);
        return [];
    }
}

async function updateOrderStatus(orderId, status, deliveryDate = null) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        const order = rows.find(row => row.order_id === orderId);
        
        if (order) {
            order.status = status;
            if (deliveryDate) {
                order.delivery_date = deliveryDate;
            }
            await order.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating order status:', error);
        return false;
    }
}

async function updateOrderPayment(orderId, transactionId, screenshot) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        const order = rows.find(row => row.order_id === orderId);
        
        if (order) {
            order.transaction_id = transactionId;
            order.screenshot = screenshot;
            await order.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating order payment:', error);
        return false;
    }
}

// ============= Captcha Functions =============

async function saveCaptcha(userId, captchaText) {
    try {
        const sheet = doc.sheetsByTitle['Captcha'];
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 5); // 5 minutes expiry
        
        // Delete old captchas
        const rows = await sheet.getRows();
        const oldCaptchas = rows.filter(row => row.user_id === userId.toString());
        for (const captcha of oldCaptchas) {
            await captcha.delete();
        }
        
        await sheet.addRow({
            user_id: userId.toString(),
            captcha_text: captchaText,
            expiry: expiry.toISOString(),
            attempts: '0'
        });
        return true;
    } catch (error) {
        console.error('Error saving captcha:', error);
        return false;
    }
}

async function verifyCaptcha(userId, userInput) {
    try {
        const sheet = doc.sheetsByTitle['Captcha'];
        const rows = await sheet.getRows();
        const captchaRow = rows.find(row => row.user_id === userId.toString());
        
        if (!captchaRow) return false;
        
        const expiry = new Date(captchaRow.expiry);
        if (new Date() > expiry) {
            await captchaRow.delete();
            return false;
        }
        
        const attempts = parseInt(captchaRow.attempts) + 1;
        captchaRow.attempts = attempts.toString();
        await captchaRow.save();
        
        if (captchaRow.captcha_text === userInput) {
            await captchaRow.delete();
            await updateUserVerification(userId, 'true');
            return true;
        }
        
        if (attempts >= 3) {
            await captchaRow.delete();
            return false;
        }
        
        return false;
    } catch (error) {
        console.error('Error verifying captcha:', error);
        return false;
    }
}

// ============= Settings Functions =============

async function getSetting(key) {
    try {
        const sheet = doc.sheetsByTitle['Settings'];
        const rows = await sheet.getRows();
        const setting = rows.find(row => row.key === key);
        return setting ? setting.value : null;
    } catch (error) {
        console.error('Error getting setting:', error);
        return null;
    }
}

async function updateSetting(key, value) {
    try {
        const sheet = doc.sheetsByTitle['Settings'];
        const rows = await sheet.getRows();
        const setting = rows.find(row => row.key === key);
        
        if (setting) {
            setting.value = value;
            await setting.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating setting:', error);
        return false;
    }
}

// ============= Stats Functions =============

async function getStats() {
    try {
        const users = await getAllUsers();
        const orders = await getAllOrders();
        const categories = await getCategories();
        
        return {
            totalUsers: users.length,
            totalOrders: orders.length,
            totalCategories: categories.length
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return {};
    }
}

async function getDailyStats() {
    try {
        const orders = await getAllOrders();
        const today = new Date().toDateString();
        
        const todayOrders = orders.filter(o => 
            new Date(o.order_date).toDateString() === today
        );
        
        return {
            newOrders: todayOrders.length,
            revenue: todayOrders
                .filter(o => o.status === 'delivered')
                .reduce((sum, o) => sum + parseInt(o.total_price || '0'), 0),
            successful: todayOrders.filter(o => o.status === 'delivered').length,
            failed: todayOrders.filter(o => o.status === 'rejected').length,
            newUsers: 0
        };
    } catch (error) {
        console.error('Error getting daily stats:', error);
        return { newOrders: 0, revenue: 0, successful: 0, failed: 0, newUsers: 0 };
    }
}

// ============= Helper Functions =============

async function addCategoryDiscount(categoryId, discount) {
    console.log('Adding category discount:', categoryId, discount);
}

async function setUserRestriction(userId, type, duration) {
    console.log('Setting user restriction:', userId, type, duration);
}

async function sendBroadcast(message) {
    console.log('Sending broadcast:', message);
}

async function sendPersonalMessage(userId, message) {
    console.log('Sending personal message to', userId, ':', message);
}

async function setWelcomeMessage(message) {
    await updateSetting('welcome_message', message);
}

async function getWelcomeMessage() {
    return await getSetting('welcome_message');
}

async function setDisclaimer(message) {
    await updateSetting('disclaimer', message);
}

async function getDisclaimer() {
    return await getSetting('disclaimer');
}

async function setSupportMessage(message) {
    await updateSetting('support_message', message);
}

async function getSupportMessage() {
    return await getSetting('support_message');
}

async function setPaymentMessage(message) {
    await updateSetting('payment_message', message);
}

async function getPaymentMessage() {
    return await getSetting('payment_message');
}

async function setSuccessMessage(message) {
    await updateSetting('success_message', message);
}

async function getSuccessMessage() {
    return await getSetting('success_message');
}

async function setFailureMessage(message) {
    await updateSetting('failure_message', message);
}

async function getFailureMessage() {
    return await getSetting('failure_message');
}

async function setBotStatus(status) {
    await updateSetting('bot_status', status);
}

async function getBotStatus() {
    return await getSetting('bot_status') || 'active';
}

async function setMaintenanceMode(mode) {
    await updateSetting('maintenance_mode', mode);
}

async function getMaintenanceMode() {
    return await getSetting('maintenance_mode') || 'off';
}

async function setCaptchaEnabled(enabled) {
    await updateSetting('captcha_enabled', enabled);
}

async function getCaptchaEnabled() {
    return await getSetting('captcha_enabled') || 'true';
}

async function setCaptchaType(type) {
    await updateSetting('captcha_type', type);
}

async function getCaptchaType() {
    return await getSetting('captcha_type') || 'math';
}

async function setChannelCheck(enabled) {
    await updateSetting('channel_check', enabled);
}

async function getChannelCheck() {
    return await getSetting('channel_check') || 'true';
}

async function setChannelLinks(channel1, channel2) {
    await updateSetting('channel_1', channel1);
    await updateSetting('channel_2', channel2);
}

async function getChannelLinks() {
    return {
        channel1: await getSetting('channel_1') || process.env.CHANNEL_1,
        channel2: await getSetting('channel_2') || process.env.CHANNEL_2
    };
}

async function setPaymentMethod(method) {
    await updateSetting('payment_method', method);
}

async function getPaymentMethod() {
    return await getSetting('payment_method') || 'both';
}

async function setCurrency(currency) {
    await updateSetting('currency', currency);
}

async function getCurrency() {
    return await getSetting('currency') || 'INR';
}

async function setCurrencySymbol(symbol) {
    await updateSetting('currency_symbol', symbol);
}

async function getCurrencySymbol() {
    return await getSetting('currency_symbol') || '₹';
}

async function setTaxEnabled(enabled) {
    await updateSetting('tax_enabled', enabled);
}

async function getTaxEnabled() {
    return await getSetting('tax_enabled') || 'false';
}

async function setTaxRate(rate) {
    await updateSetting('tax_rate', rate);
}

async function getTaxRate() {
    return await getSetting('tax_rate') || '0';
}

async function setTaxType(type) {
    await updateSetting('tax_type', type);
}

async function getTaxType() {
    return await getSetting('tax_type') || 'percentage';
}

async function setRecoveryHours(hours) {
    await updateSetting('recovery_hours', hours);
}

async function getRecoveryHours() {
    return await getSetting('recovery_hours') || '2';
}

async function setMaxQuantity(quantity) {
    await updateSetting('max_quantity', quantity);
}

async function getMaxQuantity() {
    return await getSetting('max_quantity') || '100';
}

async function setMinQuantity(quantity) {
    await updateSetting('min_quantity', quantity);
}

async function getMinQuantity() {
    return await getSetting('min_quantity') || '1';
}

async function setOrderPrefix(prefix) {
    await updateSetting('order_prefix', prefix);
}

async function getOrderPrefix() {
    return await getSetting('order_prefix') || 'SVH';
}

async function setLanguage(lang) {
    await updateSetting('language', lang);
}

async function getLanguage() {
    return await getSetting('language') || 'en';
}

async function setTimezone(tz) {
    await updateSetting('timezone', tz);
}

async function getTimezone() {
    return await getSetting('timezone') || 'Asia/Kolkata';
}

async function setDateFormat(format) {
    await updateSetting('date_format', format);
}

async function getDateFormat() {
    return await getSetting('date_format') || 'DD/MM/YYYY';
}

async function setTimeFormat(format) {
    await updateSetting('time_format', format);
}

async function getTimeFormat() {
    return await getSetting('time_format') || 'HH:mm';
}

async function setCurrencyPosition(position) {
    await updateSetting('currency_position', position);
}

async function getCurrencyPosition() {
    return await getSetting('currency_position') || 'before';
}

async function setDecimalSeparator(separator) {
    await updateSetting('decimal_separator', separator);
}

async function getDecimalSeparator() {
    return await getSetting('decimal_separator') || '.';
}

async function setThousandSeparator(separator) {
    await updateSetting('thousand_separator', separator);
}

async function getThousandSeparator() {
    return await getSetting('thousand_separator') || ',';
}

async function setAPIAccess(access) {
    await updateSetting('api_access', access);
}

async function getAPIAccess() {
    return await getSetting('api_access') || 'false';
}

async function setAPIKey(key) {
    await updateSetting('api_key', key);
}

async function getAPIKey() {
    return await getSetting('api_key');
}

async function setWebhookEnabled(enabled) {
    await updateSetting('webhook_enabled', enabled);
}

async function getWebhookEnabled() {
    return await getSetting('webhook_enabled') || 'false';
}

async function setWebhookURL(url) {
    await updateSetting('webhook_url', url);
}

async function getWebhookURL() {
    return await getSetting('webhook_url');
}

async function setRateLimit(limit) {
    await updateSetting('rate_limit', limit);
}

async function getRateLimit() {
    return await getSetting('rate_limit') || '10';
}

async function setRateLimitTime(time) {
    await updateSetting('rate_limit_time', time);
}

async function getRateLimitTime() {
    return await getSetting('rate_limit_time') || '60';
}

async function setIPWhitelist(list) {
    await updateSetting('ip_whitelist', JSON.stringify(list));
}

async function getIPWhitelist() {
    const data = await getSetting('ip_whitelist');
    return data ? JSON.parse(data) : [];
}

async function setIPBlacklist(list) {
    await updateSetting('ip_blacklist', JSON.stringify(list));
}

async function getIPBlacklist() {
    const data = await getSetting('ip_blacklist');
    return data ? JSON.parse(data) : [];
}

async function setEmailAlerts(enabled) {
    await updateSetting('email_alerts', enabled);
}

async function getEmailAlerts() {
    return await getSetting('email_alerts') || 'false';
}

async function setTelegramAlerts(enabled) {
    await updateSetting('telegram_alerts', enabled);
}

async function getTelegramAlerts() {
    return await getSetting('telegram_alerts') || 'false';
}

async function setAlertEmail(email) {
    await updateSetting('alert_email', email);
}

async function getAlertEmail() {
    return await getSetting('alert_email');
}

async function setAlertTelegram(chatId) {
    await updateSetting('alert_telegram', chatId);
}

async function getAlertTelegram() {
    return await getSetting('alert_telegram');
}

async function setBackupEnabled(enabled) {
    await updateSetting('backup_enabled', enabled);
}

async function getBackupEnabled() {
    return await getSetting('backup_enabled') || 'false';
}

async function setBackupInterval(interval) {
    await updateSetting('backup_interval', interval);
}

async function getBackupInterval() {
    return await getSetting('backup_interval') || '24';
}

async function setLowStockThreshold(threshold) {
    await updateSetting('low_stock_threshold', threshold);
}

async function getLowStockThreshold() {
    return await getSetting('low_stock_threshold') || '10';
}

async function setExpiryDays(days) {
    await updateSetting('expiry_days', days);
}

async function getExpiryDays() {
    return await getSetting('expiry_days') || '7';
}

async function setOrderAlert(amount) {
    await updateSetting('order_alert', amount);
}

async function getOrderAlert() {
    return await getSetting('order_alert') || '50';
}

async function setPaymentAlert(amount) {
    await updateSetting('payment_alert', amount);
}

async function getPaymentAlert() {
    return await getSetting('payment_alert') || '1000';
}

async function setBlockAlert(enabled) {
    await updateSetting('block_alert', enabled);
}

async function getBlockAlert() {
    return await getSetting('block_alert') || 'true';
}

async function setRecoveryAlert(enabled) {
    await updateSetting('recovery_alert', enabled);
}

async function getRecoveryAlert() {
    return await getSetting('recovery_alert') || 'true';
}

async function setSupportAlert(enabled) {
    await updateSetting('support_alert', enabled);
}

async function getSupportAlert() {
    return await getSetting('support_alert') || 'true';
}

async function setReferralEnabled(enabled) {
    await updateSetting('referral_enabled', enabled);
}

async function getReferralEnabled() {
    return await getSetting('referral_enabled') || 'false';
}

async function setReferralBonus(bonus) {
    await updateSetting('referral_bonus', bonus);
}

async function getReferralBonus() {
    return await getSetting('referral_bonus') || '50|fixed';
}

async function setReferralTier(tier) {
    await updateSetting('referral_tier', tier);
}

async function getReferralTier() {
    return await getSetting('referral_tier') || '5|10|15|20|25';
}

async function backupData() {
    try {
        const data = {
            users: await getAllUsers(),
            vouchers: await getVouchersByCategory('all'),
            orders: await getAllOrders(),
            categories: await getCategories(),
            blocked: await getBlockedUsers(),
            timestamp: new Date().toISOString()
        };
        await updateSetting('last_backup', new Date().toISOString());
        return data;
    } catch (error) {
        console.error('Error backing up data:', error);
        return {};
    }
}

async function clearOldData() {
    console.log('Clearing old data...');
}

// Export all functions
module.exports = {
    setupGoogleSheets,
    addUser,
    getUser,
    getAllUsers,
    updateUserVerification,
    blockUser,
    unblockUser,
    isUserBlocked,
    getBlockedUsers,
    getCategories,
    addCategory,
    updateCategoryStock,
    deleteCategory,
    addVoucher,
    getAvailableVouchers,
    getVouchersByCategory,
    assignVoucherToOrder,
    deleteVoucher,
    updateVoucherPrice,
    createOrder,
    getOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    updateOrderPayment,
    saveCaptcha,
    verifyCaptcha,
    getSetting,
    updateSetting,
    getStats,
    getDailyStats,
    addCategoryDiscount,
    setUserRestriction,
    sendBroadcast,
    sendPersonalMessage,
    setWelcomeMessage,
    getWelcomeMessage,
    setDisclaimer,
    getDisclaimer,
    setSupportMessage,
    getSupportMessage,
    setPaymentMessage,
    getPaymentMessage,
    setSuccessMessage,
    getSuccessMessage,
    setFailureMessage,
    getFailureMessage,
    setBotStatus,
    getBotStatus,
    setMaintenanceMode,
    getMaintenanceMode,
    setCaptchaEnabled,
    getCaptchaEnabled,
    setCaptchaType,
    getCaptchaType,
    setChannelCheck,
    getChannelCheck,
    setChannelLinks,
    getChannelLinks,
    setPaymentMethod,
    getPaymentMethod,
    setCurrency,
    getCurrency,
    setCurrencySymbol,
    getCurrencySymbol,
    setTaxEnabled,
    getTaxEnabled,
    setTaxRate,
    getTaxRate,
    setTaxType,
    getTaxType,
    setRecoveryHours,
    getRecoveryHours,
    setMaxQuantity,
    getMaxQuantity,
    setMinQuantity,
    getMinQuantity,
    setOrderPrefix,
    getOrderPrefix,
    setLanguage,
    getLanguage,
    setTimezone,
    getTimezone,
    setDateFormat,
    getDateFormat,
    setTimeFormat,
    getTimeFormat,
    setCurrencyPosition,
    getCurrencyPosition,
    setDecimalSeparator,
    getDecimalSeparator,
    setThousandSeparator,
    getThousandSeparator,
    setAPIAccess,
    getAPIAccess,
    setAPIKey,
    getAPIKey,
    setWebhookEnabled,
    getWebhookEnabled,
    setWebhookURL,
    getWebhookURL,
    setRateLimit,
    getRateLimit,
    setRateLimitTime,
    getRateLimitTime,
    setIPWhitelist,
    getIPWhitelist,
    setIPBlacklist,
    getIPBlacklist,
    setEmailAlerts,
    getEmailAlerts,
    setTelegramAlerts,
    getTelegramAlerts,
    setAlertEmail,
    getAlertEmail,
    setAlertTelegram,
    getAlertTelegram,
    setBackupEnabled,
    getBackupEnabled,
    setBackupInterval,
    getBackupInterval,
    setLowStockThreshold,
    getLowStockThreshold,
    setExpiryDays,
    getExpiryDays,
    setOrderAlert,
    getOrderAlert,
    setPaymentAlert,
    getPaymentAlert,
    setBlockAlert,
    getBlockAlert,
    setRecoveryAlert,
    getRecoveryAlert,
    setSupportAlert,
    getSupportAlert,
    setReferralEnabled,
    getReferralEnabled,
    setReferralBonus,
    getReferralBonus,
    setReferralTier,
    getReferralTier,
    backupData,
    clearOldData
};
