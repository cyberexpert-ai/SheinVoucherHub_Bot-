/**
 * Pricing Calculator for Shein Vouchers
 * Complete price tables for all categories based on provided data
 */

const PRICING_TABLES = {
  // ₹500 Category - Complete 1-100 pricing
  500: {
    1: 49, 2: 98, 3: 147, 4: 196, 5: 249,
    6: 298, 7: 347, 8: 396, 9: 445, 10: 498,
    11: 547, 12: 596, 13: 645, 14: 694, 15: 747,
    16: 796, 17: 845, 18: 894, 19: 943, 20: 996,
    21: 1045, 22: 1094, 23: 1143, 24: 1192, 25: 1245,
    26: 1294, 27: 1343, 28: 1392, 29: 1441, 30: 1494,
    31: 1543, 32: 1592, 33: 1641, 34: 1690, 35: 1743,
    36: 1792, 37: 1841, 38: 1890, 39: 1939, 40: 1992,
    41: 2041, 42: 2090, 43: 2139, 44: 2188, 45: 2241,
    46: 2290, 47: 2339, 48: 2388, 49: 2437, 50: 2490,
    51: 2539, 52: 2588, 53: 2637, 54: 2686, 55: 2739,
    56: 2788, 57: 2837, 58: 2886, 59: 2935, 60: 2988,
    61: 3037, 62: 3086, 63: 3135, 64: 3184, 65: 3237,
    66: 3286, 67: 3335, 68: 3384, 69: 3433, 70: 3486,
    71: 3535, 72: 3584, 73: 3633, 74: 3682, 75: 3735,
    76: 3784, 77: 3833, 78: 3882, 79: 3931, 80: 3984,
    81: 4033, 82: 4082, 83: 4131, 84: 4180, 85: 4233,
    86: 4282, 87: 4331, 88: 4380, 89: 4429, 90: 4482,
    91: 4531, 92: 4580, 93: 4629, 94: 4678, 95: 4731,
    96: 4780, 97: 4829, 98: 4878, 99: 4927, 100: 4980
  },
  
  // ₹1000 Category - Complete 1-100 pricing
  1000: {
    1: 99, 2: 198, 3: 297, 4: 396, 5: 499,
    6: 598, 7: 697, 8: 796, 9: 895, 10: 998,
    11: 1097, 12: 1196, 13: 1295, 14: 1394, 15: 1497,
    16: 1596, 17: 1695, 18: 1794, 19: 1893, 20: 1996,
    21: 2095, 22: 2194, 23: 2293, 24: 2392, 25: 2495,
    26: 2594, 27: 2693, 28: 2792, 29: 2891, 30: 2994,
    31: 3093, 32: 3192, 33: 3291, 34: 3390, 35: 3493,
    36: 3592, 37: 3691, 38: 3790, 39: 3889, 40: 3992,
    41: 4091, 42: 4190, 43: 4289, 44: 4388, 45: 4491,
    46: 4590, 47: 4689, 48: 4788, 49: 4887, 50: 4990,
    51: 5089, 52: 5188, 53: 5287, 54: 5386, 55: 5489,
    56: 5588, 57: 5687, 58: 5786, 59: 5885, 60: 5988,
    61: 6087, 62: 6186, 63: 6285, 64: 6384, 65: 6487,
    66: 6586, 67: 6685, 68: 6784, 69: 6883, 70: 6986,
    71: 7085, 72: 7184, 73: 7283, 74: 7382, 75: 7485,
    76: 7584, 77: 7683, 78: 7782, 79: 7881, 80: 7984,
    81: 8083, 82: 8182, 83: 8281, 84: 8380, 85: 8483,
    86: 8582, 87: 8681, 88: 8780, 89: 8879, 90: 8982,
    91: 9081, 92: 9180, 93: 9279, 94: 9378, 95: 9481,
    96: 9580, 97: 9679, 98: 9778, 99: 9877, 100: 9980
  },
  
  // ₹2000 Category - Complete 1-100 pricing
  2000: {
    1: 199, 2: 398, 3: 597, 4: 796, 5: 999,
    6: 1198, 7: 1397, 8: 1596, 9: 1795, 10: 1998,
    11: 2197, 12: 2396, 13: 2595, 14: 2794, 15: 2997,
    16: 3196, 17: 3395, 18: 3594, 19: 3793, 20: 3996,
    21: 4195, 22: 4394, 23: 4593, 24: 4792, 25: 4995,
    26: 5194, 27: 5393, 28: 5592, 29: 5791, 30: 5994,
    31: 6193, 32: 6392, 33: 6591, 34: 6790, 35: 6993,
    36: 7192, 37: 7391, 38: 7590, 39: 7789, 40: 7992,
    41: 8191, 42: 8390, 43: 8589, 44: 8788, 45: 8991,
    46: 9190, 47: 9389, 48: 9588, 49: 9787, 50: 9990,
    51: 10189, 52: 10388, 53: 10587, 54: 10786, 55: 10989,
    56: 11188, 57: 11387, 58: 11586, 59: 11785, 60: 11988,
    61: 12187, 62: 12386, 63: 12585, 64: 12784, 65: 12987,
    66: 13186, 67: 13385, 68: 13584, 69: 13783, 70: 13986,
    71: 14185, 72: 14384, 73: 14583, 74: 14782, 75: 14985,
    76: 15184, 77: 15383, 78: 15582, 79: 15781, 80: 15984,
    81: 16183, 82: 16382, 83: 16581, 84: 16780, 85: 16983,
    86: 17182, 87: 17381, 88: 17580, 89: 17779, 90: 17982,
    91: 18181, 92: 18380, 93: 18579, 94: 18778, 95: 18981,
    96: 19180, 97: 19379, 98: 19578, 99: 19777, 100: 19980
  },
  
  // ₹4000 Category - Complete 1-100 pricing
  4000: {
    1: 299, 2: 598, 3: 897, 4: 1196, 5: 1499,
    6: 1798, 7: 2097, 8: 2396, 9: 2695, 10: 2998,
    11: 3297, 12: 3596, 13: 3895, 14: 4194, 15: 4497,
    16: 4796, 17: 5095, 18: 5394, 19: 5693, 20: 5996,
    21: 6295, 22: 6594, 23: 6893, 24: 7192, 25: 7495,
    26: 7794, 27: 8093, 28: 8392, 29: 8691, 30: 8994,
    31: 9293, 32: 9592, 33: 9891, 34: 10190, 35: 10493,
    36: 10792, 37: 11091, 38: 11390, 39: 11689, 40: 11992,
    41: 12291, 42: 12590, 43: 12889, 44: 13188, 45: 13491,
    46: 13790, 47: 14089, 48: 14388, 49: 14687, 50: 14990,
    51: 15289, 52: 15588, 53: 15887, 54: 16186, 55: 16489,
    56: 16788, 57: 17087, 58: 17386, 59: 17685, 60: 17988,
    61: 18287, 62: 18586, 63: 18885, 64: 19184, 65: 19487,
    66: 19786, 67: 20085, 68: 20384, 69: 20683, 70: 20986,
    71: 21285, 72: 21584, 73: 21883, 74: 22182, 75: 22485,
    76: 22784, 77: 23083, 78: 23382, 79: 23681, 80: 23984,
    81: 24283, 82: 24582, 83: 24881, 84: 25180, 85: 25483,
    86: 25782, 87: 26081, 88: 26380, 89: 26679, 90: 26982,
    91: 27281, 92: 27580, 93: 27879, 94: 28178, 95: 28481,
    96: 28780, 97: 29079, 98: 29378, 99: 29677, 100: 29980
  }
};

class PricingManager {
  /**
   * Get price for specific category and quantity
   * @param {number|string} category - Category value (500, 1000, etc)
   * @param {number} quantity - Quantity wanted (1-100)
   * @returns {number} Price in rupees
   */
  static getPrice(category, quantity) {
    const categoryNum = parseInt(category);
    const table = PRICING_TABLES[categoryNum];
    
    if (!table) {
      throw new Error(`Invalid category: ${category}`);
    }
    
    // If exact quantity exists in table
    if (table[quantity]) {
      return table[quantity];
    }
    
    // Calculate price for quantities not in table using base rate
    return this.calculatePrice(categoryNum, quantity);
  }

  /**
   * Calculate price based on base rate and bulk discount
   * @param {number} category - Category value
   * @param {number} quantity - Quantity wanted
   * @returns {number} Calculated price
   */
  static calculatePrice(category, quantity) {
    const basePrice = this.getBasePrice(category);
    
    // Apply bulk discount based on quantity
    if (quantity >= 50) {
      return Math.round(basePrice * quantity * 0.85); // 15% off for 50+
    } else if (quantity >= 20) {
      return Math.round(basePrice * quantity * 0.9); // 10% off for 20+
    } else if (quantity >= 10) {
      return Math.round(basePrice * quantity * 0.95); // 5% off for 10+
    }
    
    return basePrice * quantity;
  }

  /**
   * Get base price (price for 1 quantity)
   * @param {number} category - Category value
   * @returns {number} Base price
   */
  static getBasePrice(category) {
    const categoryNum = parseInt(category);
    const table = PRICING_TABLES[categoryNum];
    return table ? table[1] : null;
  }

  /**
   * Get all prices for a category
   * @param {number} category - Category value
   * @returns {Object} Price table
   */
  static getAllPrices(category) {
    const categoryNum = parseInt(category);
    return PRICING_TABLES[categoryNum] || null;
  }

  /**
   * Validate if quantity is available in stock
   * @param {number} category - Category value
   * @param {number} quantity - Quantity wanted
   * @param {number} stock - Available stock
   * @returns {Object} Validation result
   */
  static validateQuantity(category, quantity, stock) {
    if (quantity < 1) {
      return { valid: false, message: '❌ Minimum quantity is 1' };
    }
    
    if (quantity > 100) {
      return { valid: false, message: '❌ Maximum quantity is 100' };
    }
    
    if (quantity > stock) {
      return { valid: false, message: `❌ Only ${stock} codes available` };
    }
    
    return { valid: true };
  }

  /**
   * Format price with currency symbol
   * @param {number} price - Price in rupees
   * @returns {string} Formatted price
   */
  static formatPrice(price) {
    return `₹${price}`;
  }

  /**
   * Calculate total for multiple items
   * @param {Array<number>} prices - Array of prices
   * @returns {number} Total price
   */
  static calculateTotal(prices) {
    return prices.reduce((sum, price) => sum + price, 0);
  }

  /**
   * Get discount percentage for quantity
   * @param {number} quantity - Quantity
   * @returns {number} Discount percentage
   */
  static getDiscountPercent(quantity) {
    if (quantity >= 50) return 15;
    if (quantity >= 20) return 10;
    if (quantity >= 10) return 5;
    return 0;
  }

  /**
   * Get price breakdown with details
   * @param {number} category - Category value
   * @param {number} quantity - Quantity
   * @returns {Object} Price breakdown
   */
  static getPriceBreakdown(category, quantity) {
    const basePrice = this.getBasePrice(category);
    const totalPrice = this.getPrice(category, quantity);
    const discount = this.getDiscountPercent(quantity);
    const savedAmount = (basePrice * quantity) - totalPrice;
    
    return {
      basePrice,
      quantity,
      totalPrice,
      discount,
      savedAmount,
      pricePerUnit: Math.round(totalPrice / quantity),
      originalTotal: basePrice * quantity
    };
  }

  /**
   * Update price for custom quantity
   * @param {number} category - Category value
   * @param {number} quantity - Quantity
   * @param {number} price - New price
   * @returns {boolean} Success status
   */
  static updatePrice(category, quantity, price) {
    const categoryNum = parseInt(category);
    if (!PRICING_TABLES[categoryNum]) {
      PRICING_TABLES[categoryNum] = {};
    }
    PRICING_TABLES[categoryNum][quantity] = price;
    return true;
  }

  /**
   * Get all available categories
   * @returns {Array<number>} Array of category values
   */
  static getCategories() {
    return Object.keys(PRICING_TABLES).map(key => parseInt(key));
  }

  /**
   * Check if price exists for quantity
   * @param {number} category - Category value
   * @param {number} quantity - Quantity
   * @returns {boolean} True if price exists
   */
  static hasPrice(category, quantity) {
    const categoryNum = parseInt(category);
    return PRICING_TABLES[categoryNum] && PRICING_TABLES[categoryNum][quantity] !== undefined;
  }

  /**
   * Get min and max price for category
   * @param {number} category - Category value
   * @returns {Object} Min and max prices
   */
  static getPriceRange(category) {
    const prices = Object.values(PRICING_TABLES[parseInt(category)] || {});
    if (prices.length === 0) return null;
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  /**
   * Get price suggestion for quantity
   * @param {number} category - Category value
   * @param {number} quantity - Quantity
   * @returns {number} Suggested price
   */
  static getSuggestedPrice(category, quantity) {
    const basePrice = this.getBasePrice(category);
    return Math.round(basePrice * quantity * 0.95); // 5% discount suggestion
  }

  /**
   * Validate if price is reasonable
   * @param {number} category - Category value
   * @param {number} quantity - Quantity
   * @param {number} price - Price to validate
   * @returns {Object} Validation result
   */
  static validatePrice(category, quantity, price) {
    const basePrice = this.getBasePrice(category);
    const minPrice = Math.round(basePrice * quantity * 0.7); // 30% minimum
    const maxPrice = basePrice * quantity; // Maximum (no discount)
    
    if (price < minPrice) {
      return { valid: false, message: `❌ Price too low. Minimum: ₹${minPrice}` };
    }
    
    if (price > maxPrice) {
      return { valid: false, message: `❌ Price too high. Maximum: ₹${maxPrice}` };
    }
    
    return { valid: true };
  }

  /**
   * Get bulk price for quantity
   * @param {number} category - Category value
   * @param {number} quantity - Quantity
   * @returns {number} Bulk price
   */
  static getBulkPrice(category, quantity) {
    const basePrice = this.getBasePrice(category);
    let multiplier = 1;
    
    if (quantity >= 100) multiplier = 0.8;  // 20% off
    else if (quantity >= 50) multiplier = 0.85; // 15% off
    else if (quantity >= 20) multiplier = 0.9;   // 10% off
    else if (quantity >= 10) multiplier = 0.95;  // 5% off
    
    return Math.round(basePrice * quantity * multiplier);
  }

  /**
   * Compare prices between categories
   * @param {number} category1 - First category
   * @param {number} category2 - Second category
   * @param {number} quantity - Quantity
   * @returns {Object} Price comparison
   */
  static comparePrices(category1, category2, quantity) {
    const price1 = this.getPrice(category1, quantity);
    const price2 = this.getPrice(category2, quantity);
    const diff = Math.abs(price1 - price2);
    const cheaper = price1 < price2 ? 'category1' : 'category2';
    
    return {
      category1: { category: category1, price: price1 },
      category2: { category: category2, price: price2 },
      difference: diff,
      cheaper: cheaper,
      savings: Math.max(price1, price2) - Math.min(price1, price2)
    };
  }

  /**
   * Get price table as formatted string
   * @param {number} category - Category value
   * @param {number} limit - Number of entries to show
   * @returns {string} Formatted price table
   */
  static getFormattedPriceTable(category, limit = 20) {
    const prices = this.getAllPrices(category);
    if (!prices) return 'No prices available';
    
    const quantities = Object.keys(prices).map(Number).sort((a, b) => a - b);
    const limited = quantities.slice(0, limit);
    
    let table = `📊 *Price Table - ₹${category}*\n\n`;
    
    // Create columns for better display
    const columns = 4;
    for (let i = 0; i < limited.length; i += columns) {
      const row = [];
      for (let j = 0; j < columns; j++) {
        if (i + j < limited.length) {
          const qty = limited[i + j];
          row.push(`Q${qty}: ₹${prices[qty]}`);
        }
      }
      table += row.join(' | ') + '\n';
    }
    
    if (quantities.length > limit) {
      table += `\n... and ${quantities.length - limit} more quantities`;
    }
    
    return table;
  }

  /**
   * Calculate price for bulk order with custom discount
   * @param {number} category - Category value
   * @param {number} quantity - Quantity
   * @param {number} customDiscount - Custom discount percentage
   * @returns {number} Discounted price
   */
  static getCustomDiscountedPrice(category, quantity, customDiscount) {
    const basePrice = this.getBasePrice(category);
    const discountMultiplier = (100 - customDiscount) / 100;
    return Math.round(basePrice * quantity * discountMultiplier);
  }

  /**
   * Get price per unit for quantity
   * @param {number} category - Category value
   * @param {number} quantity - Quantity
   * @returns {number} Price per unit
   */
  static getPricePerUnit(category, quantity) {
    const totalPrice = this.getPrice(category, quantity);
    return Math.round(totalPrice / quantity);
  }

  /**
   * Check if bulk discount applies
   * @param {number} quantity - Quantity
   * @returns {boolean} True if bulk discount applies
   */
  static hasBulkDiscount(quantity) {
    return quantity >= 10;
  }

  /**
   * Get discount amount for quantity
   * @param {number} category - Category value
   * @param {number} quantity - Quantity
   * @returns {number} Discount amount
   */
  static getDiscountAmount(category, quantity) {
    const basePrice = this.getBasePrice(category);
    const actualPrice = this.getPrice(category, quantity);
    return (basePrice * quantity) - actualPrice;
  }
}

module.exports = PricingManager;
