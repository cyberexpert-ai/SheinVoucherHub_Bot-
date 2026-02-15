const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const dotenv = require('dotenv');

dotenv.config();

const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

// Service account credentials from your JSON
const credentials = {
    "type": "service_account",
    "project_id": "flarechamp-4288c",
    "private_key_id": "aed2a23fd6b7c8e493f97d4d3c2d768b8fe8f965",
    "private_key": process.env.PRIVATE_KEY?.replace(/\\n/g, '\n') || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDVjwANtcI48FVK\ne2ItO5M0fY2gTCKWCP8tmqQC40P6GmyCuACoAR8XIvd+LJtwT55oMXA7rnc0WDBe\nYbbO2yoLv3wa86VZHwVXIf/OANYvFvpceOte2uuWyA5GREfGKyu/tL8I9rpRd0KF\nMe49qPRop1IOJNiG5nvPpJF+6IfLJz39a7jNIzpfrH9gIvAGxR0w/fq2lcj7W8xA\nfwuHknOn0JtyCq3SeFRANCpioNixoEMB0K0LZSHUdJ6saYLjJjfhgM2PZA5iF2vr\nYnyiB+2D7+dCIQTp0K+SS8PmplLm1TZBhva6R6vOpfvbNC5BzWLkZ8CuBOMyfjhb\nEyacdlYvAgMBAAECggEAKoXmW1SBP2gve3y08E/IAHAtlqkCTACvmuuLU93f57mC\nOMcdrlZG1AsM381PCB56asHJWMDlEIGs4+YuCeNe7Gbs9crk9il0nURyVJkbDNZU\n9LvJFiKePXBJU1l+NynadLovPcAvGlCWaMIn75QoUnxanOFeUgIrzg01QWFYxK0G\n65Pme9MEEXVFj8NtT//A6b9Y1Z1QFINDLLW6B3xLxoy+UoJrvt5SPpaeskAluHgV\nJYaf/pUwdnhvRpgP3CQWGBw0D4mSJXAze4JabPrXXlbdRQnQtYY1zHHSPEFlEeTv\nf0yGXJZFd9JZtR/1SqQ1rSPSpQEIQec/xB/YvMjNoQKBgQD3ERugpLdJL9geUU1/\nE1Ay/I2C8L2MxLxcK12XHhBk6mbgEaKWaUKJKtOyTun+zgfXCuPL0A9x+O5FOoFN\nR/gSgew0N6oEsEm/0GU0Gu7WaImqyoNKRiJIuGCoEBOWpT+XA7SAJrX0r0hhloEG\n3+yDPuLglqLf/1zbqUkqOWh5IQKBgQDdR7wE+i7V3CnkVBgNI1eMjOPY4/v3AYBc\nH0ZhVHEw7TYAuEnqILtHc3wz6In59ihTDtBxlXlZ0kRt7NgQpIJtrhWU2HRzWtTs\nLCNuWAy78MGDyfqflwADterwPxBXLjtI+m9pJV/dq1dBeEBsALZdp0ZbtxEVsMpx\nZL+Z3+FVTwKBgQCyMeCfSK35V0yk8TbXxHI/k+/s1P2hnfPM9moWKFTitD1mttFx\ncpHOpNjy7f/PC4KUEwKhaXr6VPRlcgD4YEQH9TULpGo3334RnpifsB06/0LrsAxp\ncZQgpvrvvEikiqMGpGF3XHQ3+oRV/lspPjAzqROxsHPg4ylyNPLURXuYgQKBgGWq\n0tE6nZA24qx8krxek5gJF5qMTTUU5IPu/qgzYvpG0rwL8DH5LfLLNbKn0dUd6zMW\nKGE3exTwze3vluo2m5KHHHVR6lch0ZhdQz4siFVFbbP+df8jIqeRysrtPrW/kQ+b\nuNqHiH9RfPqgpIC65w8qjuIOv3PG0Yy97GZnfaFzAoGBAJwmHE8o6VMnSY8l5C9T\nZCyDyUYjT98ULGvj52hVfrGSFkfIgiLucuFF3Usta1K92Kl/2t/sebtlwGklQwpf\nfkBRK+FTqfoJqF8grKLLoYPgW4mqsH0BpzKLG2KBykp2iQxIPJ0oXKVIY\njBm43Z15Mx5AXl/QyD2+xFWD\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@flarechamp-4288c.iam.gserviceaccount.com",
    "client_id": "111209605377977991419",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40flarechamp-4288c.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};

let doc;

async function setupGoogleSheets() {
    try {
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        doc = new GoogleSpreadsheet(GOOGLE_SHEETS_ID, serviceAccountAuth);
        await doc.loadInfo();
        
        console.log('Google Sheets connected successfully!');
        
        // Initialize sheets if they don't exist
        await initializeSheets();
    } catch (error) {
        console.error('Google Sheets connection error:', error);
    }
}

async function initializeSheets() {
    try {
        // Create necessary sheets
        const sheets = ['Users', 'Vouchers', 'Orders', 'Categories', 'BlockedUsers', 'Captcha', 'Settings'];
        
        for (const sheetTitle of sheets) {
            let sheet = doc.sheetsByTitle[sheetTitle];
            if (!sheet) {
                sheet = await doc.addSheet({ title: sheetTitle });
                
                // Add headers based on sheet type
                switch(sheetTitle) {
                    case 'Users':
                        await sheet.setHeaderRow(['user_id', 'username', 'first_name', 'join_date', 'verified', 'orders_count', 'total_spent']);
                        break;
                    case 'Vouchers':
                        await sheet.setHeaderRow(['voucher_id', 'code', 'category', 'price', 'status', 'buyer_id', 'order_id', 'purchase_date']);
                        break;
                    case 'Orders':
                        await sheet.setHeaderRow(['order_id', 'user_id', 'category', 'quantity', 'total_price', 'payment_method', 'transaction_id', 'screenshot', 'status', 'order_date', 'delivery_date', 'recovery_expiry']);
                        break;
                    case 'Categories':
                        await sheet.setHeaderRow(['category_id', 'name', 'price_per_code', 'stock', 'total_sold']);
                        break;
                    case 'BlockedUsers':
                        await sheet.setHeaderRow(['user_id', 'reason', 'blocked_by', 'block_date', 'block_type', 'expiry_date']);
                        break;
                    case 'Captcha':
                        await sheet.setHeaderRow(['user_id', 'captcha_text', 'expiry', 'attempts']);
                        break;
                    case 'Settings':
                        await sheet.setHeaderRow(['key', 'value', 'description']);
                        break;
                }
            }
        }
        
        // Add default settings
        await addDefaultSettings();
        
    } catch (error) {
        console.error('Error initializing sheets:', error);
    }
}

async function addDefaultSettings() {
    const settingsSheet = doc.sheetsByTitle['Settings'];
    const rows = await settingsSheet.getRows();
    
    const defaultSettings = [
        ['bot_status', 'active', 'Bot active/inactive status'],
        ['payment_method', 'manual', 'manual/baratpay'],
        ['captcha_enabled', 'true', 'Enable captcha verification'],
        ['recovery_hours', '2', 'Hours until recovery expires'],
        ['order_prefix', 'SVH', 'Order ID prefix']
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
}

// User functions
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
                total_spent: '0'
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

// Block/Unblock functions
async function blockUser(userId, reason, blockedBy, blockType = 'permanent', expiryDate = null) {
    try {
        const sheet = doc.sheetsByTitle['BlockedUsers'];
        await sheet.addRow({
            user_id: userId.toString(),
            reason: reason,
            blocked_by: blockedBy.toString(),
            block_date: new Date().toISOString(),
            block_type: blockType,
            expiry_date: expiryDate || ''
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

// Category functions
async function getCategories() {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        return rows;
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
            total_sold: '0'
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

// Voucher functions
async function addVoucher(code, category, price) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const voucherId = `VCH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
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

// Order functions
async function createOrder(userId, category, quantity, totalPrice, paymentMethod) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const orderId = `SVH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const recoveryExpiry = new Date();
        recoveryExpiry.setHours(recoveryExpiry.getHours() + 2); // 2 hours recovery time
        
        await sheet.addRow({
            order_id: orderId,
            user_id: userId.toString(),
            category: category,
            quantity: quantity.toString(),
            total_price: totalPrice.toString(),
            payment_method: paymentMethod,
            transaction_id: '',
            screenshot: '',
            status: 'pending',
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

// Captcha functions
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

// Settings functions
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

// Export all functions
module.exports = {
    setupGoogleSheets,
    addUser,
    getUser,
    updateUserVerification,
    blockUser,
    unblockUser,
    isUserBlocked,
    getCategories,
    addCategory,
    updateCategoryStock,
    addVoucher,
    getAvailableVouchers,
    assignVoucherToOrder,
    createOrder,
    getOrder,
    getUserOrders,
    updateOrderStatus,
    updateOrderPayment,
    saveCaptcha,
    verifyCaptcha,
    getSetting,
    updateSetting
};
