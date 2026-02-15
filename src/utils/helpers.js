const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const constants = require('./constants');

const helpers = {
    // Generate Order ID
    generateOrderId: () => {
        const prefix = constants.ORDER_PREFIX;
        const date = moment().format('YYYYMMDD');
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `${prefix}-${date}-${random}`;
    },
    
    // Generate Voucher ID
    generateVoucherId: () => {
        const prefix = constants.VOUCHER_PREFIX;
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    },
    
    // Format Currency
    formatCurrency: (amount, currency = 'INR') => {
        const symbol = constants.CURRENCY_SYMBOLS[currency] || '₹';
        return `${symbol}${amount.toFixed(2)}`;
    },
    
    // Format Date
    formatDate: (date, format = 'DD/MM/YYYY') => {
        return moment(date).format(format);
    },
    
    // Format Time
    formatTime: (date, format = 'HH:mm') => {
        return moment(date).format(format);
    },
    
    // Format DateTime
    formatDateTime: (date) => {
        return moment(date).format('DD/MM/YYYY HH:mm');
    },
    
    // Calculate Total
    calculateTotal: (price, quantity, tax = 0, discount = 0) => {
        let total = price * quantity;
        
        // Apply discount
        if (typeof discount === 'number') {
            total -= discount;
        } else if (typeof discount === 'object') {
            if (discount.type === 'percentage') {
                total -= (total * discount.value / 100);
            } else {
                total -= discount.value;
            }
        }
        
        // Apply tax
        if (typeof tax === 'number') {
            total += (total * tax / 100);
        } else if (typeof tax === 'object') {
            if (tax.type === 'percentage') {
                total += (total * tax.value / 100);
            } else {
                total += tax.value;
            }
        }
        
        return Math.max(0, total);
    },
    
    // Validate Email
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Validate Phone
    validatePhone: (phone) => {
        const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
        return re.test(phone);
    },
    
    // Validate UTR
    validateUTR: (utr) => {
        const re = /^[A-Za-z0-9]{6,20}$/;
        return re.test(utr);
    },
    
    // Validate Order ID
    validateOrderId: (orderId) => {
        const re = /^SVH-\d{8}-[A-Z0-9]{6}$/;
        return re.test(orderId);
    },
    
    // Parse Amount
    parseAmount: (amount) => {
        if (typeof amount === 'string') {
            amount = amount.replace(/[^0-9.-]+/g, '');
        }
        return parseFloat(amount) || 0;
    },
    
    // Truncate Text
    truncateText: (text, length = 50) => {
        if (text.length <= length) return text;
        return text.substr(0, length) + '...';
    },
    
    // Escape Markdown
    escapeMarkdown: (text) => {
        return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
    },
    
    // Generate Random String
    randomString: (length = 10) => {
        return Math.random().toString(36).substr(2, length).toUpperCase();
    },
    
    // Generate Captcha Text
    generateCaptchaText: (type = 'mixed') => {
        const mathTypes = ['+', '-', '×'];
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        
        if (type === 'math') {
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            const operator = mathTypes[Math.floor(Math.random() * mathTypes.length)];
            
            let answer;
            switch(operator) {
                case '+': answer = num1 + num2; break;
                case '-': answer = num1 - num2; break;
                case '×': answer = num1 * num2; break;
            }
            
            return {
                text: `${num1} ${operator} ${num2} = ?`,
                answer: answer.toString()
            };
        } else {
            let text = '';
            for (let i = 0; i < 6; i++) {
                text += chars[Math.floor(Math.random() * chars.length)];
            }
            return {
                text: text,
                answer: text
            };
        }
    },
    
    // Paginate Array
    paginateArray: (array, page = 1, limit = 10) => {
        const start = (page - 1) * limit;
        const end = page * limit;
        return {
            data: array.slice(start, end),
            total: array.length,
            page: page,
            totalPages: Math.ceil(array.length / limit),
            hasNext: end < array.length,
            hasPrev: page > 1
        };
    },
    
    // Sort Array
    sortArray: (array, field, order = 'asc') => {
        return array.sort((a, b) => {
            if (order === 'asc') {
                return a[field] > b[field] ? 1 : -1;
            } else {
                return a[field] < b[field] ? 1 : -1;
            }
        });
    },
    
    // Filter Array
    filterArray: (array, filters) => {
        return array.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                if (item[key] !== value) return false;
            }
            return true;
        });
    },
    
    // Group Array
    groupArray: (array, key) => {
        return array.reduce((group, item) => {
            const value = item[key];
            group[value] = group[value] || [];
            group[value].push(item);
            return group;
        }, {});
    },
    
    // Calculate Percentage
    calculatePercentage: (value, total) => {
        if (total === 0) return 0;
        return (value / total * 100).toFixed(2);
    },
    
    // Calculate Average
    calculateAverage: (array) => {
        if (array.length === 0) return 0;
        const sum = array.reduce((a, b) => a + b, 0);
        return sum / array.length;
    },
    
    // Get Time Difference
    getTimeDifference: (date1, date2, unit = 'hours') => {
        const diff = Math.abs(date1 - date2);
        const units = {
            seconds: diff / 1000,
            minutes: diff / (1000 * 60),
            hours: diff / (1000 * 60 * 60),
            days: diff / (1000 * 60 * 60 * 24)
        };
        return units[unit] || diff;
    },
    
    // Check if Expired
    isExpired: (date) => {
        return new Date() > new Date(date);
    },
    
    // Get Expiry Status
    getExpiryStatus: (date) => {
        const now = new Date();
        const expiry = new Date(date);
        const diff = expiry - now;
        
        if (diff < 0) return 'expired';
        if (diff < constants.TIME.HOUR) return 'expiring_soon';
        if (diff < constants.TIME.DAY) return 'near_expiry';
        return 'valid';
    },
    
    // Mask String
    maskString: (str, visibleChars = 4) => {
        if (str.length <= visibleChars) return str;
        const masked = '*'.repeat(str.length - visibleChars);
        return str.substr(0, visibleChars) + masked;
    },
    
    // Extract Numbers from String
    extractNumbers: (str) => {
        return str.replace(/\D/g, '');
    },
    
    // Extract UPI ID
    extractUPI: (str) => {
        const re = /[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}/;
        const match = str.match(re);
        return match ? match[0] : null;
    },
    
    // Format File Size
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Get File Extension
    getFileExtension: (filename) => {
        return filename.split('.').pop().toLowerCase();
    },
    
    // Check File Type
    checkFileType: (filename, type) => {
        const ext = helpers.getFileExtension(filename);
        return constants.FILE_TYPES[type.toUpperCase()]?.includes(ext) || false;
    },
    
    // Sleep
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Retry Function
    retry: async (fn, maxAttempts = 3, delay = 1000) => {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxAttempts - 1) throw error;
                await helpers.sleep(delay * Math.pow(2, i));
            }
        }
    },
    
    // Parse Command
    parseCommand: (text) => {
        if (!text || !text.startsWith('/')) return null;
        const parts = text.split(' ');
        return {
            command: parts[0].toLowerCase(),
            args: parts.slice(1)
        };
    },
    
    // Parse Callback Data
    parseCallbackData: (data) => {
        const parts = data.split('_');
        return {
            action: parts[0],
            type: parts[1],
            id: parts.slice(2).join('_')
        };
    },
    
    // Create Keyboard Row
    createKeyboardRow: (buttons) => {
        return buttons.map(btn => ({
            text: btn.text,
            callback_data: btn.callback || btn.text.toLowerCase().replace(/\s+/g, '_')
        }));
    },
    
    // Split Array into Chunks
    chunkArray: (array, size) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },
    
    // Merge Objects
    mergeObjects: (target, source) => {
        return { ...target, ...source };
    },
    
    // Deep Clone
    deepClone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // Compare Objects
    compareObjects: (obj1, obj2) => {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    },
    
    // Generate UUID
    generateUUID: () => {
        return uuidv4();
    },
    
    // Get Time Range
    getTimeRange: (range = 'today') => {
        const now = moment();
        let start, end;
        
        switch(range) {
            case 'today':
                start = now.startOf('day');
                end = now.endOf('day');
                break;
            case 'yesterday':
                start = now.subtract(1, 'day').startOf('day');
                end = now.subtract(1, 'day').endOf('day');
                break;
            case 'week':
                start = now.startOf('week');
                end = now.endOf('week');
                break;
            case 'month':
                start = now.startOf('month');
                end = now.endOf('month');
                break;
            case 'year':
                start = now.startOf('year');
                end = now.endOf('year');
                break;
            default:
                return null;
        }
        
        return {
            start: start.toDate(),
            end: end.toDate()
        };
    },
    
    // Log Message
    logMessage: (level, message, data = {}) => {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
    },
    
    // Validate Settings
    validateSettings: (settings) => {
        const errors = [];
        
        // Validate numeric settings
        if (settings.recovery_hours && isNaN(settings.recovery_hours)) {
            errors.push('recovery_hours must be a number');
        }
        
        if (settings.max_quantity && (isNaN(settings.max_quantity) || settings.max_quantity < 1)) {
            errors.push('max_quantity must be a positive number');
        }
        
        // Validate email
        if (settings.alert_email && !helpers.validateEmail(settings.alert_email)) {
            errors.push('Invalid alert email');
        }
        
        // Validate phone
        if (settings.alert_phone && !helpers.validatePhone(settings.alert_phone)) {
            errors.push('Invalid alert phone');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
};

module.exports = helpers;
