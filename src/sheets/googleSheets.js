// Remove all captcha related functions
// Keep only these essential functions

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const dotenv = require('dotenv');

dotenv.config();

const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

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
        
        // Initialize sheets
        await initializeSheets();
        
        return true;
    } catch (error) {
        console.error('❌ Google Sheets connection error:', error);
        return false;
    }
}

async function initializeSheets() {
    try {
        const sheets = ['Users', 'Vouchers', 'Orders', 'Categories', 'BlockedUsers', 'Settings'];
        
        for (const sheetTitle of sheets) {
            let sheet = doc.sheetsByTitle[sheetTitle];
            if (!sheet) {
                sheet = await doc.addSheet({ title: sheetTitle });
                console.log(`Created sheet: ${sheetTitle}`);
            }
        }
        
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

async function getAllUsers() {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        return await sheet.getRows();
    } catch (error) {
        console.error('Error getting all users:', error);
        return [];
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

async function addCategory(name, price, stock = '100') {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        const categoryId = (rows.length + 1).toString();
        const formattedName = `₹${name} Voucher`;
        
        await sheet.addRow({
            category_id: categoryId,
            name: formattedName,
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

// ============= Order Functions =============

async function createOrder(userId, category, quantity, totalPrice, status) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const orderId = `SVH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const recoveryExpiry = new Date();
        recoveryExpiry.setHours(recoveryExpiry.getHours() + 2);
        
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
            failed: todayOrders.filter(o => o.status === 'rejected').length
        };
    } catch (error) {
        console.error('Error getting daily stats:', error);
        return { newOrders: 0, revenue: 0, successful: 0, failed: 0 };
    }
}

module.exports = {
    setupGoogleSheets,
    addUser,
    getUser,
    getAllUsers,
    blockUser,
    unblockUser,
    isUserBlocked,
    getBlockedUsers,
    getCategories,
    addCategory,
    addVoucher,
    getAvailableVouchers,
    assignVoucherToOrder,
    createOrder,
    getOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    updateOrderPayment,
    getSetting,
    updateSetting,
    getStats,
    getDailyStats
};
