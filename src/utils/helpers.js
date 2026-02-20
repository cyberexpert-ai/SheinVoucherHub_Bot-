const moment = require('moment');

module.exports = {
  // Format currency
  formatCurrency(amount) {
    return `₹${amount.toFixed(2)}`;
  },
  
  // Format date
  formatDate(date) {
    return moment(date).format('DD/MM/YYYY HH:mm');
  },
  
  // Generate random string
  randomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result +=  * chars.length));
    }
    return result;
  },
  
  // Validate UTR
  validateUTR(utr) {
    const utrRegex = /^[A-Za-z0-9]{6,20}$/;
    return utrRegex.test(utr);
  },
  
  // Validate Order ID
  validateOrderId(orderId) {
    const orderRegex = /^SVH-[A-Z0-9]+-[A-Z0-9]+$/;
    return orderRegex.test(orderId);
  },
  
  // Mask sensitive data
  maskString(str, visible = 4) {
    if (!str) return '';
    if (str.length <= visible) return str;
    const masked = '*'.repeat(str.length - visible);
    return str.slice(-visible) + masked;
  },
  
  // Split array into chunks
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  // Escape Markdown
  escapeMarkdown(text) {
    if (!text) return '';
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  },
  
  // Get time remaining
  getTimeRemaining(date) {
    const now = moment();
    const end = moment(date);
    const duration = moment.duration(end.diff(now));
    
    if (duration.asSeconds() <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },
  
  // Calculate price with discount
  calculatePrice(basePrice, quantity) {
    let pricePerUnit = basePrice;
    
    if (quantity >= 20) {
      pricePerUnit = Math.round(basePrice * 0.85);
    } else if (quantity >= 10) {
      pricePerUnit = Math.round(basePrice * 0.9);
    } else if (quantity >= 5) {
      pricePerUnit = Math.round(basePrice * 0.95);
    }
    
    return pricePerUnit * quantity;
  },
  
  // Check if within time limit
  isWithinHours(date, hours) {
    const diff = moment().diff(moment(date), 'hours');
    return diff <= hours;
  },
  
  // Log action
  async logAction(ctx, action, details) {
    const adminId = process.env.ADMIN_ID;
    const logMessage = 
      `📝 *Action Log*\n\n` +
      `Action: ${action}\n` +
      `Admin: ${ctx.from.id}\n` +
      `Details: ${details}\n` +
      `Time: ${moment().format('DD/MM/YYYY HH:mm:ss')}`;
    
    try {
      await ctx.telegram.sendMessage(adminId, logMessage, { parse_mode: 'Markdown' });
    } catch (e) {
      console.error('Log error:', e);
    }
  }
};
