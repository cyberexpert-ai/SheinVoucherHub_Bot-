const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// ==================== ডাটা লোড ====================
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    
    // ডিফল্ট ডাটা
    return {
        users: [],
        categories: [],
        vouchers: [],
        orders: [],
        blockedUsers: [],
        settings: {
            bot_status: 'active',
            payment_method: 'manual',
            recovery_hours: '2',
            order_prefix: 'SVH'
        },
        stats: {
            totalUsers: 0,
            totalOrders: 0,
            totalRevenue: 0
        }
    };
}

// ==================== ডাটা সেভ ====================
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// গ্লোবাল ডাটা
let data = loadData();

// ==================== ইউজার ফাংশন ====================
function addUser(userId, username, firstName) {
    const existing = data.users.find(u => u.id === userId);
    if (!existing) {
        data.users.push({
            id: userId,
            username: username || 'N/A',
            firstName: firstName || 'N/A',
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            verified: true,
            role: 'user',
            orders: [],
            totalSpent: 0,
            status: 'active'
        });
        data.stats.totalUsers = data.users.length;
        saveData(data);
        return true;
    } else {
        // আপডেট লাস্ট অ্যাকটিভ
        existing.lastActive = new Date().toISOString();
        saveData(data);
        return true;
    }
}

function getUser(userId) {
    return data.users.find(u => u.id === userId);
}

function getAllUsers() {
    return data.users;
}

function blockUser(userId, reason) {
    const user = data.users.find(u => u.id === userId);
    if (user) {
        user.status = 'blocked';
        data.blockedUsers.push({
            id: userId,
            reason: reason,
            date: new Date().toISOString()
        });
        saveData(data);
        return true;
    }
    return false;
}

function unblockUser(userId) {
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
    return data.blockedUsers.some(b => b.id === userId);
}

function getBlockedUsers() {
    return data.blockedUsers;
}

function updateUserStats(userId, amount) {
    const user = data.users.find(u => u.id === userId);
    if (user) {
        user.totalSpent = (parseInt(user.totalSpent) || 0) + parseInt(amount);
        saveData(data);
    }
}

// ==================== ক্যাটাগরি ফাংশন ====================
function getCategories() {
    return data.categories;
}

function addCategory(name, price, stock = 100) {
    const id = data.categories.length + 1;
    const formattedName = `₹${name} Voucher`;
    
    data.categories.push({
        id: id.toString(),
        name: formattedName,
        price: parseInt(price),
        stock: parseInt(stock),
        sold: 0,
        status: 'active'
    });
    
    saveData(data);
    return id.toString();
}

function getCategory(categoryId) {
    return data.categories.find(c => c.id === categoryId);
}

function updateCategoryStock(categoryId, newStock) {
    const cat = data.categories.find(c => c.id === categoryId);
    if (cat) {
        cat.stock = parseInt(newStock);
        saveData(data);
        return true;
    }
    return false;
}

// ==================== ভাউচার ফাংশন ====================
function getVouchers() {
    return data.vouchers;
}

function getVouchersByCategory(categoryId) {
    return data.vouchers.filter(v => v.categoryId === categoryId);
}

function getAvailableVouchers(categoryId) {
    return data.vouchers.filter(v => 
        v.categoryId === categoryId && 
        v.status === 'available'
    );
}

function addVoucher(code, categoryId, price) {
    const voucherId = `VCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    data.vouchers.push({
        id: voucherId,
        code: code,
        categoryId: categoryId,
        price: parseInt(price),
        status: 'available',
        buyerId: null,
        orderId: null,
        createdAt: new Date().toISOString()
    });
    
    saveData(data);
    return voucherId;
}

function assignVoucher(voucherId, buyerId, orderId) {
    const voucher = data.vouchers.find(v => v.id === voucherId);
    if (voucher) {
        voucher.status = 'sold';
        voucher.buyerId = buyerId;
        voucher.orderId = orderId;
        voucher.soldAt = new Date().toISOString();
        
        // ক্যাটাগরি সোল্ড আপডেট
        const cat = data.categories.find(c => c.id === voucher.categoryId);
        if (cat) {
            cat.sold = (cat.sold || 0) + 1;
            cat.stock = cat.stock - 1;
        }
        
        saveData(data);
        return true;
    }
    return false;
}

function deleteVoucher(voucherId) {
    data.vouchers = data.vouchers.filter(v => v.id !== voucherId);
    saveData(data);
    return true;
}

// ==================== অর্ডার ফাংশন ====================
function createOrder(userId, categoryId, quantity, totalPrice, status = 'pending') {
    const orderId = `SVH-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const category = data.categories.find(c => c.id === categoryId);
    
    data.orders.push({
        id: orderId,
        userId: userId,
        categoryId: categoryId,
        categoryName: category ? category.name : '',
        quantity: parseInt(quantity),
        totalPrice: parseInt(totalPrice),
        status: status,
        paymentMethod: 'manual',
        transactionId: null,
        screenshot: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    data.stats.totalOrders = data.orders.length;
    saveData(data);
    
    // ইউজারের অর্ডার আপডেট
    const user = data.users.find(u => u.id === userId);
    if (user) {
        if (!user.orders) user.orders = [];
        user.orders.push(orderId);
    }
    
    return orderId;
}

function getOrder(orderId) {
    return data.orders.find(o => o.id === orderId);
}

function getAllOrders() {
    return data.orders;
}

function getUserOrders(userId) {
    return data.orders.filter(o => o.userId === userId);
}

function updateOrderStatus(orderId, status, deliveryDate = null) {
    const order = data.orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        if (deliveryDate) {
            order.deliveredAt = deliveryDate;
            
            // রেভিনিউ আপডেট
            if (status === 'delivered') {
                data.stats.totalRevenue = (data.stats.totalRevenue || 0) + order.totalPrice;
                updateUserStats(order.userId, order.totalPrice);
            }
        }
        saveData(data);
        return true;
    }
    return false;
}

function updateOrderPayment(orderId, transactionId, screenshot) {
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

// ==================== সেটিংস ফাংশন ====================
function getSetting(key) {
    return data.settings[key];
}

function updateSetting(key, value) {
    data.settings[key] = value;
    saveData(data);
    return true;
}

function getBotStatus() {
    return data.settings.bot_status || 'active';
}

// ==================== স্ট্যাটিস্টিক্স ====================
function getDashboardStats() {
    const users = data.users.length;
    const activeUsers = data.users.filter(u => u.status === 'active').length;
    const blockedUsers = data.blockedUsers.length;
    
    const orders = data.orders.length;
    const pendingOrders = data.orders.filter(o => o.status === 'pending_approval' || o.status === 'pending').length;
    const completedOrders = data.orders.filter(o => o.status === 'delivered').length;
    
    const today = new Date().toDateString();
    const todayOrders = data.orders.filter(o => new Date(o.createdAt).toDateString() === today).length;
    const todayRevenue = data.orders
        .filter(o => o.status === 'delivered' && new Date(o.createdAt).toDateString() === today)
        .reduce((sum, o) => sum + o.totalPrice, 0);
    
    const categories = data.categories.length;
    const vouchers = data.vouchers.length;
    const availableVouchers = data.vouchers.filter(v => v.status === 'available').length;
    
    return {
        users,
        activeUsers,
        blockedUsers,
        orders,
        pendingOrders,
        completedOrders,
        todayOrders,
        todayRevenue,
        totalRevenue: data.stats.totalRevenue || 0,
        categories,
        vouchers,
        availableVouchers
    };
}

// ==================== এক্সপোর্ট ====================
module.exports = {
    // ইউজার
    addUser,
    getUser,
    getAllUsers,
    blockUser,
    unblockUser,
    isUserBlocked,
    getBlockedUsers,
    
    // ক্যাটাগরি
    getCategories,
    addCategory,
    getCategory,
    updateCategoryStock,
    
    // ভাউচার
    getVouchers,
    getVouchersByCategory,
    getAvailableVouchers,
    addVoucher,
    assignVoucher,
    deleteVoucher,
    
    // অর্ডার
    createOrder,
    getOrder,
    getAllOrders,
    getUserOrders,
    updateOrderStatus,
    updateOrderPayment,
    
    // সেটিংস
    getSetting,
    updateSetting,
    getBotStatus,
    
    // স্ট্যাটিস্টিক্স
    getDashboardStats
};
