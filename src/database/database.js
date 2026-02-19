const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize database
function initDatabase() {
    if (!fs.existsSync(DATA_FILE)) {
        const defaultData = {
            users: [],
            categories: [
                { 
                    id: "1", 
                    name: "₹500 Shein Voucher", 
                    basePrice: 500,
                    prices: {
                        1: 29,
                        5: 29,
                        10: 25,
                        20: 25
                    },
                    stock: 100, 
                    sold: 0, 
                    status: "active" 
                },
                { 
                    id: "2", 
                    name: "₹1000 Shein Voucher", 
                    basePrice: 1000,
                    prices: {
                        1: 55,
                        5: 52,
                        10: 48,
                        20: 45
                    },
                    stock: 100, 
                    sold: 0, 
                    status: "active" 
                },
                { 
                    id: "3", 
                    name: "₹2000 Shein Voucher", 
                    basePrice: 2000,
                    prices: {
                        1: 99,
                        5: 95,
                        10: 90,
                        20: 85
                    },
                    stock: 100, 
                    sold: 0, 
                    status: "active" 
                },
                { 
                    id: "4", 
                    name: "₹4000 Shein Voucher", 
                    basePrice: 4000,
                    prices: {
                        1: 180,
                        5: 175,
                        10: 165,
                        20: 150
                    },
                    stock: 100, 
                    sold: 0, 
                    status: "active" 
                }
            ],
            vouchers: [],
            orders: [],
            blockedUsers: [],
            settings: {
                bot_status: "active",
                payment_qr: "https://i.supaimg.com/00332ad4-8aa7-408f-8705-55dbc91ea737.jpg",
                recovery_hours: 2,
                order_prefix: "SVH",
                support_bot: "@SheinSupportRobot"
            },
            stats: {
                totalUsers: 0,
                totalOrders: 0,
                totalRevenue: 0
            }
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }
}

// Load data
function loadData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading data:', error);
        return null;
    }
}

// Save data
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// ==================== USER FUNCTIONS ====================

function addUser(userId, username, firstName) {
    const data = loadData();
    const existing = data.users.find(u => u.id === userId);
    
    if (!existing) {
        data.users.push({
            id: userId,
            username: username || 'N/A',
            firstName: firstName || 'N/A',
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            role: 'user',
            orders: [],
            totalSpent: 0,
            status: 'active',
            warnings: 0
        });
        data.stats.totalUsers = data.users.length;
        saveData(data);
        return true;
    } else {
        existing.lastActive = new Date().toISOString();
        saveData(data);
        return true;
    }
}

function getUser(userId) {
    const data = loadData();
    return data.users.find(u => u.id === userId);
}

function getAllUsers() {
    const data = loadData();
    return data.users;
}

function blockUser(userId, reason, duration = null) {
    const data = loadData();
    const user = data.users.find(u => u.id === userId);
    
    if (user) {
        user.status = 'blocked';
        data.blockedUsers.push({
            id: userId,
            reason: reason,
            date: new Date().toISOString(),
            duration: duration,
            expiresAt: duration ? new Date(Date.now() + duration * 3600000).toISOString() : null
        });
        saveData(data);
        return true;
    }
    return false;
}

function unblockUser(userId) {
    const data = loadData();
    const user = data.users.find(u => u.id === userId);
    
    if (user) {
        user.status = 'active';
        data.blockedUsers = data.blockedUsers.filter(b => b.id !== userId);
        saveData(data);
        return true;
    }
    return false;
}

function isUserBlocked(userId) {
    const data = loadData();
    const blocked = data.blockedUsers.find(b => b.id === userId);
    
    if (!blocked) return false;
    
    // Check temporary block expiry
    if (blocked.expiresAt && new Date(blocked.expiresAt) < new Date()) {
        unblockUser(userId);
        return false;
    }
    
    return true;
}

function getBlockedUsers() {
    const data = loadData();
    return data.blockedUsers;
}

function addWarning(userId, reason) {
    const data = loadData();
    const user = data.users.find(u => u.id === userId);
    
    if (user) {
        user.warnings = (user.warnings || 0) + 1;
        if (user.warnings >= 3) {
            blockUser(userId, '3 warnings - auto blocked');
        }
        saveData(data);
        return user.warnings;
    }
    return 0;
}

// ==================== CATEGORY FUNCTIONS ====================

function getCategories() {
    const data = loadData();
    return data.categories;
}

function getCategory(categoryId) {
    const data = loadData();
    return data.categories.find(c => c.id === categoryId);
}

function addCategory(name, basePrice, prices, stock = 100) {
    const data = loadData();
    const id = (data.categories.length + 1).toString();
    
    data.categories.push({
        id: id,
        name: `₹${name} Shein Voucher`,
        basePrice: parseInt(basePrice),
        prices: prices,
        stock: parseInt(stock),
        sold: 0,
        status: 'active',
        createdAt: new Date().toISOString()
    });
    
    saveData(data);
    return id;
}

function updateCategory(categoryId, updates) {
    const data = loadData();
    const cat = data.categories.find(c => c.id === categoryId);
    
    if (cat) {
        Object.assign(cat, updates);
        saveData(data);
        return true;
    }
    return false;
}

function deleteCategory(categoryId) {
    const data = loadData();
    data.categories = data.categories.filter(c => c.id !== categoryId);
    saveData(data);
    return true;
}

function updateCategoryStock(categoryId, newStock) {
    return updateCategory(categoryId, { stock: parseInt(newStock) });
}

function updateCategoryPrice(categoryId, quantity, newPrice) {
    const data = loadData();
    const cat = data.categories.find(c => c.id === categoryId);
    
    if (cat) {
        cat.prices[quantity.toString()] = parseInt(newPrice);
        saveData(data);
        return true;
    }
    return false;
}

function getPriceForQuantity(categoryId, quantity) {
    const cat = getCategory(categoryId);
    if (!cat) return 0;
    
    const prices = cat.prices;
    
    // Find best price for quantity
    const quantities = Object.keys(prices).map(Number).sort((a, b) => a - b);
    let bestPrice = prices[1] || cat.basePrice;
    
    for (const q of quantities) {
        if (quantity >= q) {
            bestPrice = prices[q];
        } else {
            break;
        }
    }
    
    return bestPrice;
}

function calculateTotalPrice(categoryId, quantity) {
    const pricePerCode = getPriceForQuantity(categoryId, quantity);
    return pricePerCode * quantity;
}

// ==================== VOUCHER FUNCTIONS ====================

function getVouchers(categoryId = null) {
    const data = loadData();
    if (categoryId) {
        return data.vouchers.filter(v => v.categoryId === categoryId);
    }
    return data.vouchers;
}

function getAvailableVouchers(categoryId) {
    const data = loadData();
    return data.vouchers.filter(v => 
        v.categoryId === categoryId && 
        v.status === 'available'
    );
}

function addVoucher(code, categoryId, price) {
    const data = loadData();
    const id = `VCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    data.vouchers.push({
        id: id,
        code: code,
        categoryId: categoryId,
        price: parseInt(price),
        status: 'available',
        createdAt: new Date().toISOString()
    });
    
    saveData(data);
    return id;
}

function bulkAddVouchers(categoryId, codes, price) {
    const added = [];
    for (const code of codes) {
        const id = addVoucher(code, categoryId, price);
        added.push(id);
    }
    return added;
}

function deleteVoucher(voucherId) {
    const data = loadData();
    data.vouchers = data.vouchers.filter(v => v.id !== voucherId);
    saveData(data);
    return true;
}

function deleteVouchersByCategory(categoryId) {
    const data = loadData();
    data.vouchers = data.vouchers.filter(v => v.categoryId !== categoryId);
    saveData(data);
    return true;
}

function assignVoucher(voucherId, buyerId, orderId) {
    const data = loadData();
    const voucher = data.vouchers.find(v => v.id === voucherId);
    
    if (voucher) {
        voucher.status = 'sold';
        voucher.buyerId = buyerId;
        voucher.orderId = orderId;
        voucher.soldAt = new Date().toISOString();
        
        // Update category sold count
        const cat = data.categories.find(c => c.id === voucher.categoryId);
        if (cat) {
            cat.sold = (cat.sold || 0) + 1;
            cat.stock = Math.max(0, cat.stock - 1);
        }
        
        saveData(data);
        return true;
    }
    return false;
}

// ==================== ORDER FUNCTIONS ====================

function createOrder(userId, categoryId, quantity, totalPrice) {
    const data = loadData();
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const orderId = `SVH-${year}${month}${day}-${random}`;
    const category = data.categories.find(c => c.id === categoryId);
    
    const recoveryExpiry = new Date();
    recoveryExpiry.setHours(recoveryExpiry.getHours() + 2);
    
    data.orders.push({
        id: orderId,
        userId: userId,
        categoryId: categoryId,
        categoryName: category ? category.name : '',
        quantity: parseInt(quantity),
        totalPrice: parseInt(totalPrice),
        status: 'pending',
        paymentMethod: 'manual',
        transactionId: null,
        screenshot: null,
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
        recoveryExpiry: recoveryExpiry.toISOString(),
        deliveredAt: null,
        pricePerCode: getPriceForQuantity(categoryId, quantity)
    });
    
    data.stats.totalOrders = data.orders.length;
    saveData(data);
    
    // Update user's orders
    const user = data.users.find(u => u.id === userId);
    if (user) {
        if (!user.orders) user.orders = [];
        user.orders.push(orderId);
    }
    
    return orderId;
}

function getOrder(orderId) {
    const data = loadData();
    return data.orders.find(o => o.id === orderId);
}

function getUserOrders(userId) {
    const data = loadData();
    return data.orders.filter(o => o.userId === userId);
}

function getAllOrders() {
    const data = loadData();
    return data.orders;
}

function updateOrderStatus(orderId, status, adminNote = null) {
    const data = loadData();
    const order = data.orders.find(o => o.id === orderId);
    
    if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        
        if (status === 'delivered') {
            order.deliveredAt = new Date().toISOString();
            data.stats.totalRevenue = (data.stats.totalRevenue || 0) + order.totalPrice;
            
            // Update user total spent
            const user = data.users.find(u => u.id === order.userId);
            if (user) {
                user.totalSpent = (user.totalSpent || 0) + order.totalPrice;
            }
        }
        
        if (adminNote) {
            order.adminNote = adminNote;
        }
        
        saveData(data);
        return true;
    }
    return false;
}

function updateOrderPayment(orderId, transactionId, screenshot) {
    const data = loadData();
    const order = data.orders.find(o => o.id === orderId);
    
    if (order) {
        order.transactionId = transactionId;
        order.screenshot = screenshot;
        order.status = 'pending_approval';
        order.updatedAt = new Date().toISOString();
        saveData(data);
        return true;
    }
    return false;
}

function canRecover(orderId, userId) {
    const data = loadData();
    const order = data.orders.find(o => o.id === orderId);
    
    if (!order) return { can: false, reason: 'not_found' };
    if (order.userId !== userId) return { can: false, reason: 'wrong_user' };
    if (order.status !== 'delivered') return { can: false, reason: 'not_delivered' };
    
    const now = new Date();
    const expiry = new Date(order.deliveredAt || order.createdAt);
    expiry.setHours(expiry.getHours() + 2);
    
    if (now > expiry) return { can: false, reason: 'expired' };
    
    return { can: true, order };
}

// ==================== SETTINGS FUNCTIONS ====================

function getSetting(key) {
    const data = loadData();
    return data.settings[key];
}

function updateSetting(key, value) {
    const data = loadData();
    data.settings[key] = value;
    saveData(data);
    return true;
}

function getPaymentQR() {
    const data = loadData();
    return data.settings.payment_qr;
}

function updatePaymentQR(url) {
    return updateSetting('payment_qr', url);
}

function getBotStatus() {
    const data = loadData();
    return data.settings.bot_status;
}

function toggleBotStatus() {
    const current = getBotStatus();
    return updateSetting('bot_status', current === 'active' ? 'inactive' : 'active');
}

// ==================== STATS FUNCTIONS ====================

function getDashboardStats() {
    const data = loadData();
    const users = data.users.length;
    const activeUsers = data.users.filter(u => u.status === 'active').length;
    const blockedUsers = data.blockedUsers.length;
    
    const orders = data.orders.length;
    const pendingOrders = data.orders.filter(o => o.status === 'pending_approval' || o.status === 'pending').length;
    const processingOrders = data.orders.filter(o => o.status === 'processing').length;
    const completedOrders = data.orders.filter(o => o.status === 'delivered').length;
    const rejectedOrders = data.orders.filter(o => o.status === 'rejected').length;
    
    const today = new Date().toDateString();
    const todayOrders = data.orders.filter(o => new Date(o.createdAt).toDateString() === today).length;
    const todayRevenue = data.orders
        .filter(o => o.status === 'delivered' && new Date(o.createdAt).toDateString() === today)
        .reduce((sum, o) => sum + o.totalPrice, 0);
    
    const categories = data.categories.length;
    const totalStock = data.categories.reduce((sum, c) => sum + (c.stock || 0), 0);
    const totalSold = data.categories.reduce((sum, c) => sum + (c.sold || 0), 0);
    
    const vouchers = data.vouchers.length;
    const availableVouchers = data.vouchers.filter(v => v.status === 'available').length;
    
    return {
        users, activeUsers, blockedUsers,
        orders, pendingOrders, processingOrders, completedOrders, rejectedOrders,
        todayOrders, todayRevenue,
        totalRevenue: data.stats.totalRevenue || 0,
        categories, totalStock, totalSold,
        vouchers, availableVouchers
    };
}

// ==================== EXPORT ====================

module.exports = {
    initDatabase,
    // User
    addUser,
    getUser,
    getAllUsers,
    blockUser,
    unblockUser,
    isUserBlocked,
    getBlockedUsers,
    addWarning,
    
    // Category
    getCategories,
    getCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    updateCategoryStock,
    updateCategoryPrice,
    getPriceForQuantity,
    calculateTotalPrice,
    
    // Voucher
    getVouchers,
    getAvailableVouchers,
    addVoucher,
    bulkAddVouchers,
    deleteVoucher,
    deleteVouchersByCategory,
    assignVoucher,
    
    // Order
    createOrder,
    getOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    updateOrderPayment,
    canRecover,
    
    // Settings
    getSetting,
    updateSetting,
    getPaymentQR,
    updatePaymentQR,
    getBotStatus,
    toggleBotStatus,
    
    // Stats
    getDashboardStats
};
