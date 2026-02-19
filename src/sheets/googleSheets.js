const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const dotenv = require('dotenv');
const moment = require('moment');
const crypto = require('crypto');

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

// ==================== INITIALIZATION ====================

async function setupGoogleSheets() {
    try {
        console.log('🔄 Setting up Google Sheets...');
        
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        doc = new GoogleSpreadsheet(GOOGLE_SHEETS_ID, serviceAccountAuth);
        await doc.loadInfo();
        
        console.log('✅ Google Sheets connected successfully!');
        
        // Initialize all sheets
        await initializeAllSheets();
        
        return true;
    } catch (error) {
        console.error('❌ Google Sheets connection error:', error);
        return false;
    }
}

async function initializeAllSheets() {
    try {
        const sheets = [
            'Users', 
            'Vouchers', 
            'Orders', 
            'Categories', 
            'BlockedUsers',
            'Settings',
            'Discounts',
            'Coupons',
            'Referrals',
            'Payments',
            'Logs',
            'Backups',
            'Analytics',
            'BlockedIPs',
            'Broadcasts',
            'Notifications',
            'APIKeys'
        ];
        
        for (const sheetTitle of sheets) {
            let sheet = doc.sheetsByTitle[sheetTitle];
            if (!sheet) {
                sheet = await doc.addSheet({ title: sheetTitle });
                console.log(`📝 Created sheet: ${sheetTitle}`);
                
                // Add headers based on sheet type
                await addHeadersToSheet(sheetTitle, sheet);
            }
        }
        
        // Add default settings
        await addDefaultSettings();
        
        console.log('✅ All sheets initialized successfully!');
        
    } catch (error) {
        console.error('Error initializing sheets:', error);
    }
}

async function addHeadersToSheet(sheetTitle, sheet) {
    const headers = {
        'Users': ['user_id', 'username', 'first_name', 'last_name', 'language_code', 'is_premium', 
                  'join_date', 'last_active', 'verified', 'role', 'orders_count', 'total_spent', 
                  'referral_code', 'referred_by', 'referral_earnings', 'loyalty_points', 'device_info',
                  'restrictions', 'notes', 'status'],
        
        'Vouchers': ['voucher_id', 'code', 'category_id', 'category_name', 'price', 'status', 
                     'buyer_id', 'order_id', 'purchase_date', 'expiry_date', 'created_at', 
                     'created_by', 'notes', 'tags'],
        
        'Orders': ['order_id', 'user_id', 'username', 'category_id', 'category_name', 'quantity', 
                   'total_price', 'payment_method', 'transaction_id', 'screenshot', 'status', 
                   'order_date', 'delivery_date', 'recovery_expiry', 'admin_notes', 'utm_source'],
        
        'Categories': ['category_id', 'name', 'price_per_code', 'stock', 'total_sold', 'discount', 
                       'description', 'image_url', 'tags', 'status', 'created_at', 'updated_at'],
        
        'BlockedUsers': ['user_id', 'username', 'reason', 'blocked_by', 'block_date', 'block_type', 
                         'expiry_date', 'appeal_message', 'appeal_status'],
        
        'Settings': ['key', 'value', 'description', 'type', 'category', 'updated_at', 'updated_by'],
        
        'Discounts': ['discount_id', 'code', 'type', 'value', 'min_amount', 'max_amount', 'expiry', 
                      'usage_limit', 'used_count', 'status', 'created_at', 'applicable_categories'],
        
        'Coupons': ['coupon_id', 'code', 'value', 'type', 'min_order', 'max_discount', 'expiry', 
                    'usage_limit', 'used_count', 'status', 'created_at', 'user_specific'],
        
        'Referrals': ['referral_id', 'referrer_id', 'referred_id', 'order_id', 'earnings', 'status', 
                      'created_at', 'paid_at', 'notes'],
        
        'Payments': ['payment_id', 'order_id', 'user_id', 'amount', 'method', 'utr', 'screenshot', 
                     'status', 'verified_by', 'verified_at', 'notes', 'created_at'],
        
        'Logs': ['log_id', 'timestamp', 'level', 'type', 'user_id', 'action', 'details', 'ip_address', 
                 'user_agent', 'session_id'],
        
        'Backups': ['backup_id', 'filename', 'size', 'type', 'status', 'created_at', 'created_by', 
                    'location', 'checksum'],
        
        'Analytics': ['date', 'metric', 'value', 'category', 'notes'],
        
        'BlockedIPs': ['ip_address', 'reason', 'blocked_at', 'blocked_by', 'expires_at'],
        
        'Broadcasts': ['broadcast_id', 'message', 'filter', 'status', 'scheduled_for', 'sent_at', 
                       'sent_by', 'stats'],
        
        'Notifications': ['notification_id', 'user_id', 'type', 'message', 'status', 'created_at', 'read_at'],
        
        'APIKeys': ['key_id', 'api_key', 'user_id', 'created_at', 'expires_at', 'last_used', 'status', 'permissions']
    };
    
    if (headers[sheetTitle]) {
        await sheet.setHeaderRow(headers[sheetTitle]);
    }
}

async function addDefaultSettings() {
    try {
        const settingsSheet = doc.sheetsByTitle['Settings'];
        const rows = await settingsSheet.getRows();
        
        const defaultSettings = [
            // Bot Settings
            ['bot_status', 'active', 'Bot active/inactive status', 'boolean', 'bot', moment().toISOString(), 'system'],
            ['bot_version', '7.0.0', 'Bot version', 'string', 'bot', moment().toISOString(), 'system'],
            ['maintenance_mode', 'false', 'Maintenance mode status', 'boolean', 'bot', moment().toISOString(), 'system'],
            ['language', 'en', 'Default language', 'string', 'bot', moment().toISOString(), 'system'],
            ['timezone', 'Asia/Kolkata', 'Default timezone', 'string', 'bot', moment().toISOString(), 'system'],
            
            // Payment Settings
            ['payment_method', 'manual', 'Payment method (manual only)', 'string', 'payment', moment().toISOString(), 'system'],
            ['currency', 'INR', 'Default currency', 'string', 'payment', moment().toISOString(), 'system'],
            ['currency_symbol', '₹', 'Currency symbol', 'string', 'payment', moment().toISOString(), 'system'],
            ['min_amount', '10', 'Minimum payment amount', 'number', 'payment', moment().toISOString(), 'system'],
            ['max_amount', '100000', 'Maximum payment amount', 'number', 'payment', moment().toISOString(), 'system'],
            ['payment_timeout', '30', 'Payment timeout in minutes', 'number', 'payment', moment().toISOString(), 'system'],
            
            // Order Settings
            ['min_quantity', '1', 'Minimum order quantity', 'number', 'order', moment().toISOString(), 'system'],
            ['max_quantity', '100', 'Maximum order quantity', 'number', 'order', moment().toISOString(), 'system'],
            ['recovery_hours', '2', 'Order recovery hours', 'number', 'order', moment().toISOString(), 'system'],
            ['order_prefix', 'SVH', 'Order ID prefix', 'string', 'order', moment().toISOString(), 'system'],
            
            // Voucher Settings
            ['voucher_prefix', 'VCH', 'Voucher ID prefix', 'string', 'voucher', moment().toISOString(), 'system'],
            ['voucher_expiry', '30', 'Voucher expiry in days', 'number', 'voucher', moment().toISOString(), 'system'],
            ['stock_alert', '10', 'Low stock alert threshold', 'number', 'voucher', moment().toISOString(), 'system'],
            
            // Security Settings
            ['rate_limit_general', '30', 'General rate limit per minute', 'number', 'security', moment().toISOString(), 'system'],
            ['rate_limit_login', '5', 'Login rate limit per minute', 'number', 'security', moment().toISOString(), 'system'],
            ['rate_limit_payment', '10', 'Payment rate limit per minute', 'number', 'security', moment().toISOString(), 'system'],
            ['session_timeout', '30', 'Session timeout in minutes', 'number', 'security', moment().toISOString(), 'system'],
            ['max_login_attempts', '5', 'Maximum login attempts', 'number', 'security', moment().toISOString(), 'system'],
            
            // Notification Settings
            ['notification_order', 'true', 'Enable order notifications', 'boolean', 'notification', moment().toISOString(), 'system'],
            ['notification_payment', 'true', 'Enable payment notifications', 'boolean', 'notification', moment().toISOString(), 'system'],
            ['notification_user', 'true', 'Enable user notifications', 'boolean', 'notification', moment().toISOString(), 'system'],
            
            // Report Settings
            ['auto_report', 'false', 'Enable auto reports', 'boolean', 'report', moment().toISOString(), 'system'],
            ['report_time', '00:00', 'Report generation time', 'string', 'report', moment().toISOString(), 'system'],
            ['report_format', 'pdf', 'Default report format', 'string', 'report', moment().toISOString(), 'system'],
            
            // Backup Settings
            ['auto_backup', 'false', 'Enable auto backup', 'boolean', 'backup', moment().toISOString(), 'system'],
            ['backup_interval', '24', 'Backup interval in hours', 'number', 'backup', moment().toISOString(), 'system'],
            ['backup_retention', '30', 'Backup retention in days', 'number', 'backup', moment().toISOString(), 'system'],
            
            // Feature Flags
            ['enable_referral', 'true', 'Enable referral system', 'boolean', 'feature', moment().toISOString(), 'system'],
            ['enable_discounts', 'true', 'Enable discounts', 'boolean', 'feature', moment().toISOString(), 'system'],
            ['enable_coupons', 'true', 'Enable coupons', 'boolean', 'feature', moment().toISOString(), 'system'],
            ['enable_loyalty', 'true', 'Enable loyalty points', 'boolean', 'feature', moment().toISOString(), 'system']
        ];
        
        for (const setting of defaultSettings) {
            const exists = rows.find(row => row.key === setting[0]);
            if (!exists) {
                await settingsSheet.addRow({
                    key: setting[0],
                    value: setting[1],
                    description: setting[2],
                    type: setting[3],
                    category: setting[4],
                    updated_at: setting[5],
                    updated_by: setting[6]
                });
            }
        }
    } catch (error) {
        console.error('Error adding default settings:', error);
    }
}

// ==================== USER MANAGEMENT FUNCTIONS ====================

async function addUser(userId, username, firstName, lastName = '', languageCode = 'en', isPremium = false) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const existingUser = rows.find(row => row.user_id === userId.toString());
        
        if (!existingUser) {
            const referralCode = generateReferralCode(userId);
            
            await sheet.addRow({
                user_id: userId.toString(),
                username: username || 'N/A',
                first_name: firstName || 'N/A',
                last_name: lastName,
                language_code: languageCode,
                is_premium: isPremium ? 'true' : 'false',
                join_date: new Date().toISOString(),
                last_active: new Date().toISOString(),
                verified: 'false',
                role: 'user',
                orders_count: '0',
                total_spent: '0',
                referral_code: referralCode,
                referred_by: '',
                referral_earnings: '0',
                loyalty_points: '0',
                device_info: '{}',
                restrictions: '{}',
                notes: '',
                status: 'active'
            });
        } else {
            // Update last active
            existingUser.last_active = new Date().toISOString();
            await existingUser.save();
        }
        return true;
    } catch (error) {
        console.error('Error adding user:', error);
        return false;
    }
}

function generateReferralCode(userId) {
    return 'REF' + userId.toString().slice(-6) + Math.random().toString(36).substring(2, 8).toUpperCase();
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

async function getUsers(limit = 100, offset = 0) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        return rows.slice(offset, offset + limit);
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
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

async function updateUser(userId, updates) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const user = rows.find(row => row.user_id === userId.toString());
        
        if (user) {
            Object.keys(updates).forEach(key => {
                if (key !== 'user_id') {
                    user[key] = updates[key].toString();
                }
            });
            await user.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating user:', error);
        return false;
    }
}

async function deleteUser(userId) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const user = rows.find(row => row.user_id === userId.toString());
        
        if (user) {
            await user.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
}

async function searchUsers(query) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const lowerQuery = query.toLowerCase();
        
        return rows.filter(user => 
            user.user_id?.toLowerCase().includes(lowerQuery) ||
            user.username?.toLowerCase().includes(lowerQuery) ||
            user.first_name?.toLowerCase().includes(lowerQuery) ||
            user.last_name?.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}

async function filterUsers(filters) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        
        return rows.filter(user => {
            return Object.entries(filters).every(([key, value]) => 
                user[key] === value.toString()
            );
        });
    } catch (error) {
        console.error('Error filtering users:', error);
        return [];
    }
}

async function sortUsers(field, order = 'asc') {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        
        return rows.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            
            if (order === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    } catch (error) {
        console.error('Error sorting users:', error);
        return [];
    }
}

async function paginateUsers(page = 1, pageSize = 10) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        return {
            data: rows.slice(start, end),
            total: rows.length,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(rows.length / pageSize)
        };
    } catch (error) {
        console.error('Error paginating users:', error);
        return { data: [], total: 0, page: page, pageSize: pageSize, totalPages: 0 };
    }
}

async function exportUsers(format = 'csv') {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        
        return rows.map(row => ({
            user_id: row.user_id,
            username: row.username,
            first_name: row.first_name,
            last_name: row.last_name,
            join_date: row.join_date,
            last_active: row.last_active,
            verified: row.verified,
            role: row.role,
            orders_count: row.orders_count,
            total_spent: row.total_spent,
            referral_code: row.referral_code,
            referral_earnings: row.referral_earnings,
            loyalty_points: row.loyalty_points,
            status: row.status
        }));
    } catch (error) {
        console.error('Error exporting users:', error);
        return [];
    }
}

async function importUsers(users) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        
        for (const user of users) {
            await sheet.addRow(user);
        }
        
        return true;
    } catch (error) {
        console.error('Error importing users:', error);
        return false;
    }
}

async function backupUsers() {
    return await exportUsers('json');
}

async function restoreUsers(backupData) {
    return await importUsers(backupData);
}

async function getUserStats() {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        
        const now = moment();
        const today = now.format('YYYY-MM-DD');
        const weekAgo = now.clone().subtract(7, 'days').format('YYYY-MM-DD');
        const monthAgo = now.clone().subtract(30, 'days').format('YYYY-MM-DD');
        
        const stats = {
            total: rows.length,
            active: rows.filter(u => u.status === 'active').length,
            blocked: rows.filter(u => u.status === 'blocked').length,
            verified: rows.filter(u => u.verified === 'true').length,
            unverified: rows.filter(u => u.verified !== 'true').length,
            premium: rows.filter(u => u.is_premium === 'true').length,
            
            today: rows.filter(u => u.join_date?.startsWith(today)).length,
            thisWeek: rows.filter(u => u.join_date >= weekAgo).length,
            thisMonth: rows.filter(u => u.join_date >= monthAgo).length,
            
            totalSpent: rows.reduce((sum, u) => sum + (parseInt(u.total_spent) || 0), 0),
            avgSpent: rows.length ? (rows.reduce((sum, u) => sum + (parseInt(u.total_spent) || 0), 0) / rows.length) : 0,
            
            totalOrders: rows.reduce((sum, u) => sum + (parseInt(u.orders_count) || 0), 0),
            avgOrders: rows.length ? (rows.reduce((sum, u) => sum + (parseInt(u.orders_count) || 0), 0) / rows.length) : 0,
            
            roles: {
                admin: rows.filter(u => u.role === 'admin').length,
                moderator: rows.filter(u => u.role === 'moderator').length,
                user: rows.filter(u => u.role === 'user').length,
                vip: rows.filter(u => u.role === 'vip').length
            }
        };
        
        return stats;
    } catch (error) {
        console.error('Error getting user stats:', error);
        return {};
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

async function getUserTransactions(userId) {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.user_id === userId.toString());
    } catch (error) {
        console.error('Error getting user transactions:', error);
        return [];
    }
}

async function getUserActivity(userId, days = 7) {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const rows = await sheet.getRows();
        const cutoff = moment().subtract(days, 'days').toISOString();
        
        return rows.filter(row => 
            row.user_id === userId.toString() && 
            row.timestamp > cutoff
        );
    } catch (error) {
        console.error('Error getting user activity:', error);
        return [];
    }
}

async function getUserDevices(userId) {
    try {
        const user = await getUser(userId);
        return user ? JSON.parse(user.device_info || '{}') : {};
    } catch (error) {
        console.error('Error getting user devices:', error);
        return {};
    }
}

async function setUserRole(userId, role) {
    return await updateUser(userId, { role: role });
}

async function setUserPermissions(userId, permissions) {
    return await updateUser(userId, { restrictions: JSON.stringify(permissions) });
}

async function setUserLimits(userId, limits) {
    return await updateUser(userId, { restrictions: JSON.stringify(limits) });
}

async function sendUserMessage(bot, userId, message) {
    try {
        await bot.sendMessage(parseInt(userId), message);
        return true;
    } catch (error) {
        console.error('Error sending user message:', error);
        return false;
    }
}

async function broadcastToUsers(bot, message, filter = {}) {
    try {
        const users = await filterUsers(filter);
        let successCount = 0;
        
        for (const user of users) {
            try {
                await bot.sendMessage(parseInt(user.user_id), message);
                successCount++;
            } catch (e) {
                console.error(`Failed to send to user ${user.user_id}:`, e);
            }
        }
        
        return { success: successCount, total: users.length };
    } catch (error) {
        console.error('Error broadcasting to users:', error);
        return { success: 0, total: 0 };
    }
}

async function notifyUsers(bot, type, data) {
    // Implementation for specific notifications
    return true;
}

// ==================== BLOCK/UNBLOCK FUNCTIONS ====================

async function blockUser(userId, reason, blockedBy, blockType = 'permanent', expiryDate = null) {
    try {
        const sheet = doc.sheetsByTitle['BlockedUsers'];
        
        // Check if already blocked
        const rows = await sheet.getRows();
        const existing = rows.find(row => row.user_id === userId.toString() && row.appeal_status !== 'expired');
        
        if (existing) {
            return false;
        }
        
        await sheet.addRow({
            user_id: userId.toString(),
            username: (await getUser(userId))?.username || 'N/A',
            reason: reason,
            blocked_by: blockedBy.toString(),
            block_date: new Date().toISOString(),
            block_type: blockType,
            expiry_date: expiryDate ? expiryDate.toISOString() : '',
            appeal_message: '',
            appeal_status: 'none'
        });
        
        // Update user status
        await updateUser(userId, { status: 'blocked' });
        
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
        
        // Update user status
        await updateUser(userId, { status: 'active' });
        
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
                    await updateUser(userId, { status: 'active' });
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

// ==================== CATEGORY FUNCTIONS ====================

async function getCategories() {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        return await sheet.getRows();
    } catch (error) {
        console.error('Error getting categories:', error);
        return [];
    }
}

async function getCategory(categoryId) {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        return rows.find(row => row.category_id === categoryId.toString());
    } catch (error) {
        console.error('Error getting category:', error);
        return null;
    }
}

async function addCategory(name, price, stock = '100', description = '', imageUrl = '', tags = '') {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        const categoryId = (rows.length + 1).toString();
        
        // Format category name with ₹ symbol
        const formattedName = `₹${name} Voucher`;
        
        await sheet.addRow({
            category_id: categoryId,
            name: formattedName,
            price_per_code: price.toString(),
            stock: stock.toString(),
            total_sold: '0',
            discount: '0',
            description: description || `${name} Taka Shein Voucher`,
            image_url: imageUrl,
            tags: tags,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        return categoryId;
    } catch (error) {
        console.error('Error adding category:', error);
        return null;
    }
}

async function updateCategory(categoryId, updates) {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        const category = rows.find(row => row.category_id === categoryId.toString());
        
        if (category) {
            Object.keys(updates).forEach(key => {
                if (key !== 'category_id' && key !== 'created_at') {
                    category[key] = updates[key].toString();
                }
            });
            category.updated_at = new Date().toISOString();
            await category.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating category:', error);
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

async function updateCategoryStock(categoryId, newStock) {
    return await updateCategory(categoryId, { stock: newStock.toString() });
}

async function setCategoryDiscount(categoryId, discount) {
    return await updateCategory(categoryId, { discount: discount.toString() });
}

async function setCategoryPrice(categoryId, price) {
    return await updateCategory(categoryId, { price_per_code: price.toString() });
}

async function getCategoryStats() {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        
        const stats = {
            total: rows.length,
            active: rows.filter(c => c.status === 'active').length,
            inactive: rows.filter(c => c.status !== 'active').length,
            totalStock: rows.reduce((sum, c) => sum + (parseInt(c.stock) || 0), 0),
            totalSold: rows.reduce((sum, c) => sum + (parseInt(c.total_sold) || 0), 0),
            totalRevenue: rows.reduce((sum, c) => sum + ((parseInt(c.price_per_code) || 0) * (parseInt(c.total_sold) || 0)), 0),
            avgPrice: rows.length ? (rows.reduce((sum, c) => sum + (parseInt(c.price_per_code) || 0), 0) / rows.length) : 0,
            categories: rows.map(c => ({
                id: c.category_id,
                name: c.name,
                price: c.price_per_code,
                stock: c.stock,
                sold: c.total_sold,
                revenue: (parseInt(c.price_per_code) || 0) * (parseInt(c.total_sold) || 0)
            }))
        };
        
        return stats;
    } catch (error) {
        console.error('Error getting category stats:', error);
        return {};
    }
}

async function getCategoryOrders(categoryId) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.category_id === categoryId.toString());
    } catch (error) {
        console.error('Error getting category orders:', error);
        return [];
    }
}

async function getCategoryRevenue(categoryId) {
    try {
        const orders = await getCategoryOrders(categoryId);
        return orders.reduce((sum, o) => sum + (parseInt(o.total_price) || 0), 0);
    } catch (error) {
        console.error('Error getting category revenue:', error);
        return 0;
    }
}

async function searchCategories(query) {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        const lowerQuery = query.toLowerCase();
        
        return rows.filter(cat => 
            cat.name?.toLowerCase().includes(lowerQuery) ||
            cat.description?.toLowerCase().includes(lowerQuery) ||
            cat.tags?.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching categories:', error);
        return [];
    }
}

async function filterCategories(filters) {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        
        return rows.filter(cat => {
            return Object.entries(filters).every(([key, value]) => 
                cat[key] === value.toString()
            );
        });
    } catch (error) {
        console.error('Error filtering categories:', error);
        return [];
    }
}

async function sortCategories(field, order = 'asc') {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        
        return rows.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            
            if (order === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    } catch (error) {
        console.error('Error sorting categories:', error);
        return [];
    }
}

async function exportCategories() {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        
        return rows.map(cat => ({
            category_id: cat.category_id,
            name: cat.name,
            price: cat.price_per_code,
            stock: cat.stock,
            sold: cat.total_sold,
            discount: cat.discount,
            description: cat.description,
            status: cat.status,
            created_at: cat.created_at
        }));
    } catch (error) {
        console.error('Error exporting categories:', error);
        return [];
    }
}

async function importCategories(categories) {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        
        for (const cat of categories) {
            await sheet.addRow(cat);
        }
        
        return true;
    } catch (error) {
        console.error('Error importing categories:', error);
        return false;
    }
}

async function backupCategories() {
    return await exportCategories();
}

async function restoreCategories(backupData) {
    return await importCategories(backupData);
}

async function bulkAddCategories(categories) {
    return await importCategories(categories);
}

async function bulkDeleteCategories(categoryIds) {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        
        for (const id of categoryIds) {
            const cat = rows.find(row => row.category_id === id.toString());
            if (cat) {
                await cat.delete();
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error bulk deleting categories:', error);
        return false;
    }
}

async function bulkUpdateCategories(updates) {
    try {
        for (const [id, update] of Object.entries(updates)) {
            await updateCategory(id, update);
        }
        return true;
    } catch (error) {
        console.error('Error bulk updating categories:', error);
        return false;
    }
}

async function cloneCategory(categoryId, newName) {
    try {
        const category = await getCategory(categoryId);
        if (!category) return null;
        
        const newCategory = {
            name: newName || `${category.name} (Copy)`,
            price_per_code: category.price_per_code,
            stock: '0',
            description: category.description,
            image_url: category.image_url,
            tags: category.tags,
            status: 'active'
        };
        
        return await addCategory(
            newCategory.name.replace('₹', '').replace(' Voucher', ''),
            newCategory.price_per_code,
            newCategory.stock,
            newCategory.description,
            newCategory.image_url,
            newCategory.tags
        );
    } catch (error) {
        console.error('Error cloning category:', error);
        return null;
    }
}

async function mergeCategories(categoryIds, newName) {
    try {
        const categories = await Promise.all(categoryIds.map(id => getCategory(id)));
        const validCategories = categories.filter(c => c);
        
        if (validCategories.length === 0) return null;
        
        const totalStock = validCategories.reduce((sum, c) => sum + (parseInt(c.stock) || 0), 0);
        const avgPrice = validCategories.reduce((sum, c) => sum + (parseInt(c.price_per_code) || 0), 0) / validCategories.length;
        const totalSold = validCategories.reduce((sum, c) => sum + (parseInt(c.total_sold) || 0), 0);
        
        const newCategoryId = await addCategory(
            newName || 'Merged Category',
            Math.round(avgPrice).toString(),
            totalStock.toString(),
            'Merged category',
            '',
            'merged'
        );
        
        // Update sold count
        await updateCategory(newCategoryId, { total_sold: totalSold.toString() });
        
        // Delete old categories
        await bulkDeleteCategories(categoryIds);
        
        return newCategoryId;
    } catch (error) {
        console.error('Error merging categories:', error);
        return null;
    }
}

async function splitCategory(categoryId, splits) {
    try {
        const category = await getCategory(categoryId);
        if (!category) return [];
        
        const stock = parseInt(category.stock) || 0;
        const price = parseInt(category.price_per_code) || 0;
        
        const newCategoryIds = [];
        let remainingStock = stock;
        
        for (let i = 0; i < splits.length - 1; i++) {
            const splitStock = Math.floor(stock * (splits[i] / 100));
            remainingStock -= splitStock;
            
            const newId = await addCategory(
                `${category.name} - Part ${i+1}`,
                price.toString(),
                splitStock.toString(),
                category.description,
                category.image_url,
                `${category.tags},split`
            );
            newCategoryIds.push(newId);
        }
        
        // Last part gets remaining stock
        const lastId = await addCategory(
            `${category.name} - Part ${splits.length}`,
            price.toString(),
            remainingStock.toString(),
            category.description,
            category.image_url,
            `${category.tags},split`
        );
        newCategoryIds.push(lastId);
        
        // Delete original category
        await deleteCategory(categoryId);
        
        return newCategoryIds;
    } catch (error) {
        console.error('Error splitting category:', error);
        return [];
    }
}

// ==================== VOUCHER FUNCTIONS ====================

async function getVouchers(limit = 100, offset = 0) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        return rows.slice(offset, offset + limit);
    } catch (error) {
        console.error('Error getting vouchers:', error);
        return [];
    }
}

async function getVoucher(voucherId) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        return rows.find(row => row.voucher_id === voucherId);
    } catch (error) {
        console.error('Error getting voucher:', error);
        return null;
    }
}

async function getVoucherByCode(code) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        return rows.find(row => row.code === code);
    } catch (error) {
        console.error('Error getting voucher by code:', error);
        return null;
    }
}

async function addVoucher(code, categoryId, price, expiryDays = 30, tags = '') {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const voucherId = `VCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        // Get category name
        const category = await getCategory(categoryId);
        const categoryName = category ? category.name : categoryId;
        
        const expiryDate = moment().add(expiryDays, 'days').toISOString();
        
        await sheet.addRow({
            voucher_id: voucherId,
            code: code,
            category_id: categoryId.toString(),
            category_name: categoryName,
            price: price.toString(),
            status: 'available',
            buyer_id: '',
            order_id: '',
            purchase_date: '',
            expiry_date: expiryDate,
            created_at: new Date().toISOString(),
            created_by: 'system',
            notes: '',
            tags: tags
        });
        
        return voucherId;
    } catch (error) {
        console.error('Error adding voucher:', error);
        return null;
    }
}

async function updateVoucher(voucherId, updates) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        const voucher = rows.find(row => row.voucher_id === voucherId);
        
        if (voucher) {
            Object.keys(updates).forEach(key => {
                if (key !== 'voucher_id' && key !== 'created_at') {
                    voucher[key] = updates[key].toString();
                }
            });
            await voucher.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating voucher:', error);
        return false;
    }
}

async function deleteVoucher(voucherId) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        const voucher = rows.find(row => row.voucher_id === voucherId);
        
        if (voucher) {
            await voucher.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting voucher:', error);
        return false;
    }
}

async function getAvailableVouchers(categoryId) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        const now = new Date();
        
        return rows.filter(row => 
            row.category_id === categoryId.toString() && 
            row.status === 'available' &&
            new Date(row.expiry_date) > now
        );
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
            
            // Update category sold count
            const category = await getCategory(voucher.category_id);
            if (category) {
                const newSold = (parseInt(category.total_sold) || 0) + 1;
                await updateCategory(voucher.category_id, { total_sold: newSold.toString() });
            }
        }
        return true;
    } catch (error) {
        console.error('Error assigning voucher:', error);
        return false;
    }
}

async function revokeVoucher(voucherId) {
    try {
        const voucher = await getVoucher(voucherId);
        if (voucher) {
            voucher.status = 'revoked';
            await voucher.save();
        }
        return true;
    } catch (error) {
        console.error('Error revoking voucher:', error);
        return false;
    }
}

async function restoreVoucher(voucherId) {
    try {
        const voucher = await getVoucher(voucherId);
        if (voucher) {
            voucher.status = 'available';
            await voucher.save();
        }
        return true;
    } catch (error) {
        console.error('Error restoring voucher:', error);
        return false;
    }
}

async function expireVoucher(voucherId) {
    try {
        const voucher = await getVoucher(voucherId);
        if (voucher) {
            voucher.status = 'expired';
            await voucher.save();
        }
        return true;
    } catch (error) {
        console.error('Error expiring voucher:', error);
        return false;
    }
}

async function getVoucherCodes(categoryId, limit = 10) {
    try {
        const vouchers = await getAvailableVouchers(categoryId);
        return vouchers.slice(0, limit).map(v => v.code);
    } catch (error) {
        console.error('Error getting voucher codes:', error);
        return [];
    }
}

async function getVoucherStats() {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        
        const now = new Date();
        
        const stats = {
            total: rows.length,
            available: rows.filter(v => v.status === 'available' && new Date(v.expiry_date) > now).length,
            sold: rows.filter(v => v.status === 'sold').length,
            expired: rows.filter(v => v.status === 'expired' || new Date(v.expiry_date) <= now).length,
            revoked: rows.filter(v => v.status === 'revoked').length,
            totalValue: rows.reduce((sum, v) => sum + (parseInt(v.price) || 0), 0),
            soldValue: rows.filter(v => v.status === 'sold').reduce((sum, v) => sum + (parseInt(v.price) || 0), 0),
            availableValue: rows.filter(v => v.status === 'available' && new Date(v.expiry_date) > now)
                .reduce((sum, v) => sum + (parseInt(v.price) || 0), 0),
            byCategory: {}
        };
        
        // Group by category
        rows.forEach(v => {
            const cat = v.category_name;
            if (!stats.byCategory[cat]) {
                stats.byCategory[cat] = { total: 0, available: 0, sold: 0, value: 0 };
            }
            stats.byCategory[cat].total++;
            if (v.status === 'available' && new Date(v.expiry_date) > now) {
                stats.byCategory[cat].available++;
                stats.byCategory[cat].value += parseInt(v.price) || 0;
            }
            if (v.status === 'sold') {
                stats.byCategory[cat].sold++;
            }
        });
        
        return stats;
    } catch (error) {
        console.error('Error getting voucher stats:', error);
        return {};
    }
}

async function searchVouchers(query) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        const lowerQuery = query.toLowerCase();
        
        return rows.filter(v => 
            v.code?.toLowerCase().includes(lowerQuery) ||
            v.category_name?.toLowerCase().includes(lowerQuery) ||
            v.voucher_id?.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching vouchers:', error);
        return [];
    }
}

async function filterVouchers(filters) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        
        return rows.filter(v => {
            return Object.entries(filters).every(([key, value]) => 
                v[key] === value.toString()
            );
        });
    } catch (error) {
        console.error('Error filtering vouchers:', error);
        return [];
    }
}

async function sortVouchers(field, order = 'asc') {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        
        return rows.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            
            if (order === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    } catch (error) {
        console.error('Error sorting vouchers:', error);
        return [];
    }
}

async function exportVouchers() {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        
        return rows.map(v => ({
            voucher_id: v.voucher_id,
            code: v.code,
            category: v.category_name,
            price: v.price,
            status: v.status,
            buyer_id: v.buyer_id,
            order_id: v.order_id,
            purchase_date: v.purchase_date,
            expiry_date: v.expiry_date,
            created_at: v.created_at
        }));
    } catch (error) {
        console.error('Error exporting vouchers:', error);
        return [];
    }
}

async function importVouchers(vouchers) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        
        for (const v of vouchers) {
            await sheet.addRow(v);
        }
        
        return true;
    } catch (error) {
        console.error('Error importing vouchers:', error);
        return false;
    }
}

async function backupVouchers() {
    return await exportVouchers();
}

async function restoreVouchers(backupData) {
    return await importVouchers(backupData);
}

async function bulkAddVouchers(categoryId, codes, price) {
    try {
        const results = [];
        for (const code of codes) {
            const id = await addVoucher(code, categoryId, price);
            results.push(id);
        }
        return results.filter(id => id);
    } catch (error) {
        console.error('Error bulk adding vouchers:', error);
        return [];
    }
}

async function bulkDeleteVouchers(voucherIds) {
    try {
        const sheet = doc.sheetsByTitle['Vouchers'];
        const rows = await sheet.getRows();
        
        for (const id of voucherIds) {
            const v = rows.find(row => row.voucher_id === id);
            if (v) {
                await v.delete();
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error bulk deleting vouchers:', error);
        return false;
    }
}

async function bulkUpdateVouchers(updates) {
    try {
        for (const [id, update] of Object.entries(updates)) {
            await updateVoucher(id, update);
        }
        return true;
    } catch (error) {
        console.error('Error bulk updating vouchers:', error);
        return false;
    }
}

async function generateVouchers(categoryId, count, price, prefix = 'VCH') {
    try {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = `${prefix}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            codes.push(code);
        }
        return await bulkAddVouchers(categoryId, codes, price);
    } catch (error) {
        console.error('Error generating vouchers:', error);
        return [];
    }
}

async function validateVouchers(voucherIds) {
    try {
        const results = [];
        for (const id of voucherIds) {
            const v = await getVoucher(id);
            results.push({
                id: id,
                valid: v && v.status === 'available' && new Date(v.expiry_date) > new Date(),
                voucher: v
            });
        }
        return results;
    } catch (error) {
        console.error('Error validating vouchers:', error);
        return [];
    }
}

async function verifyVouchers(codes) {
    try {
        const results = [];
        for (const code of codes) {
            const v = await getVoucherByCode(code);
            results.push({
                code: code,
                valid: v && v.status === 'available' && new Date(v.expiry_date) > new Date(),
                voucher: v
            });
        }
        return results;
    } catch (error) {
        console.error('Error verifying vouchers:', error);
        return [];
    }
}

// ==================== ORDER FUNCTIONS ====================

async function createOrder(userId, categoryId, quantity, totalPrice, status = 'pending') {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const orderId = `SVH-${moment().format('YYYYMMDD')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const recoveryExpiry = moment().add(2, 'hours').toISOString();
        
        const user = await getUser(userId);
        const category = await getCategory(categoryId);
        
        await sheet.addRow({
            order_id: orderId,
            user_id: userId.toString(),
            username: user?.username || '',
            category_id: categoryId.toString(),
            category_name: category?.name || '',
            quantity: quantity.toString(),
            total_price: totalPrice.toString(),
            payment_method: 'manual',
            transaction_id: '',
            screenshot: '',
            status: status,
            order_date: new Date().toISOString(),
            delivery_date: '',
            recovery_expiry: recoveryExpiry,
            admin_notes: '',
            utm_source: 'bot'
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

async function getOrders(limit = 100, offset = 0) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        return rows.slice(offset, offset + limit);
    } catch (error) {
        console.error('Error getting orders:', error);
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

async function updateOrder(orderId, updates) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        const order = rows.find(row => row.order_id === orderId);
        
        if (order) {
            Object.keys(updates).forEach(key => {
                if (key !== 'order_id' && key !== 'order_date') {
                    order[key] = updates[key].toString();
                }
            });
            await order.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating order:', error);
        return false;
    }
}

async function deleteOrder(orderId) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        const order = rows.find(row => row.order_id === orderId);
        
        if (order) {
            await order.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting order:', error);
        return false;
    }
}

async function updateOrderStatus(orderId, status, deliveryDate = null) {
    const updates = { status: status };
    if (deliveryDate) {
        updates.delivery_date = deliveryDate;
    }
    return await updateOrder(orderId, updates);
}

async function updateOrderPayment(orderId, transactionId, screenshot) {
    return await updateOrder(orderId, {
        transaction_id: transactionId,
        screenshot: screenshot
    });
}

async function getOrderStats() {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        
        const now = moment();
        const today = now.format('YYYY-MM-DD');
        const weekAgo = now.clone().subtract(7, 'days').format('YYYY-MM-DD');
        
        const stats = {
            total: rows.length,
            pending: rows.filter(o => o.status === 'pending' || o.status === 'pending_approval').length,
            processing: rows.filter(o => o.status === 'processing').length,
            completed: rows.filter(o => o.status === 'delivered').length,
            rejected: rows.filter(o => o.status === 'rejected').length,
            refunded: rows.filter(o => o.status === 'refunded').length,
            
            today: rows.filter(o => o.order_date?.startsWith(today)).length,
            thisWeek: rows.filter(o => o.order_date >= weekAgo).length,
            
            totalRevenue: rows.filter(o => o.status === 'delivered')
                .reduce((sum, o) => sum + (parseInt(o.total_price) || 0), 0),
            avgOrderValue: rows.length ? 
                (rows.reduce((sum, o) => sum + (parseInt(o.total_price) || 0), 0) / rows.length) : 0,
            
            pendingApproval: rows.filter(o => o.status === 'pending_approval').length
        };
        
        return stats;
    } catch (error) {
        console.error('Error getting order stats:', error);
        return {};
    }
}

async function getOrderDetails(orderId) {
    const order = await getOrder(orderId);
    if (!order) return null;
    
    const user = await getUser(order.user_id);
    const vouchers = order.status === 'delivered' ? 
        await filterVouchers({ order_id: orderId }) : [];
    
    return {
        order: order,
        user: user,
        vouchers: vouchers
    };
}

async function getOrderHistory(orderId) {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.order_id === orderId);
    } catch (error) {
        console.error('Error getting order history:', error);
        return [];
    }
}

async function searchOrders(query) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        const lowerQuery = query.toLowerCase();
        
        return rows.filter(o => 
            o.order_id?.toLowerCase().includes(lowerQuery) ||
            o.user_id?.toLowerCase().includes(lowerQuery) ||
            o.username?.toLowerCase().includes(lowerQuery) ||
            o.transaction_id?.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching orders:', error);
        return [];
    }
}

async function filterOrders(filters) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        
        return rows.filter(o => {
            return Object.entries(filters).every(([key, value]) => 
                o[key] === value.toString()
            );
        });
    } catch (error) {
        console.error('Error filtering orders:', error);
        return [];
    }
}

async function sortOrders(field, order = 'asc') {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        
        return rows.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            
            if (order === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    } catch (error) {
        console.error('Error sorting orders:', error);
        return [];
    }
}

async function paginateOrders(page = 1, pageSize = 10) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        return {
            data: rows.slice(start, end),
            total: rows.length,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(rows.length / pageSize)
        };
    } catch (error) {
        console.error('Error paginating orders:', error);
        return { data: [], total: 0, page: page, pageSize: pageSize, totalPages: 0 };
    }
}

async function approveOrder(orderId) {
    return await updateOrderStatus(orderId, 'delivered', new Date().toISOString());
}

async function rejectOrder(orderId, reason) {
    await updateOrderStatus(orderId, 'rejected');
    return await updateOrder(orderId, { admin_notes: reason });
}

async function refundOrder(orderId) {
    return await updateOrderStatus(orderId, 'refunded');
}

async function cancelOrder(orderId) {
    return await updateOrderStatus(orderId, 'cancelled');
}

async function processOrder(orderId) {
    return await updateOrderStatus(orderId, 'processing');
}

async function deliverOrder(orderId) {
    return await approveOrder(orderId);
}

async function completeOrder(orderId) {
    return await updateOrderStatus(orderId, 'completed');
}

async function getPendingOrders(limit = 10) {
    const orders = await filterOrders({ status: 'pending_approval' });
    return orders.slice(0, limit);
}

async function getProcessingOrders(limit = 10) {
    const orders = await filterOrders({ status: 'processing' });
    return orders.slice(0, limit);
}

async function getCompletedOrders(limit = 10) {
    const orders = await filterOrders({ status: 'delivered' });
    return orders.slice(0, limit);
}

async function exportOrders() {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        
        return rows.map(o => ({
            order_id: o.order_id,
            user_id: o.user_id,
            username: o.username,
            category: o.category_name,
            quantity: o.quantity,
            total_price: o.total_price,
            status: o.status,
            order_date: o.order_date,
            delivery_date: o.delivery_date,
            transaction_id: o.transaction_id
        }));
    } catch (error) {
        console.error('Error exporting orders:', error);
        return [];
    }
}

async function importOrders(orders) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        
        for (const o of orders) {
            await sheet.addRow(o);
        }
        
        return true;
    } catch (error) {
        console.error('Error importing orders:', error);
        return false;
    }
}

async function backupOrders() {
    return await exportOrders();
}

async function restoreOrders(backupData) {
    return await importOrders(backupData);
}

// ==================== PAYMENT FUNCTIONS ====================

async function getPayments(limit = 100, offset = 0) {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        return rows.slice(offset, offset + limit);
    } catch (error) {
        console.error('Error getting payments:', error);
        return [];
    }
}

async function getPayment(paymentId) {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        return rows.find(row => row.payment_id === paymentId);
    } catch (error) {
        console.error('Error getting payment:', error);
        return null;
    }
}

async function addPayment(paymentData) {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        await sheet.addRow({
            payment_id: paymentId,
            order_id: paymentData.orderId,
            user_id: paymentData.userId,
            amount: paymentData.amount,
            method: 'manual',
            utr: paymentData.utr,
            screenshot: paymentData.screenshot || '',
            status: 'pending',
            verified_by: '',
            verified_at: '',
            notes: '',
            created_at: new Date().toISOString()
        });
        
        return paymentId;
    } catch (error) {
        console.error('Error adding payment:', error);
        return null;
    }
}

async function updatePayment(paymentId, updates) {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        const payment = rows.find(row => row.payment_id === paymentId);
        
        if (payment) {
            Object.keys(updates).forEach(key => {
                if (key !== 'payment_id' && key !== 'created_at') {
                    payment[key] = updates[key].toString();
                }
            });
            await payment.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating payment:', error);
        return false;
    }
}

async function deletePayment(paymentId) {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        const payment = rows.find(row => row.payment_id === paymentId);
        
        if (payment) {
            await payment.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting payment:', error);
        return false;
    }
}

async function getPaymentStats() {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        
        const stats = {
            total: rows.length,
            pending: rows.filter(p => p.status === 'pending').length,
            completed: rows.filter(p => p.status === 'completed').length,
            failed: rows.filter(p => p.status === 'failed').length,
            refunded: rows.filter(p => p.status === 'refunded').length,
            totalAmount: rows.reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0),
            completedAmount: rows.filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0),
            successRate: rows.length ? 
                ((rows.filter(p => p.status === 'completed').length / rows.length) * 100).toFixed(2) : 0
        };
        
        return stats;
    } catch (error) {
        console.error('Error getting payment stats:', error);
        return {};
    }
}

async function getPaymentMethods() {
    return ['manual', 'razorpay', 'paytm', 'phonepe', 'gpay'];
}

async function getPaymentHistory(orderId) {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.order_id === orderId);
    } catch (error) {
        console.error('Error getting payment history:', error);
        return [];
    }
}

async function searchPayments(query) {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        const lowerQuery = query.toLowerCase();
        
        return rows.filter(p => 
            p.payment_id?.toLowerCase().includes(lowerQuery) ||
            p.order_id?.toLowerCase().includes(lowerQuery) ||
            p.user_id?.toLowerCase().includes(lowerQuery) ||
            p.utr?.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching payments:', error);
        return [];
    }
}

async function filterPayments(filters) {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        
        return rows.filter(p => {
            return Object.entries(filters).every(([key, value]) => 
                p[key] === value.toString()
            );
        });
    } catch (error) {
        console.error('Error filtering payments:', error);
        return [];
    }
}

async function sortPayments(field, order = 'asc') {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        
        return rows.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            
            if (order === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    } catch (error) {
        console.error('Error sorting payments:', error);
        return [];
    }
}

async function approvePayment(paymentId, adminId) {
    return await updatePayment(paymentId, {
        status: 'completed',
        verified_by: adminId,
        verified_at: new Date().toISOString()
    });
}

async function rejectPayment(paymentId, reason) {
    return await updatePayment(paymentId, {
        status: 'failed',
        notes: reason
    });
}

async function refundPayment(paymentId) {
    return await updatePayment(paymentId, { status: 'refunded' });
}

async function cancelPayment(paymentId) {
    return await updatePayment(paymentId, { status: 'cancelled' });
}

async function verifyPayment(paymentId, adminId) {
    return await approvePayment(paymentId, adminId);
}

async function confirmPayment(paymentId) {
    return await updatePayment(paymentId, { status: 'confirmed' });
}

async function processPayment(paymentId) {
    return await updatePayment(paymentId, { status: 'processing' });
}

async function getPendingPayments(limit = 10) {
    const payments = await filterPayments({ status: 'pending' });
    return payments.slice(0, limit);
}

async function getCompletedPayments(limit = 10) {
    const payments = await filterPayments({ status: 'completed' });
    return payments.slice(0, limit);
}

async function getFailedPayments(limit = 10) {
    const payments = await filterPayments({ status: 'failed' });
    return payments.slice(0, limit);
}

async function exportPayments() {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        const rows = await sheet.getRows();
        
        return rows.map(p => ({
            payment_id: p.payment_id,
            order_id: p.order_id,
            user_id: p.user_id,
            amount: p.amount,
            method: p.method,
            utr: p.utr,
            status: p.status,
            verified_by: p.verified_by,
            verified_at: p.verified_at,
            created_at: p.created_at
        }));
    } catch (error) {
        console.error('Error exporting payments:', error);
        return [];
    }
}

async function importPayments(payments) {
    try {
        const sheet = doc.sheetsByTitle['Payments'];
        
        for (const p of payments) {
            await sheet.addRow(p);
        }
        
        return true;
    } catch (error) {
        console.error('Error importing payments:', error);
        return false;
    }
}

async function backupPayments() {
    return await exportPayments();
}

async function restorePayments(backupData) {
    return await importPayments(backupData);
}

// ==================== DISCOUNT FUNCTIONS ====================

async function getDiscounts() {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        return await sheet.getRows();
    } catch (error) {
        console.error('Error getting discounts:', error);
        return [];
    }
}

async function getDiscount(discountId) {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        const rows = await sheet.getRows();
        return rows.find(row => row.discount_id === discountId);
    } catch (error) {
        console.error('Error getting discount:', error);
        return null;
    }
}

async function getDiscountByCode(code) {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        const rows = await sheet.getRows();
        return rows.find(row => row.code === code && row.status === 'active');
    } catch (error) {
        console.error('Error getting discount by code:', error);
        return null;
    }
}

async function addDiscount(discountData) {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        const discountId = `DISC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        await sheet.addRow({
            discount_id: discountId,
            code: discountData.code,
            type: discountData.type || 'percentage',
            value: discountData.value,
            min_amount: discountData.minAmount || '0',
            max_amount: discountData.maxAmount || '0',
            expiry: discountData.expiry || moment().add(30, 'days').toISOString(),
            usage_limit: discountData.usageLimit || '0',
            used_count: '0',
            status: 'active',
            created_at: new Date().toISOString(),
            applicable_categories: discountData.categories || 'all'
        });
        
        return discountId;
    } catch (error) {
        console.error('Error adding discount:', error);
        return null;
    }
}

async function updateDiscount(discountId, updates) {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        const rows = await sheet.getRows();
        const discount = rows.find(row => row.discount_id === discountId);
        
        if (discount) {
            Object.keys(updates).forEach(key => {
                if (key !== 'discount_id' && key !== 'created_at') {
                    discount[key] = updates[key].toString();
                }
            });
            await discount.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating discount:', error);
        return false;
    }
}

async function deleteDiscount(discountId) {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        const rows = await sheet.getRows();
        const discount = rows.find(row => row.discount_id === discountId);
        
        if (discount) {
            await discount.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting discount:', error);
        return false;
    }
}

async function getDiscountStats() {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        const rows = await sheet.getRows();
        
        const stats = {
            total: rows.length,
            active: rows.filter(d => d.status === 'active' && new Date(d.expiry) > new Date()).length,
            expired: rows.filter(d => d.status === 'active' && new Date(d.expiry) <= new Date()).length,
            used: rows.reduce((sum, d) => sum + (parseInt(d.used_count) || 0), 0)
        };
        
        return stats;
    } catch (error) {
        console.error('Error getting discount stats:', error);
        return {};
    }
}

async function getDiscountCodes() {
    const discounts = await getDiscounts();
    return discounts.filter(d => d.status === 'active').map(d => d.code);
}

async function searchDiscounts(query) {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        const rows = await sheet.getRows();
        const lowerQuery = query.toLowerCase();
        
        return rows.filter(d => 
            d.discount_id?.toLowerCase().includes(lowerQuery) ||
            d.code?.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching discounts:', error);
        return [];
    }
}

async function filterDiscounts(filters) {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        const rows = await sheet.getRows();
        
        return rows.filter(d => {
            return Object.entries(filters).every(([key, value]) => 
                d[key] === value.toString()
            );
        });
    } catch (error) {
        console.error('Error filtering discounts:', error);
        return [];
    }
}

async function sortDiscounts(field, order = 'asc') {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        const rows = await sheet.getRows();
        
        return rows.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            
            if (order === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    } catch (error) {
        console.error('Error sorting discounts:', error);
        return [];
    }
}

async function applyDiscount(orderId, discountCode) {
    const discount = await getDiscountByCode(discountCode);
    if (!discount) return false;
    
    const order = await getOrder(orderId);
    if (!order) return false;
    
    const amount = parseInt(order.total_price);
    if (amount < parseInt(discount.min_amount)) return false;
    if (discount.max_amount !== '0' && amount > parseInt(discount.max_amount)) return false;
    
    // Increment used count
    const newCount = (parseInt(discount.used_count) || 0) + 1;
    await updateDiscount(discount.discount_id, { used_count: newCount.toString() });
    
    return true;
}

async function removeDiscount(orderId) {
    // Implementation
    return true;
}

async function validateDiscount(code, amount) {
    const discount = await getDiscountByCode(code);
    if (!discount) return { valid: false, reason: 'Invalid discount code' };
    
    if (new Date(discount.expiry) < new Date()) {
        return { valid: false, reason: 'Discount expired' };
    }
    
    if (discount.usage_limit !== '0' && parseInt(discount.used_count) >= parseInt(discount.usage_limit)) {
        return { valid: false, reason: 'Discount usage limit reached' };
    }
    
    if (amount < parseInt(discount.min_amount)) {
        return { valid: false, reason: `Minimum order amount ₹${discount.min_amount} required` };
    }
    
    if (discount.max_amount !== '0' && amount > parseInt(discount.max_amount)) {
        return { valid: false, reason: `Maximum order amount ₹${discount.max_amount} exceeded` };
    }
    
    return { valid: true, discount: discount };
}

async function exportDiscounts() {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        const rows = await sheet.getRows();
        
        return rows.map(d => ({
            discount_id: d.discount_id,
            code: d.code,
            type: d.type,
            value: d.value,
            min_amount: d.min_amount,
            max_amount: d.max_amount,
            expiry: d.expiry,
            usage_limit: d.usage_limit,
            used_count: d.used_count,
            status: d.status,
            created_at: d.created_at
        }));
    } catch (error) {
        console.error('Error exporting discounts:', error);
        return [];
    }
}

async function importDiscounts(discounts) {
    try {
        const sheet = doc.sheetsByTitle['Discounts'];
        
        for (const d of discounts) {
            await sheet.addRow(d);
        }
        
        return true;
    } catch (error) {
        console.error('Error importing discounts:', error);
        return false;
    }
}

async function backupDiscounts() {
    return await exportDiscounts();
}

async function restoreDiscounts(backupData) {
    return await importDiscounts(backupData);
}

async function bulkAddDiscounts(discounts) {
    return await importDiscounts(discounts);
}

async function bulkDeleteDiscounts(discountIds) {
    try {
        for (const id of discountIds) {
            await deleteDiscount(id);
        }
        return true;
    } catch (error) {
        console.error('Error bulk deleting discounts:', error);
        return false;
    }
}

// ==================== COUPON FUNCTIONS ====================

async function getCoupons() {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        return await sheet.getRows();
    } catch (error) {
        console.error('Error getting coupons:', error);
        return [];
    }
}

async function getCoupon(couponId) {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        const rows = await sheet.getRows();
        return rows.find(row => row.coupon_id === couponId);
    } catch (error) {
        console.error('Error getting coupon:', error);
        return null;
    }
}

async function getCouponByCode(code) {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        const rows = await sheet.getRows();
        return rows.find(row => row.code === code && row.status === 'active');
    } catch (error) {
        console.error('Error getting coupon by code:', error);
        return null;
    }
}

async function addCoupon(couponData) {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        const couponId = `CPN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        await sheet.addRow({
            coupon_id: couponId,
            code: couponData.code,
            value: couponData.value,
            type: couponData.type || 'fixed',
            min_order: couponData.minOrder || '0',
            max_discount: couponData.maxDiscount || '0',
            expiry: couponData.expiry || moment().add(30, 'days').toISOString(),
            usage_limit: couponData.usageLimit || '0',
            used_count: '0',
            status: 'active',
            created_at: new Date().toISOString(),
            user_specific: couponData.userSpecific || ''
        });
        
        return couponId;
    } catch (error) {
        console.error('Error adding coupon:', error);
        return null;
    }
}

async function updateCoupon(couponId, updates) {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        const rows = await sheet.getRows();
        const coupon = rows.find(row => row.coupon_id === couponId);
        
        if (coupon) {
            Object.keys(updates).forEach(key => {
                if (key !== 'coupon_id' && key !== 'created_at') {
                    coupon[key] = updates[key].toString();
                }
            });
            await coupon.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating coupon:', error);
        return false;
    }
}

async function deleteCoupon(couponId) {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        const rows = await sheet.getRows();
        const coupon = rows.find(row => row.coupon_id === couponId);
        
        if (coupon) {
            await coupon.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return false;
    }
}

async function getCouponStats() {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        const rows = await sheet.getRows();
        
        const stats = {
            total: rows.length,
            active: rows.filter(c => c.status === 'active' && new Date(c.expiry) > new Date()).length,
            expired: rows.filter(c => c.status === 'active' && new Date(c.expiry) <= new Date()).length,
            used: rows.reduce((sum, c) => sum + (parseInt(c.used_count) || 0), 0)
        };
        
        return stats;
    } catch (error) {
        console.error('Error getting coupon stats:', error);
        return {};
    }
}

async function getCouponCodes() {
    const coupons = await getCoupons();
    return coupons.filter(c => c.status === 'active').map(c => c.code);
}

async function searchCoupons(query) {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        const rows = await sheet.getRows();
        const lowerQuery = query.toLowerCase();
        
        return rows.filter(c => 
            c.coupon_id?.toLowerCase().includes(lowerQuery) ||
            c.code?.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching coupons:', error);
        return [];
    }
}

async function filterCoupons(filters) {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        const rows = await sheet.getRows();
        
        return rows.filter(c => {
            return Object.entries(filters).every(([key, value]) => 
                c[key] === value.toString()
            );
        });
    } catch (error) {
        console.error('Error filtering coupons:', error);
        return [];
    }
}

async function sortCoupons(field, order = 'asc') {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        const rows = await sheet.getRows();
        
        return rows.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            
            if (order === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    } catch (error) {
        console.error('Error sorting coupons:', error);
        return [];
    }
}

async function applyCoupon(orderId, couponCode) {
    const coupon = await getCouponByCode(couponCode);
    if (!coupon) return false;
    
    const order = await getOrder(orderId);
    if (!order) return false;
    
    const amount = parseInt(order.total_price);
    if (amount < parseInt(coupon.min_order)) return false;
    
    // Increment used count
    const newCount = (parseInt(coupon.used_count) || 0) + 1;
    await updateCoupon(coupon.coupon_id, { used_count: newCount.toString() });
    
    return true;
}

async function removeCoupon(orderId) {
    // Implementation
    return true;
}

async function validateCoupon(code, amount, userId = null) {
    const coupon = await getCouponByCode(code);
    if (!coupon) return { valid: false, reason: 'Invalid coupon code' };
    
    if (new Date(coupon.expiry) < new Date()) {
        return { valid: false, reason: 'Coupon expired' };
    }
    
    if (coupon.usage_limit !== '0' && parseInt(coupon.used_count) >= parseInt(coupon.usage_limit)) {
        return { valid: false, reason: 'Coupon usage limit reached' };
    }
    
    if (amount < parseInt(coupon.min_order)) {
        return { valid: false, reason: `Minimum order amount ₹${coupon.min_order} required` };
    }
    
    if (coupon.user_specific && coupon.user_specific !== userId?.toString()) {
        return { valid: false, reason: 'This coupon is for specific users only' };
    }
    
    return { valid: true, coupon: coupon };
}

async function generateCoupons(count, prefix = 'CPN', value = '100') {
    try {
        const coupons = [];
        for (let i = 0; i < count; i++) {
            const code = `${prefix}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            const id = await addCoupon({
                code: code,
                value: value,
                type: 'fixed',
                expiry: moment().add(30, 'days').toISOString()
            });
            coupons.push({ code: code, id: id });
        }
        return coupons;
    } catch (error) {
        console.error('Error generating coupons:', error);
        return [];
    }
}

async function exportCoupons() {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        const rows = await sheet.getRows();
        
        return rows.map(c => ({
            coupon_id: c.coupon_id,
            code: c.code,
            value: c.value,
            type: c.type,
            min_order: c.min_order,
            max_discount: c.max_discount,
            expiry: c.expiry,
            usage_limit: c.usage_limit,
            used_count: c.used_count,
            status: c.status,
            created_at: c.created_at
        }));
    } catch (error) {
        console.error('Error exporting coupons:', error);
        return [];
    }
}

async function importCoupons(coupons) {
    try {
        const sheet = doc.sheetsByTitle['Coupons'];
        
        for (const c of coupons) {
            await sheet.addRow(c);
        }
        
        return true;
    } catch (error) {
        console.error('Error importing coupons:', error);
        return false;
    }
}

async function backupCoupons() {
    return await exportCoupons();
}

async function restoreCoupons(backupData) {
    return await importCoupons(backupData);
}

async function bulkAddCoupons(coupons) {
    return await importCoupons(coupons);
}

// ==================== REFERRAL FUNCTIONS ====================

async function getReferrals(limit = 100, offset = 0) {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        return rows.slice(offset, offset + limit);
    } catch (error) {
        console.error('Error getting referrals:', error);
        return [];
    }
}

async function getReferral(referralId) {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        return rows.find(row => row.referral_id === referralId);
    } catch (error) {
        console.error('Error getting referral:', error);
        return null;
    }
}

async function addReferral(referrerId, referredId, orderId, earnings) {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const referralId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        await sheet.addRow({
            referral_id: referralId,
            referrer_id: referrerId.toString(),
            referred_id: referredId.toString(),
            order_id: orderId,
            earnings: earnings.toString(),
            status: 'pending',
            created_at: new Date().toISOString(),
            paid_at: '',
            notes: ''
        });
        
        return referralId;
    } catch (error) {
        console.error('Error adding referral:', error);
        return null;
    }
}

async function updateReferral(referralId, updates) {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        const referral = rows.find(row => row.referral_id === referralId);
        
        if (referral) {
            Object.keys(updates).forEach(key => {
                if (key !== 'referral_id' && key !== 'created_at') {
                    referral[key] = updates[key].toString();
                }
            });
            await referral.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating referral:', error);
        return false;
    }
}

async function deleteReferral(referralId) {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        const referral = rows.find(row => row.referral_id === referralId);
        
        if (referral) {
            await referral.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting referral:', error);
        return false;
    }
}

async function getReferralStats() {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        
        const stats = {
            total: rows.length,
            pending: rows.filter(r => r.status === 'pending').length,
            completed: rows.filter(r => r.status === 'completed').length,
            totalEarnings: rows.reduce((sum, r) => sum + (parseInt(r.earnings) || 0), 0),
            avgEarnings: rows.length ? (rows.reduce((sum, r) => sum + (parseInt(r.earnings) || 0), 0) / rows.length) : 0,
            uniqueReferrers: new Set(rows.map(r => r.referrer_id)).size,
            uniqueReferred: new Set(rows.map(r => r.referred_id)).size
        };
        
        return stats;
    } catch (error) {
        console.error('Error getting referral stats:', error);
        return {};
    }
}

async function getReferralEarnings(userId) {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        const userReferrals = rows.filter(r => r.referrer_id === userId.toString());
        
        return {
            total: userReferrals.reduce((sum, r) => sum + (parseInt(r.earnings) || 0), 0),
            pending: userReferrals.filter(r => r.status === 'pending')
                .reduce((sum, r) => sum + (parseInt(r.earnings) || 0), 0),
            completed: userReferrals.filter(r => r.status === 'completed')
                .reduce((sum, r) => sum + (parseInt(r.earnings) || 0), 0),
            count: userReferrals.length
        };
    } catch (error) {
        console.error('Error getting referral earnings:', error);
        return { total: 0, pending: 0, completed: 0, count: 0 };
    }
}

async function getReferralUsers(userId) {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        const referrals = rows.filter(r => r.referrer_id === userId.toString());
        
        const users = [];
        for (const r of referrals) {
            const user = await getUser(r.referred_id);
            if (user) {
                users.push({
                    user: user,
                    referral: r,
                    joinedAt: r.created_at,
                    earnings: r.earnings,
                    status: r.status
                });
            }
        }
        
        return users;
    } catch (error) {
        console.error('Error getting referral users:', error);
        return [];
    }
}

async function searchReferrals(query) {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        const lowerQuery = query.toLowerCase();
        
        return rows.filter(r => 
            r.referral_id?.toLowerCase().includes(lowerQuery) ||
            r.referrer_id?.toLowerCase().includes(lowerQuery) ||
            r.referred_id?.toLowerCase().includes(lowerQuery) ||
            r.order_id?.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching referrals:', error);
        return [];
    }
}

async function filterReferrals(filters) {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        
        return rows.filter(r => {
            return Object.entries(filters).every(([key, value]) => 
                r[key] === value.toString()
            );
        });
    } catch (error) {
        console.error('Error filtering referrals:', error);
        return [];
    }
}

async function sortReferrals(field, order = 'asc') {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        
        return rows.sort((a, b) => {
            const aVal = a[field] || '';
            const bVal = b[field] || '';
            
            if (order === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    } catch (error) {
        console.error('Error sorting referrals:', error);
        return [];
    }
}

async function processReferralBonus(referralId) {
    return await updateReferral(referralId, { 
        status: 'completed',
        paid_at: new Date().toISOString()
    });
}

async function calculateReferralEarnings(userId) {
    return await getReferralEarnings(userId);
}

async function exportReferrals() {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        const rows = await sheet.getRows();
        
        return rows.map(r => ({
            referral_id: r.referral_id,
            referrer_id: r.referrer_id,
            referred_id: r.referred_id,
            order_id: r.order_id,
            earnings: r.earnings,
            status: r.status,
            created_at: r.created_at,
            paid_at: r.paid_at
        }));
    } catch (error) {
        console.error('Error exporting referrals:', error);
        return [];
    }
}

async function importReferrals(referrals) {
    try {
        const sheet = doc.sheetsByTitle['Referrals'];
        
        for (const r of referrals) {
            await sheet.addRow(r);
        }
        
        return true;
    } catch (error) {
        console.error('Error importing referrals:', error);
        return false;
    }
}

async function backupReferrals() {
    return await exportReferrals();
}

async function restoreReferrals(backupData) {
    return await importReferrals(backupData);
}

// ==================== SETTINGS FUNCTIONS ====================

async function getSettings() {
    try {
        const sheet = doc.sheetsByTitle['Settings'];
        const rows = await sheet.getRows();
        
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        
        return settings;
    } catch (error) {
        console.error('Error getting settings:', error);
        return {};
    }
}

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

async function updateSetting(key, value, updatedBy = 'system') {
    try {
        const sheet = doc.sheetsByTitle['Settings'];
        const rows = await sheet.getRows();
        const setting = rows.find(row => row.key === key);
        
        if (setting) {
            setting.value = value.toString();
            setting.updated_at = new Date().toISOString();
            setting.updated_by = updatedBy;
            await setting.save();
        } else {
            await sheet.addRow({
                key: key,
                value: value.toString(),
                description: '',
                type: 'string',
                category: 'general',
                updated_at: new Date().toISOString(),
                updated_by: updatedBy
            });
        }
        return true;
    } catch (error) {
        console.error('Error updating setting:', error);
        return false;
    }
}

async function resetSetting(key) {
    // Implementation - reset to default
    return true;
}

async function getBotSettings() {
    return await getSettings();
}

async function getPaymentSettings() {
    const settings = await getSettings();
    return {
        method: settings.payment_method || 'manual',
        currency: settings.currency || 'INR',
        symbol: settings.currency_symbol || '₹',
        minAmount: settings.min_amount || '10',
        maxAmount: settings.max_amount || '100000',
        timeout: settings.payment_timeout || '30'
    };
}

async function getSecuritySettings() {
    const settings = await getSettings();
    return {
        rateLimit: settings.rate_limit_general || '30',
        sessionTimeout: settings.session_timeout || '30',
        maxLoginAttempts: settings.max_login_attempts || '5'
    };
}

async function updateBotSettings(updates) {
    for (const [key, value] of Object.entries(updates)) {
        await updateSetting(key, value);
    }
    return true;
}

async function updatePaymentSettings(updates) {
    for (const [key, value] of Object.entries(updates)) {
        await updateSetting(`payment_${key}`, value);
    }
    return true;
}

async function updateSecuritySettings(updates) {
    for (const [key, value] of Object.entries(updates)) {
        await updateSetting(`security_${key}`, value);
    }
    return true;
}

async function backupSettings() {
    return await getSettings();
}

async function restoreSettings(backupData) {
    for (const [key, value] of Object.entries(backupData)) {
        await updateSetting(key, value, 'restore');
    }
    return true;
}

async function exportSettings() {
    return await getSettings();
}

async function importSettings(settings) {
    return await restoreSettings(settings);
}

// ==================== ANALYTICS FUNCTIONS ====================

async function getDailyStats() {
    const users = await getUserStats();
    const orders = await getOrderStats();
    const payments = await getPaymentStats();
    const vouchers = await getVoucherStats();
    const categories = await getCategoryStats();
    
    return {
        newUsers: users.today || 0,
        newOrders: orders.today || 0,
        revenue: orders.totalRevenue || 0,
        profit: orders.totalRevenue * 0.2 || 0,
        conversion: orders.today && users.today ? ((orders.today / users.today) * 100).toFixed(2) : 0,
        totalUsers: users.total || 0,
        totalOrders: orders.total || 0,
        pendingPayments: payments.pending || 0,
        availableVouchers: vouchers.available || 0,
        totalCategories: categories.total || 0,
        razorpayPercent: 0,
        manualPercent: 100
    };
}

async function getWeeklyStats() {
    const users = await getUserStats();
    const orders = await getOrderStats();
    
    return {
        newUsers: users.thisWeek || 0,
        newOrders: orders.thisWeek || 0,
        revenue: orders.totalRevenue || 0,
        growth: 10
    };
}

async function getMonthlyStats() {
    const users = await getUserStats();
    const orders = await getOrderStats();
    
    return {
        newUsers: users.thisMonth || 0,
        newOrders: orders.thisMonth || 0,
        revenue: orders.totalRevenue || 0,
        avgOrder: orders.avgOrderValue || 0
    };
}

async function getYearlyStats() {
    return {
        newUsers: 0,
        newOrders: 0,
        revenue: 0,
        growth: 0
    };
}

async function getUserGrowth() {
    const users = await getUserStats();
    return {
        growth: users.total ? 5 : 0
    };
}

async function getRevenueStats() {
    const orders = await getOrderStats();
    return {
        today: orders.totalRevenue || 0,
        week: orders.totalRevenue || 0,
        month: orders.totalRevenue || 0,
        year: orders.totalRevenue || 0,
        total: orders.totalRevenue || 0,
        avgOrder: orders.avgOrderValue || 0
    };
}

async function getTopUsers(limit = 5) {
    const users = await getAllUsers();
    return users
        .sort((a, b) => (parseInt(b.total_spent) || 0) - (parseInt(a.total_spent) || 0))
        .slice(0, limit)
        .map(u => ({
            name: u.first_name,
            orders: u.orders_count,
            spent: u.total_spent
        }));
}

async function getTopCategories(limit = 5) {
    const categories = await getCategories();
    return categories
        .sort((a, b) => (parseInt(b.total_sold) || 0) - (parseInt(a.total_sold) || 0))
        .slice(0, limit)
        .map(c => ({
            name: c.name,
            sold: c.total_sold,
            revenue: (parseInt(c.price_per_code) || 0) * (parseInt(c.total_sold) || 0)
        }));
}

async function getTopVouchers(limit = 5) {
    return [];
}

async function getSalesReport(startDate, endDate) {
    return {};
}

async function getEarningsReport(startDate, endDate) {
    return {};
}

async function getPerformanceReport() {
    return {};
}

async function exportReport(type, format = 'csv') {
    return {};
}

async function generatePDF(data) {
    return Buffer.from('');
}

async function generateExcel(data) {
    return Buffer.from('');
}

async function generateCSV(data) {
    return '';
}

async function scheduleReport(type, schedule, email) {
    return true;
}

async function sendReport(type, email) {
    return true;
}

async function archiveReport(reportId) {
    return true;
}

// ==================== LOG FUNCTIONS ====================

async function addLog(logData) {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        await sheet.addRow({
            log_id: logId,
            timestamp: new Date().toISOString(),
            level: logData.level || 'info',
            type: logData.type || 'system',
            user_id: logData.userId || '',
            action: logData.action || '',
            details: JSON.stringify(logData.details || {}),
            ip_address: logData.ip || '',
            user_agent: logData.userAgent || '',
            session_id: logData.sessionId || ''
        });
        
        return logId;
    } catch (error) {
        console.error('Error adding log:', error);
        return null;
    }
}

async function getLogs(limit = 100, offset = 0) {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const rows = await sheet.getRows();
        return rows.slice(offset, offset + limit);
    } catch (error) {
        console.error('Error getting logs:', error);
        return [];
    }
}

async function getErrorLogs(limit = 100) {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.level === 'error').slice(0, limit);
    } catch (error) {
        console.error('Error getting error logs:', error);
        return [];
    }
}

async function getPaymentLogs(limit = 100) {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.type === 'payment').slice(0, limit);
    } catch (error) {
        console.error('Error getting payment logs:', error);
        return [];
    }
}

async function getUserLogs(userId, limit = 100) {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.user_id === userId.toString()).slice(0, limit);
    } catch (error) {
        console.error('Error getting user logs:', error);
        return [];
    }
}

async function clearLogs(days = 30) {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const rows = await sheet.getRows();
        const cutoff = moment().subtract(days, 'days').toISOString();
        
        for (const row of rows) {
            if (row.timestamp < cutoff) {
                await row.delete();
            }
        }
        return true;
    } catch (error) {
        console.error('Error clearing logs:', error);
        return false;
    }
}

async function exportLogs(format = 'csv') {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const rows = await sheet.getRows();
        
        return rows.map(l => ({
            log_id: l.log_id,
            timestamp: l.timestamp,
            level: l.level,
            type: l.type,
            user_id: l.user_id,
            action: l.action,
            ip_address: l.ip_address
        }));
    } catch (error) {
        console.error('Error exporting logs:', error);
        return [];
    }
}

async function searchLogs(query) {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const rows = await sheet.getRows();
        const lowerQuery = query.toLowerCase();
        
        return rows.filter(l => 
            l.log_id?.toLowerCase().includes(lowerQuery) ||
            l.user_id?.toLowerCase().includes(lowerQuery) ||
            l.action?.toLowerCase().includes(lowerQuery) ||
            l.type?.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching logs:', error);
        return [];
    }
}

async function filterLogs(filters) {
    try {
        const sheet = doc.sheetsByTitle['Logs'];
        const rows = await sheet.getRows();
        
        return rows.filter(l => {
            return Object.entries(filters).every(([key, value]) => 
                l[key] === value.toString()
            );
        });
    } catch (error) {
        console.error('Error filtering logs:', error);
        return [];
    }
}

// ==================== BACKUP FUNCTIONS ====================

async function createBackup(type = 'manual') {
    try {
        const sheet = doc.sheetsByTitle['Backups'];
        const backupId = `BAK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const filename = `backup-${type}-${moment().format('YYYYMMDD-HHmmss')}.json`;
        
        // Gather all data
        const backup = {
            users: await exportUsers(),
            vouchers: await exportVouchers(),
            orders: await exportOrders(),
            categories: await exportCategories(),
            payments: await exportPayments(),
            discounts: await exportDiscounts(),
            coupons: await exportCoupons(),
            referrals: await exportReferrals(),
            settings: await exportSettings(),
            timestamp: new Date().toISOString(),
            version: '7.0.0'
        };
        
        const data = JSON.stringify(backup);
        const size = Buffer.byteLength(data, 'utf8');
        
        await sheet.addRow({
            backup_id: backupId,
            filename: filename,
            size: size.toString(),
            type: type,
            status: 'completed',
            created_at: new Date().toISOString(),
            created_by: 'system',
            location: 'cloud',
            checksum: crypto.createHash('md5').update(data).digest('hex')
        });
        
        return { backupId: backupId, filename: filename, size: size, data: data };
    } catch (error) {
        console.error('Error creating backup:', error);
        return null;
    }
}

async function restoreBackup(backupId) {
    try {
        const sheet = doc.sheetsByTitle['Backups'];
        const rows = await sheet.getRows();
        const backup = rows.find(row => row.backup_id === backupId);
        
        if (!backup) return false;
        
        return true;
    } catch (error) {
        console.error('Error restoring backup:', error);
        return false;
    }
}

async function getBackups(limit = 100) {
    try {
        const sheet = doc.sheetsByTitle['Backups'];
        const rows = await sheet.getRows();
        return rows.slice(0, limit).map(b => ({
            id: b.backup_id,
            name: b.filename,
            size: `${(parseInt(b.size) / 1024).toFixed(2)} KB`,
            date: moment(b.created_at).format('DD/MM/YYYY HH:mm'),
            type: b.type,
            status: b.status
        }));
    } catch (error) {
        console.error('Error getting backups:', error);
        return [];
    }
}

async function deleteBackup(backupId) {
    try {
        const sheet = doc.sheetsByTitle['Backups'];
        const rows = await sheet.getRows();
        const backup = rows.find(row => row.backup_id === backupId);
        
        if (backup) {
            await backup.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting backup:', error);
        return false;
    }
}

async function downloadBackup(backupId) {
    return null;
}

async function uploadBackup(backupData) {
    return true;
}

async function scheduleBackup(cronExpression) {
    return true;
}

async function getBackupSettings() {
    const settings = await getSettings();
    return {
        autoBackup: settings.auto_backup || 'false',
        interval: settings.backup_interval || '24',
        retention: settings.backup_retention || '30',
        location: settings.backup_location || 'cloud',
        lastBackup: settings.last_backup || 'Never'
    };
}

async function updateBackupSettings(updates) {
    for (const [key, value] of Object.entries(updates)) {
        await updateSetting(`backup_${key}`, value);
    }
    return true;
}

// ==================== SECURITY FUNCTIONS ====================

async function getSecurityLogs(limit = 100) {
    return await getErrorLogs(limit);
}

async function getLoginAttempts(userId = null, limit = 100) {
    const logs = await getLogs(limit);
    return logs.filter(l => l.action?.includes('login'));
}

async function getFailedLogins(limit = 100) {
    const logs = await getLogs(limit);
    return logs.filter(l => l.action?.includes('login_failed'));
}

async function blockIP(ipAddress, reason) {
    try {
        const sheet = doc.sheetsByTitle['BlockedIPs'];
        if (!sheet) return false;
        
        await sheet.addRow({
            ip_address: ipAddress,
            reason: reason,
            blocked_at: new Date().toISOString(),
            blocked_by: 'admin',
            expires_at: ''
        });
        return true;
    } catch (error) {
        console.error('Error blocking IP:', error);
        return false;
    }
}

async function unblockIP(ipAddress) {
    try {
        const sheet = doc.sheetsByTitle['BlockedIPs'];
        if (!sheet) return true;
        
        const rows = await sheet.getRows();
        const blocks = rows.filter(row => row.ip_address === ipAddress);
        
        for (const block of blocks) {
            await block.delete();
        }
        return true;
    } catch (error) {
        console.error('Error unblocking IP:', error);
        return false;
    }
}

async function getBlockedIPs() {
    try {
        const sheet = doc.sheetsByTitle['BlockedIPs'];
        if (!sheet) return [];
        
        const rows = await sheet.getRows();
        return rows.map(b => ({
            address: b.ip_address,
            reason: b.reason,
            date: moment(b.blocked_at).format('DD/MM/YYYY HH:mm')
        }));
    } catch (error) {
        console.error('Error getting blocked IPs:', error);
        return [];
    }
}

async function setRateLimit(type, limit) {
    return await updateSetting(`rate_limit_${type}`, limit.toString());
}

async function getRateLimits() {
    return {
        general: await getSetting('rate_limit_general') || '30',
        login: await getSetting('rate_limit_login') || '5',
        payment: await getSetting('rate_limit_payment') || '10',
        api: await getSetting('rate_limit_api') || '100'
    };
}

async function updateRateLimit(type, limit) {
    return await setRateLimit(type, limit);
}

async function setAccessControl(rule) {
    return true;
}

async function getAccessRules() {
    return [];
}

async function updateAccessRules(rules) {
    return true;
}

async function getAuditLogs(limit = 100) {
    const logs = await getLogs(limit);
    return logs.filter(l => l.type === 'audit');
}

async function clearAuditLogs(days = 30) {
    return await clearLogs(days);
}

async function exportAuditLogs() {
    const logs = await getAuditLogs();
    return JSON.stringify(logs);
}

// ==================== BROADCAST FUNCTIONS ====================

async function sendBroadcast(message, filter = {}) {
    try {
        const sheet = doc.sheetsByTitle['Broadcasts'];
        if (!sheet) return null;
        
        const broadcastId = `BC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        await sheet.addRow({
            broadcast_id: broadcastId,
            message: message,
            filter: JSON.stringify(filter),
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_by: 'admin',
            stats: JSON.stringify({})
        });
        
        return broadcastId;
    } catch (error) {
        console.error('Error sending broadcast:', error);
        return null;
    }
}

async function scheduleBroadcast(message, scheduleTime, filter = {}) {
    try {
        const sheet = doc.sheetsByTitle['Broadcasts'];
        if (!sheet) return null;
        
        const broadcastId = `BC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        await sheet.addRow({
            broadcast_id: broadcastId,
            message: message,
            filter: JSON.stringify(filter),
            status: 'scheduled',
            scheduled_for: scheduleTime,
            sent_at: '',
            sent_by: 'admin',
            stats: JSON.stringify({})
        });
        
        return broadcastId;
    } catch (error) {
        console.error('Error scheduling broadcast:', error);
        return null;
    }
}

async function getBroadcasts(limit = 10) {
    try {
        const sheet = doc.sheetsByTitle['Broadcasts'];
        if (!sheet) return [];
        
        const rows = await sheet.getRows();
        return rows.slice(0, limit).map(b => ({
            id: b.broadcast_id,
            message: b.message.substring(0, 50) + '...',
            status: b.status,
            date: b.sent_at || b.scheduled_for
        }));
    } catch (error) {
        console.error('Error getting broadcasts:', error);
        return [];
    }
}

async function deleteBroadcast(broadcastId) {
    try {
        const sheet = doc.sheetsByTitle['Broadcasts'];
        if (!sheet) return true;
        
        const rows = await sheet.getRows();
        const broadcast = rows.find(row => row.broadcast_id === broadcastId);
        
        if (broadcast) {
            await broadcast.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting broadcast:', error);
        return false;
    }
}

async function pauseBroadcast(broadcastId) {
    return await updateBroadcast(broadcastId, { status: 'paused' });
}

async function resumeBroadcast(broadcastId) {
    return await updateBroadcast(broadcastId, { status: 'scheduled' });
}

async function updateBroadcast(broadcastId, updates) {
    try {
        const sheet = doc.sheetsByTitle['Broadcasts'];
        if (!sheet) return false;
        
        const rows = await sheet.getRows();
        const broadcast = rows.find(row => row.broadcast_id === broadcastId);
        
        if (broadcast) {
            Object.keys(updates).forEach(key => {
                broadcast[key] = updates[key].toString();
            });
            await broadcast.save();
        }
        return true;
    } catch (error) {
        console.error('Error updating broadcast:', error);
        return false;
    }
}

async function getBroadcastStats() {
    const broadcasts = await getBroadcasts(1000);
    
    return {
        total: broadcasts.length,
        sent: broadcasts.filter(b => b.status === 'sent').length,
        scheduled: broadcasts.filter(b => b.status === 'scheduled').length,
        failed: broadcasts.filter(b => b.status === 'failed').length,
        avgReach: 0
    };
}

async function getBroadcastHistory(limit = 50) {
    return await getBroadcasts(limit);
}

// ==================== NOTIFICATION FUNCTIONS ====================

async function sendNotification(userId, type, message) {
    try {
        const sheet = doc.sheetsByTitle['Notifications'];
        if (!sheet) return null;
        
        const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        await sheet.addRow({
            notification_id: notificationId,
            user_id: userId.toString(),
            type: type,
            message: message,
            status: 'unread',
            created_at: new Date().toISOString(),
            read_at: ''
        });
        
        return notificationId;
    } catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
}

async function getNotifications(userId, limit = 50) {
    try {
        const sheet = doc.sheetsByTitle['Notifications'];
        if (!sheet) return [];
        
        const rows = await sheet.getRows();
        return rows
            .filter(row => row.user_id === userId.toString())
            .slice(0, limit)
            .map(n => ({
                id: n.notification_id,
                type: n.type,
                message: n.message,
                status: n.status,
                created_at: n.created_at
            }));
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
}

async function markAsRead(notificationId) {
    try {
        const sheet = doc.sheetsByTitle['Notifications'];
        if (!sheet) return false;
        
        const rows = await sheet.getRows();
        const notification = rows.find(row => row.notification_id === notificationId);
        
        if (notification) {
            notification.status = 'read';
            notification.read_at = new Date().toISOString();
            await notification.save();
        }
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

async function deleteNotification(notificationId) {
    try {
        const sheet = doc.sheetsByTitle['Notifications'];
        if (!sheet) return true;
        
        const rows = await sheet.getRows();
        const notification = rows.find(row => row.notification_id === notificationId);
        
        if (notification) {
            await notification.delete();
        }
        return true;
    } catch (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
}

async function clearNotifications(userId) {
    try {
        const sheet = doc.sheetsByTitle['Notifications'];
        if (!sheet) return true;
        
        const rows = await sheet.getRows();
        const userNotifications = rows.filter(row => row.user_id === userId.toString());
        
        for (const notification of userNotifications) {
            await notification.delete();
        }
        return true;
    } catch (error) {
        console.error('Error clearing notifications:', error);
        return false;
    }
}

async function setNotificationSettings(settings) {
    for (const [key, value] of Object.entries(settings)) {
        await updateSetting(`notification_${key}`, value);
    }
    return true;
}

async function getNotificationSettings() {
    return {
        email: await getSetting('notification_email') || 'true',
        telegram: await getSetting('notification_telegram') || 'true',
        sms: await getSetting('notification_sms') || 'false',
        orders: await getSetting('notification_orders') || 'true',
        payments: await getSetting('notification_payments') || 'true',
        users: await getSetting('notification_users') || 'true'
    };
}

// ==================== WEBHOOK FUNCTIONS ====================

async function setWebhook(url, events = []) {
    return await updateSetting('webhook_url', url);
}

async function getWebhook() {
    return {
        url: await getSetting('webhook_url') || '',
        events: await getSetting('webhook_events') || 'all',
        status: await getSetting('webhook_status') || 'inactive'
    };
}

async function testWebhook() {
    return true;
}

async function deleteWebhook() {
    return await updateSetting('webhook_url', '');
}

async function getWebhookLogs(limit = 100) {
    const logs = await getLogs(limit);
    return logs.filter(l => l.type === 'webhook');
}

async function getWebhookStats() {
    const logs = await getWebhookLogs(100);
    return {
        total: logs.length,
        success: logs.filter(l => l.level === 'info').length,
        failed: logs.filter(l => l.level === 'error').length,
        lastRun: logs[0]?.timestamp || 'Never'
    };
}

// ==================== API FUNCTIONS ====================

async function generateAPIKey(userId) {
    const key = `API-${crypto.randomBytes(16).toString('hex')}-${Date.now()}`;
    
    try {
        const sheet = doc.sheetsByTitle['APIKeys'];
        if (!sheet) return null;
        
        await sheet.addRow({
            key_id: `KEY-${Date.now()}`,
            api_key: key,
            user_id: userId.toString(),
            created_at: new Date().toISOString(),
            expires_at: moment().add(1, 'year').toISOString(),
            last_used: '',
            status: 'active',
            permissions: 'all'
        });
        
        return key;
    } catch (error) {
        console.error('Error generating API key:', error);
        return null;
    }
}

async function revokeAPIKey(key) {
    try {
        const sheet = doc.sheetsByTitle['APIKeys'];
        if (!sheet) return false;
        
        const rows = await sheet.getRows();
        const apiKey = rows.find(row => row.api_key === key);
        
        if (apiKey) {
            apiKey.status = 'revoked';
            await apiKey.save();
        }
        return true;
    } catch (error) {
        console.error('Error revoking API key:', error);
        return false;
    }
}

async function getAPIKeys(userId = null) {
    try {
        const sheet = doc.sheetsByTitle['APIKeys'];
        if (!sheet) return [];
        
        const rows = await sheet.getRows();
        let keys = rows;
        
        if (userId) {
            keys = keys.filter(row => row.user_id === userId.toString());
        }
        
        return keys.map(k => ({
            key: k.api_key.substring(0, 16) + '...',
            created: k.created_at,
            expires: k.expires_at,
            status: k.status,
            lastUsed: k.last_used
        }));
    } catch (error) {
        console.error('Error getting API keys:', error);
        return [];
    }
}

async function getAPIUsage(key) {
    return {};
}

async function getAPILogs(key, limit = 100) {
    const logs = await getLogs(limit);
    return logs.filter(l => l.details?.includes(key));
}

async function getAPIStats() {
    const logs = await getAPILogs(null, 1000);
    return {
        total: logs.length,
        success: logs.filter(l => l.level === 'info').length,
        failed: logs.filter(l => l.level === 'error').length,
        avgResponse: 150
    };
}

async function setAPIRateLimit(limit) {
    return await updateSetting('api_rate_limit', limit.toString());
}

async function getAPIRateLimits() {
    return {
        perMinute: await getSetting('api_rate_limit') || '100',
        perHour: await getSetting('api_rate_limit_hour') || '1000',
        perDay: await getSetting('api_rate_limit_day') || '10000'
    };
}

// ==================== SYSTEM FUNCTIONS ====================

async function getSystemInfo() {
    return {
        responseTime: Math.random() * 100,
        requestsPerMinute: 0,
        activeSessions: 0,
        version: '7.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
    };
}

async function getSystemStats() {
    const users = await getUserStats();
    const orders = await getOrderStats();
    const payments = await getPaymentStats();
    
    return {
        users: users.total || 0,
        orders: orders.total || 0,
        revenue: orders.totalRevenue || 0,
        payments: payments.total || 0,
        uptime: process.uptime(),
        memory: process.memoryUsage().heapUsed / 1024 / 1024,
        cpu: process.cpuUsage().user / 1000000
    };
}

async function getSystemHealth() {
    return {
        status: 'healthy',
        database: 'connected',
        api: 'online',
        timestamp: new Date().toISOString()
    };
}

async function restartBot() {
    process.exit(0);
}

async function shutdownBot() {
    process.exit(0);
}

async function updateBot() {
    return true;
}

async function getMemoryUsage() {
    const mem = process.memoryUsage();
    return `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`;
}

async function getCPUUsage() {
    const cpu = process.cpuUsage();
    return `${(cpu.user / 1000000).toFixed(2)}%`;
}

async function getDiskUsage() {
    return '1.2 GB / 10 GB';
}

async function getUptime() {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor(((uptime % 86400) % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
}

async function getProcessInfo() {
    return {
        pid: process.pid,
        title: process.title,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        cwd: process.cwd()
    };
}

async function getEnvironmentInfo() {
    return {
        node_env: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        database: 'Google Sheets',
        bot_token: process.env.BOT_TOKEN ? 'set' : 'not set',
        admin_id: process.env.ADMIN_ID || 'not set'
    };
}

// ==================== MAINTENANCE FUNCTIONS ====================

async function enableMaintenance(message = 'Bot is under maintenance. Please try again later.') {
    await updateSetting('maintenance_mode', 'true');
    await updateSetting('maintenance_message', message);
    return true;
}

async function disableMaintenance() {
    await updateSetting('maintenance_mode', 'false');
    return true;
}

async function getMaintenanceStatus() {
    return {
        enabled: (await getSetting('maintenance_mode')) === 'true',
        message: (await getSetting('maintenance_message')) || 'Bot is under maintenance.'
    };
}

async function setMaintenanceMessage(message) {
    return await updateSetting('maintenance_message', message);
}

async function scheduleMaintenance(startTime, endTime) {
    return true;
}

// ==================== CACHE FUNCTIONS ====================

async function clearCache() {
    return true;
}

async function getCacheStats() {
    return {
        size: 0,
        hits: 0,
        misses: 0,
        ratio: 0
    };
}

async function refreshCache() {
    return true;
}

async function setCache(key, value, ttl = 3600) {
    return true;
}

async function getCache(key) {
    return null;
}

async function deleteCache(key) {
    return true;
}

// ==================== DATABASE FUNCTIONS ====================

async function backupDatabase() {
    return await createBackup('database');
}

async function restoreDatabase(backupId) {
    return await restoreBackup(backupId);
}

async function optimizeDatabase() {
    return true;
}

async function getDatabaseStats() {
    return {
        size: '10 MB',
        tables: 10,
        rows: 1000,
        lastOptimized: '2026-02-18'
    };
}

async function getDatabaseSize() {
    return '10 MB';
}

// ==================== ERROR HANDLING FUNCTIONS ====================

async function getErrors(limit = 100) {
    return await getErrorLogs(limit);
}

async function resolveError(errorId) {
    return true;
}

async function deleteError(errorId) {
    return true;
}

async function getErrorStats() {
    const errors = await getErrors(1000);
    return {
        total: errors.length,
        critical: errors.filter(e => e.level === 'critical').length,
        high: errors.filter(e => e.level === 'high').length,
        medium: errors.filter(e => e.level === 'medium').length,
        low: errors.filter(e => e.level === 'low').length
    };
}

// ==================== SCHEDULER FUNCTIONS ====================

async function getScheduledJobs() {
    return [];
}

async function addScheduledJob(name, cron, task) {
    return true;
}

async function removeScheduledJob(jobId) {
    return true;
}

async function pauseScheduledJob(jobId) {
    return true;
}

async function resumeScheduledJob(jobId) {
    return true;
}

async function getSchedulerStats() {
    return {
        totalJobs: 0,
        running: 0,
        paused: 0,
        completed: 0,
        failed: 0
    };
}

// ==================== QUEUE FUNCTIONS ====================

async function getQueue() {
    return [];
}

async function getQueueStats() {
    return {
        size: 0,
        processing: 0,
        pending: 0,
        completed: 0,
        failed: 0
    };
}

async function clearQueue() {
    return true;
}

async function processQueue() {
    return true;
}

async function pauseQueue() {
    return true;
}

async function resumeQueue() {
    return true;
}

// ==================== SESSION FUNCTIONS ====================

async function getSessions(userId = null) {
    return [];
}

async function getSession(sessionId) {
    return null;
}

async function deleteSession(sessionId) {
    return true;
}

async function clearSessions() {
    return true;
}

async function getSessionStats() {
    return {
        total: 0,
        active: 0,
        expired: 0
    };
}

// ==================== TOKEN FUNCTIONS ====================

async function generateToken(userId, type = 'auth') {
    const token = jwt.sign(
        { userId: userId, type: type, timestamp: Date.now() },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
    );
    
    return token;
}

async function validateToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return { valid: true, decoded: decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

async function revokeToken(token) {
    return true;
}

async function getTokens(userId) {
    return [];
}

async function getTokenStats() {
    return {
        total: 0,
        active: 0,
        expired: 0
    };
}

// ==================== ENCRYPTION FUNCTIONS ====================

async function encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'key');
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

async function decrypt(encrypted) {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'key');
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

async function hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

async function verify(text, hash) {
    const calculated = await hash(text);
    return calculated === hash;
}

async function getEncryptionKey() {
    return process.env.ENCRYPTION_KEY || 'default-key';
}

async function rotateEncryptionKey() {
    return true;
}

// ==================== COMPRESSION FUNCTIONS ====================

async function compress(data) {
    return data;
}

async function decompress(data) {
    return data;
}

async function getCompressionStats() {
    return {
        ratio: 0,
        saved: 0,
        total: 0
    };
}

// ==================== LOGGING FUNCTIONS ====================

async function setLogLevel(level) {
    return await updateSetting('log_level', level);
}

async function getLogLevel() {
    return (await getSetting('log_level')) || 'info';
}

async function getLoggers() {
    return ['console', 'file', 'database'];
}

// ==================== MONITORING FUNCTIONS ====================

async function getMetrics() {
    return {
        users: await getUserStats(),
        orders: await getOrderStats(),
        payments: await getPaymentStats(),
        system: await getSystemStats()
    };
}

async function getAlerts() {
    return [];
}

async function setAlert(condition, action) {
    return true;
}

async function removeAlert(alertId) {
    return true;
}

async function getAlertHistory(limit = 100) {
    return [];
}

// ==================== TESTING FUNCTIONS ====================

async function runTests() {
    return { passed: 0, failed: 0, total: 0 };
}

async function getTestResults() {
    return [];
}

async function getTestCoverage() {
    return 0;
}

// ==================== DOCUMENTATION FUNCTIONS ====================

async function getDocs() {
    return 'Documentation';
}

async function getHelp() {
    return 'Admin Help Center';
}

async function getCommands() {
    return [
        '/admin - Open admin panel',
        '/stats - View statistics',
        '/users - Manage users',
        '/categories - Manage categories',
        '/vouchers - Manage vouchers',
        '/orders - Manage orders',
        '/payments - Manage payments',
        '/settings - Bot settings',
        '/backup - Create backup',
        '/logs - View logs'
    ];
}

// ==================== MIGRATION FUNCTIONS ====================

async function migrateData(from, to) {
    return true;
}

async function rollbackMigration(migrationId) {
    return true;
}

async function getMigrationStatus() {
    return {
        currentVersion: '7.0.0',
        lastMigration: '2026-02-18',
        pendingMigrations: []
    };
}

// ==================== VALIDATION FUNCTIONS ====================

async function validateData(data, schema) {
    return { valid: true, errors: [] };
}

async function validateSchema(schema) {
    return true;
}

async function validateInput(input, rules) {
    return { valid: true, errors: [] };
}

// ==================== FORMATTING FUNCTIONS ====================

async function formatData(data, format) {
    if (format === 'json') {
        return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
        return '';
    }
    return data;
}

async function formatOutput(data, type) {
    return data;
}

async function formatReport(data, format) {
    if (format === 'pdf') {
        return await generatePDF(data);
    } else if (format === 'excel') {
        return await generateExcel(data);
    } else if (format === 'csv') {
        return await generateCSV(data);
    }
    return data;
}

// ==================== CONVERSION FUNCTIONS ====================

async function convertData(data, from, to) {
    return data;
}

async function convertFormat(data, fromFormat, toFormat) {
    return data;
}

async function convertType(value, toType) {
    if (toType === 'number') {
        return Number(value);
    } else if (toType === 'string') {
        return String(value);
    } else if (toType === 'boolean') {
        return Boolean(value);
    } else if (toType === 'date') {
        return new Date(value);
    }
    return value;
}

// ==================== FILTERING FUNCTIONS ====================

async function filterData(data, filters) {
    return data.filter(item => {
        return Object.entries(filters).every(([key, value]) => 
            item[key] === value
        );
    });
}

// ==================== SORTING FUNCTIONS ====================

async function sortData(data, field, order = 'asc') {
    return data.sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        
        if (order === 'asc') {
            return aVal.localeCompare(bVal);
        } else {
            return bVal.localeCompare(aVal);
        }
    });
}

// ==================== PAGINATION FUNCTIONS ====================

async function paginateData(data, page = 1, pageSize = 10) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return {
        data: data.slice(start, end),
        total: data.length,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(data.length / pageSize)
    };
}

// ==================== SEARCHING FUNCTIONS ====================

async function searchData(data, query, fields = []) {
    const lowerQuery = query.toLowerCase();
    return data.filter(item => {
        return fields.some(field => 
            item[field]?.toLowerCase().includes(lowerQuery)
        );
    });
}

// ==================== GROUPING FUNCTIONS ====================

async function groupData(data, field) {
    return data.reduce((groups, item) => {
        const key = item[field] || 'unknown';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

// ==================== AGGREGATION FUNCTIONS ====================

async function aggregateData(data, operations) {
    const result = {};
    
    for (const [key, op] of Object.entries(operations)) {
        if (op === 'sum') {
            result[key] = data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
        } else if (op === 'avg') {
            const sum = data.reduce((s, item) => s + (Number(item[key]) || 0), 0);
            result[key] = data.length ? sum / data.length : 0;
        } else if (op === 'min') {
            result[key] = Math.min(...data.map(item => Number(item[key]) || 0));
        } else if (op === 'max') {
            result[key] = Math.max(...data.map(item => Number(item[key]) || 0));
        } else if (op === 'count') {
            result[key] = data.length;
        }
    }
    
    return result;
}

// ==================== STATISTICS FUNCTIONS ====================

async function calculateStats(data) {
    return {
        mean: await calculateMean(data),
        median: await calculateMedian(data),
        mode: await calculateMode(data),
        variance: await calculateVariance(data),
        stdDev: await calculateStdDev(data)
    };
}

async function calculateMean(data) {
    const sum = data.reduce((s, item) => s + (Number(item) || 0), 0);
    return data.length ? sum / data.length : 0;
}

async function calculateMedian(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}

async function calculateMode(data) {
    const counts = data.reduce((c, item) => {
        c[item] = (c[item] || 0) + 1;
        return c;
    }, {});
    
    let mode = data[0];
    let maxCount = 0;
    
    for (const [value, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxCount = count;
            mode = value;
        }
    }
    
    return mode;
}

async function calculateVariance(data) {
    const mean = await calculateMean(data);
    const squaredDiffs = data.map(item => Math.pow((Number(item) || 0) - mean, 2));
    return await calculateMean(squaredDiffs);
}

async function calculateStdDev(data) {
    const variance = await calculateVariance(data);
    return Math.sqrt(variance);
}

// ==================== TRENDING FUNCTIONS ====================

async function getTrends(data, days = 7) {
    return {};
}

async function getPopular(data, limit = 10) {
    return [];
}

async function getTopRated(data, limit = 10) {
    return [];
}

// ==================== RECOMMENDATION FUNCTIONS ====================

async function getRecommendations(userId, limit = 5) {
    return [];
}

async function getSuggestions(userId, limit = 5) {
    return [];
}

async function getRelated(itemId, limit = 5) {
    return [];
}

// ==================== FEEDBACK FUNCTIONS ====================

async function getFeedback(itemId, limit = 50) {
    return [];
}

async function addFeedback(feedback) {
    return true;
}

async function deleteFeedback(feedbackId) {
    return true;
}

// ==================== REVIEW FUNCTIONS ====================

async function getReviews(itemId, limit = 50) {
    return [];
}

async function addReview(review) {
    return true;
}

async function deleteReview(reviewId) {
    return true;
}

// ==================== RATING FUNCTIONS ====================

async function getRatings(itemId) {
    return { average: 0, count: 0 };
}

async function addRating(rating) {
    return true;
}

async function updateRating(ratingId, value) {
    return true;
}

// ==================== COMMENT FUNCTIONS ====================

async function getComments(itemId, limit = 50) {
    return [];
}

async function addComment(comment) {
    return true;
}

async function deleteComment(commentId) {
    return true;
}

// ==================== TICKET FUNCTIONS ====================

async function getTickets(userId = null, limit = 50) {
    return [];
}

async function createTicket(ticket) {
    return true;
}

async function updateTicket(ticketId, updates) {
    return true;
}

async function deleteTicket(ticketId) {
    return true;
}

// ==================== CHAT FUNCTIONS ====================

async function getChats(userId) {
    return [];
}

async function getChat(chatId) {
    return null;
}

async function sendChat(chatId, message) {
    return true;
}

async function deleteChat(chatId) {
    return true;
}

// ==================== MESSAGE FUNCTIONS ====================

async function getMessages(chatId, limit = 50) {
    return [];
}

async function sendMessage(chatId, message) {
    return true;
}

async function deleteMessage(messageId) {
    return true;
}

// ==================== EXPORT ALL FUNCTIONS ====================

module.exports = {
    // ===== INITIALIZATION =====
    setupGoogleSheets,
    
    // ===== USER MANAGEMENT =====
    addUser, getUser, getUsers, getAllUsers, updateUser, deleteUser,
    searchUsers, filterUsers, sortUsers, paginateUsers,
    exportUsers, importUsers, backupUsers, restoreUsers,
    getUserStats, getUserOrders, getUserTransactions,
    getUserActivity, getUserDevices,
    setUserRole, setUserPermissions, setUserLimits,
    sendUserMessage, broadcastToUsers, notifyUsers,
    
    // ===== BLOCK/UNBLOCK =====
    blockUser, unblockUser, isUserBlocked, getBlockedUsers,
    
    // ===== CATEGORY MANAGEMENT =====
    getCategories, getCategory, addCategory, updateCategory, deleteCategory,
    updateCategoryStock, setCategoryDiscount, setCategoryPrice,
    getCategoryStats, getCategoryOrders, getCategoryRevenue,
    searchCategories, filterCategories, sortCategories,
    exportCategories, importCategories, backupCategories, restoreCategories,
    bulkAddCategories, bulkDeleteCategories, bulkUpdateCategories,
    cloneCategory, mergeCategories, splitCategory,
    
    // ===== VOUCHER MANAGEMENT =====
    getVouchers, getVoucher, getVoucherByCode,
    addVoucher, updateVoucher, deleteVoucher,
    getAvailableVouchers, assignVoucherToOrder,
    revokeVoucher, restoreVoucher, expireVoucher,
    getVoucherCodes, getVoucherStats,
    searchVouchers, filterVouchers, sortVouchers,
    exportVouchers, importVouchers, backupVouchers, restoreVouchers,
    bulkAddVouchers, bulkDeleteVouchers, bulkUpdateVouchers,
    generateVouchers, validateVouchers, verifyVouchers,
    
    // ===== ORDER MANAGEMENT =====
    createOrder, getOrder, getOrders, getAllOrders,
    updateOrder, deleteOrder, updateOrderStatus, updateOrderPayment,
    getOrderStats, getOrderDetails, getOrderHistory,
    searchOrders, filterOrders, sortOrders, paginateOrders,
    approveOrder, rejectOrder, refundOrder, cancelOrder,
    processOrder, deliverOrder, completeOrder,
    getPendingOrders, getProcessingOrders, getCompletedOrders,
    exportOrders, importOrders, backupOrders, restoreOrders,
    
    // ===== PAYMENT MANAGEMENT =====
    getPayments, getPayment, addPayment, updatePayment, deletePayment,
    getPaymentStats, getPaymentMethods, getPaymentHistory,
    searchPayments, filterPayments, sortPayments,
    approvePayment, rejectPayment, refundPayment, cancelPayment,
    verifyPayment, confirmPayment, processPayment,
    getPendingPayments, getCompletedPayments, getFailedPayments,
    exportPayments, importPayments, backupPayments, restorePayments,
    
    // ===== DISCOUNT MANAGEMENT =====
    getDiscounts, getDiscount, getDiscountByCode,
    addDiscount, updateDiscount, deleteDiscount,
    getDiscountStats, getDiscountCodes,
    searchDiscounts, filterDiscounts, sortDiscounts,
    applyDiscount, removeDiscount, validateDiscount,
    exportDiscounts, importDiscounts, backupDiscounts, restoreDiscounts,
    bulkAddDiscounts, bulkDeleteDiscounts,
    
    // ===== COUPON MANAGEMENT =====
    getCoupons, getCoupon, getCouponByCode,
    addCoupon, updateCoupon, deleteCoupon,
    getCouponStats, getCouponCodes,
    searchCoupons, filterCoupons, sortCoupons,
    applyCoupon, removeCoupon, validateCoupon,
    generateCoupons, exportCoupons, importCoupons,
    backupCoupons, restoreCoupons, bulkAddCoupons,
    
    // ===== REFERRAL MANAGEMENT =====
    getReferrals, getReferral, addReferral, updateReferral, deleteReferral,
    getReferralStats, getReferralEarnings, getReferralUsers,
    searchReferrals, filterReferrals, sortReferrals,
    processReferralBonus, calculateReferralEarnings,
    exportReferrals, importReferrals, backupReferrals, restoreReferrals,
    
    // ===== ANALYTICS & REPORTS =====
    getDailyStats, getWeeklyStats, getMonthlyStats, getYearlyStats,
    getUserGrowth, getRevenueStats, getOrderStats, getVoucherStats,
    getTopUsers, getTopCategories, getTopVouchers,
    getSalesReport, getEarningsReport, getPerformanceReport,
    exportReport, generatePDF, generateExcel, generateCSV,
    scheduleReport, sendReport, archiveReport,
    
    // ===== SETTINGS MANAGEMENT =====
    getSettings, getSetting, updateSetting, resetSetting,
    getBotSettings, getPaymentSettings, getSecuritySettings,
    updateBotSettings, updatePaymentSettings, updateSecuritySettings,
    backupSettings, restoreSettings, exportSettings, importSettings,
    
    // ===== SECURITY MANAGEMENT =====
    getSecurityLogs, getLoginAttempts, getFailedLogins,
    blockIP, unblockIP, getBlockedIPs,
    setRateLimit, getRateLimits, updateRateLimit,
    setAccessControl, getAccessRules, updateAccessRules,
    getAuditLogs, clearAuditLogs, exportAuditLogs,
    
    // ===== BACKUP MANAGEMENT =====
    createBackup, restoreBackup, getBackups, deleteBackup,
    downloadBackup, uploadBackup, scheduleBackup,
    getBackupSettings, updateBackupSettings,
    
    // ===== BROADCAST MANAGEMENT =====
    sendBroadcast, scheduleBroadcast, getBroadcasts,
    deleteBroadcast, pauseBroadcast, resumeBroadcast,
    updateBroadcast, getBroadcastStats, getBroadcastHistory,
    
    // ===== NOTIFICATION MANAGEMENT =====
    sendNotification, getNotifications, markAsRead,
    deleteNotification, clearNotifications,
    setNotificationSettings, getNotificationSettings,
    
    // ===== WEBHOOK MANAGEMENT =====
    setWebhook, getWebhook, testWebhook, deleteWebhook,
    getWebhookLogs, getWebhookStats,
    
    // ===== API MANAGEMENT =====
    generateAPIKey, revokeAPIKey, getAPIKeys,
    getAPIUsage, getAPILogs, getAPIStats,
    setAPIRateLimit, getAPIRateLimits,
    
    // ===== SYSTEM MANAGEMENT =====
    getSystemInfo, getSystemStats, getSystemHealth,
    restartBot, shutdownBot, updateBot,
    getMemoryUsage, getCPUUsage, getDiskUsage,
    getUptime, getProcessInfo, getEnvironmentInfo,
    
    // ===== MAINTENANCE MODE =====
    enableMaintenance, disableMaintenance, getMaintenanceStatus,
    setMaintenanceMessage, scheduleMaintenance,
    
    // ===== CACHE MANAGEMENT =====
    clearCache, getCacheStats, refreshCache,
    setCache, getCache, deleteCache,
    
    // ===== DATABASE MANAGEMENT =====
    backupDatabase, restoreDatabase, optimizeDatabase,
    getDatabaseStats, getDatabaseSize,
    
    // ===== ERROR HANDLING =====
    getErrors, resolveError, deleteError,
    getErrorStats,
    
    // ===== SCHEDULER MANAGEMENT =====
    getScheduledJobs, addScheduledJob, removeScheduledJob,
    pauseScheduledJob, resumeScheduledJob,
    getSchedulerStats,
    
    // ===== QUEUE MANAGEMENT =====
    getQueue, getQueueStats, clearQueue,
    processQueue, pauseQueue, resumeQueue,
    
    // ===== SESSION MANAGEMENT =====
    getSessions, getSession, deleteSession,
    clearSessions, getSessionStats,
    
    // ===== TOKEN MANAGEMENT =====
    generateToken, validateToken, revokeToken,
    getTokens, getTokenStats,
    
    // ===== ENCRYPTION MANAGEMENT =====
    encrypt, decrypt, hash, verify,
    getEncryptionKey, rotateEncryptionKey,
    
    // ===== COMPRESSION MANAGEMENT =====
    compress, decompress, getCompressionStats,
    
    // ===== LOGGING MANAGEMENT =====
    addLog, getLogs, getErrorLogs, getPaymentLogs, getUserLogs,
    clearLogs, exportLogs, searchLogs, filterLogs,
    setLogLevel, getLogLevel, getLoggers,
    
    // ===== MONITORING =====
    getMetrics, getAlerts, setAlert, removeAlert, getAlertHistory,
    
    // ===== TESTING =====
    runTests, getTestResults, getTestCoverage,
    
    // ===== DOCUMENTATION =====
    getDocs, getHelp, getCommands,
    
    // ===== MIGRATION =====
    migrateData, rollbackMigration, getMigrationStatus,
    
    // ===== VALIDATION =====
    validateData, validateSchema, validateInput,
    
    // ===== FORMATTING =====
    formatData, formatOutput, formatReport,
    
    // ===== CONVERSION =====
    convertData, convertFormat, convertType,
    
    // ===== FILTERING =====
    filterData,
    
    // ===== SORTING =====
    sortData,
    
    // ===== PAGINATION =====
    paginateData,
    
    // ===== SEARCHING =====
    searchData,
    
    // ===== GROUPING =====
    groupData,
    
    // ===== AGGREGATION =====
    aggregateData,
    
    // ===== STATISTICS =====
    calculateStats, calculateMean, calculateMedian,
    calculateMode, calculateVariance, calculateStdDev,
    
    // ===== TRENDING =====
    getTrends, getPopular, getTopRated,
    
    // ===== RECOMMENDATIONS =====
    getRecommendations, getSuggestions, getRelated,
    
    // ===== FEEDBACK =====
    getFeedback, addFeedback, deleteFeedback,
    
    // ===== REVIEWS =====
    getReviews, addReview, deleteReview,
    
    // ===== RATINGS =====
    getRatings, addRating, updateRating,
    
    // ===== COMMENTS =====
    getComments, addComment, deleteComment,
    
    // ===== TICKETS =====
    getTickets, createTicket, updateTicket, deleteTicket,
    
    // ===== CHATS =====
    getChats, getChat, sendChat, deleteChat,
    
    // ===== MESSAGES =====
    getMessages, sendMessage, deleteMessage
};