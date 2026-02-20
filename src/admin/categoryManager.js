const db = require('../database/database');
const { Markup } = require('telegraf');
const PricingManager = require('../utils/pricing');

class CategoryManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Show category management panel
   */
  async showPanel(ctx) {
    const categories = await db.getCategories();
    
    let message = '📦 *Category Manager*\n\n';
    
    if (categories.length === 0) {
      message += 'No categories found.';
    } else {
      categories.forEach(cat => {
        message += `• *${cat.display_name}*\n`;
        message += `  ID: \`${cat.id}\`\n`;
        message += `  Stock: ${cat.stock}\n`;
        message += `  Status: ${cat.is_active ? '✅ Active' : '❌ Inactive'}\n\n`;
      });
    }
    
    const buttons = [
      [Markup.button.callback('➕ Add Category', 'category_add')],
      [Markup.button.callback('✏️ Edit Category', 'category_edit')],
      [Markup.button.callback('🗑 Delete Category', 'category_delete')],
      [Markup.button.callback('💰 Manage Prices', 'category_prices')],
      [Markup.button.callback('🔄 Toggle Status', 'category_toggle')],
      [Markup.button.callback('📊 View All', 'category_view')],
      [Markup.button.callback('↩️ Back to Admin', 'admin_back')]
    ];
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Handle add category
   */
  async handleAdd(ctx) {
    this.sessions.set(ctx.from.id, { action: 'adding_category' });
    
    await ctx.editMessageText(
      '➕ *Add New Category*\n\n' +
      'Send category details in format:\n' +
      '`Name|Display Name|Initial Stock`\n\n' +
      'Example: `500|₹500 Shein Voucher|0`\n\n' +
      '⚠️ Name should be number (500, 1000, etc)',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', 'category_cancel')]
        ]).reply_markup
      }
    );
  }

  /**
   * Process add category input
   */
  async processAdd(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'adding_category') return false;
      
      const parts = text.split('|').map(p => p.trim());
      if (parts.length !== 3) {
        await ctx.reply('❌ Invalid format. Use: Name|Display Name|Stock');
        return true;
      }
      
      const [name, displayName, stockStr] = parts;
      const stock = parseInt(stockStr);
      
      if (isNaN(stock) || stock < 0) {
        await ctx.reply('❌ Stock must be a valid number');
        return true;
      }
      
      // Check if category exists
      const existing = await db.query('SELECT * FROM categories WHERE name = ?', [name]);
      if (existing.length > 0) {
        await ctx.reply('❌ Category with this name already exists');
        return true;
      }
      
      // Create category
      const categoryId = await db.addCategory(name, displayName);
      
      // Add initial stock as placeholder codes
      if (stock > 0) {
        const codes = [];
        for (let i = 0; i < stock; i++) {
          codes.push(`PLACEHOLDER_${name}_${i}_${Date.now()}`);
        }
        await db.addBulkVoucherCodes(categoryId, codes, ctx.from.id);
      }
      
      await ctx.reply(`✅ Category created successfully!\nID: ${categoryId}`);
      
      // Show updated panel
      await this.showPanel(ctx);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Add category error:', error);
      await ctx.reply('❌ Error creating category');
      return true;
    }
  }

  /**
   * Handle edit category
   */
  async handleEdit(ctx) {
    const categories = await db.getCategories();
    
    if (categories.length === 0) {
      await ctx.editMessageText('❌ No categories to edit');
      return;
    }
    
    const buttons = categories.map(cat => [
      Markup.button.callback(cat.display_name, `category_edit_${cat.id}`)
    ]);
    buttons.push([Markup.button.callback('❌ Cancel', 'category_cancel')]);
    
    await ctx.editMessageText(
      '✏️ *Select Category to Edit*',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      }
    );
  }

  /**
   * Show edit category form
   */
  async showEditForm(ctx, categoryId) {
    const category = await db.getCategory(categoryId);
    if (!category) {
      await ctx.editMessageText('❌ Category not found');
      return;
    }
    
    this.sessions.set(ctx.from.id, { 
      action: 'editing_category',
      categoryId 
    });
    
    await ctx.editMessageText(
      `✏️ *Edit Category: ${category.display_name}*\n\n` +
      `Current values:\n` +
      `Name: \`${category.name}\`\n` +
      `Display Name: ${category.display_name}\n` +
      `Stock: ${category.stock}\n\n` +
      `Send new values in format:\n` +
      '`Name|Display Name`\n\n' +
      'Leave empty to keep current values.',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', 'category_cancel')]
        ]).reply_markup
      }
    );
  }

  /**
   * Process edit category input
   */
  async processEdit(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'editing_category') return false;
      
      const category = await db.getCategory(session.categoryId);
      if (!category) {
        await ctx.reply('❌ Category not found');
        return true;
      }
      
      let [newName, newDisplayName] = text.split('|').map(p => p.trim());
      
      // Keep current if empty
      if (!newName) newName = category.name;
      if (!newDisplayName) newDisplayName = category.display_name;
      
      // Check if new name already exists (if changed)
      if (newName !== category.name) {
        const existing = await db.query('SELECT * FROM categories WHERE name = ?', [newName]);
        if (existing.length > 0) {
          await ctx.reply('❌ Category with this name already exists');
          return true;
        }
      }
      
      // Update category
      await db.updateCategory(session.categoryId, {
        name: newName,
        display_name: newDisplayName
      });
      
      await ctx.reply(`✅ Category updated successfully!`);
      
      // Show updated panel
      await this.showPanel(ctx);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Edit category error:', error);
      await ctx.reply('❌ Error updating category');
      return true;
    }
  }

  /**
   * Handle delete category
   */
  async handleDelete(ctx) {
    const categories = await db.getCategories();
    
    if (categories.length === 0) {
      await ctx.editMessageText('❌ No categories to delete');
      return;
    }
    
    const buttons = categories.map(cat => [
      Markup.button.callback(`🗑 ${cat.display_name}`, `category_delete_${cat.id}`)
    ]);
    buttons.push([Markup.button.callback('❌ Cancel', 'category_cancel')]);
    
    await ctx.editMessageText(
      '🗑 *Select Category to Delete*\n\n⚠️ This will delete ALL codes in this category!',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      }
    );
  }

  /**
   * Confirm delete category
   */
  async confirmDelete(ctx, categoryId) {
    const category = await db.getCategory(categoryId);
    if (!category) {
      await ctx.editMessageText('❌ Category not found');
      return;
    }
    
    const codeCount = await db.query(
      'SELECT COUNT(*) as count FROM voucher_codes WHERE category_id = ?',
      [categoryId]
    );
    
    await ctx.editMessageText(
      `⚠️ *Confirm Delete*\n\n` +
      `Category: ${category.display_name}\n` +
      `Codes: ${codeCount[0].count} total\n` +
      `Stock: ${category.stock} available\n\n` +
      `This action cannot be undone!`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('✅ Yes, Delete', `category_delete_confirm_${categoryId}`)],
          [Markup.button.callback('❌ No, Cancel', 'category_cancel')]
        ]).reply_markup
      }
    );
  }

  /**
   * Process delete category
   */
  async processDelete(ctx, categoryId) {
    try {
      await db.deleteCategory(categoryId);
      
      await ctx.editMessageText('✅ Category deleted successfully!');
      
      // Show updated panel
      await this.showPanel(ctx);
      
    } catch (error) {
      console.error('Delete category error:', error);
      await ctx.editMessageText('❌ Error deleting category');
    }
  }

  /**
   * Handle price management
   */
  async handlePrices(ctx) {
    const categories = await db.getCategories();
    
    if (categories.length === 0) {
      await ctx.editMessageText('❌ No categories found');
      return;
    }
    
    const buttons = categories.map(cat => [
      Markup.button.callback(cat.display_name, `category_prices_${cat.id}`)
    ]);
    buttons.push([Markup.button.callback('❌ Cancel', 'category_cancel')]);
    
    await ctx.editMessageText(
      '💰 *Select Category to Manage Prices*',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      }
    );
  }

  /**
   * Show price management for category
   */
  async showPrices(ctx, categoryId) {
    const category = await db.getCategory(categoryId);
    if (!category) {
      await ctx.editMessageText('❌ Category not found');
      return;
    }
    
    const prices = await db.getPriceTiers(categoryId);
    
    let message = `💰 *Price Management - ${category.display_name}*\n\n`;
    
    if (prices.length === 0) {
      message += 'No prices configured.\n';
    } else {
      // Show first 20 prices
      prices.slice(0, 20).forEach(p => {
        message += `Qty ${p.quantity}: ₹${p.price}\n`;
      });
      if (prices.length > 20) {
        message += `... and ${prices.length - 20} more\n`;
      }
    }
    
    // Add suggested prices
    message += '\n📊 *Suggested Prices*\n';
    [1, 5, 10, 20, 50].forEach(qty => {
      const suggested = PricingManager.getSuggestedPrice(category.name, qty);
      message += `Qty ${qty}: ₹${suggested}\n`;
    });
    
    message += '\nTo update price, send:\n`quantity price`\nExample: `5 249`';
    
    this.sessions.set(ctx.from.id, { 
      action: 'managing_prices',
      categoryId 
    });
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('📊 Bulk Update', `category_bulk_prices_${categoryId}`)],
        [Markup.button.callback('↩️ Back', 'category_prices')]
      ]).reply_markup
    });
  }

  /**
   * Process price update
   */
  async processPrice(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'managing_prices') return false;
      
      const parts = text.split(' ');
      if (parts.length !== 2) {
        await ctx.reply('❌ Invalid format. Use: `quantity price`\nExample: `5 249`');
        return true;
      }
      
      const quantity = parseInt(parts[0]);
      const price = parseFloat(parts[1]);
      
      if (isNaN(quantity) || quantity < 1 || quantity > 100) {
        await ctx.reply('❌ Quantity must be between 1 and 100');
        return true;
      }
      
      if (isNaN(price) || price < 1) {
        await ctx.reply('❌ Price must be a valid number');
        return true;
      }
      
      // Validate price is reasonable
      const category = await db.getCategory(session.categoryId);
      const validation = PricingManager.validatePrice(category.name, quantity, price);
      
      if (!validation.valid) {
        await ctx.reply(validation.message);
        return true;
      }
      
      await db.updatePriceTier(session.categoryId, quantity, price);
      
      await ctx.reply(`✅ Price updated: Qty ${quantity} = ₹${price}`);
      
      // Show updated prices
      await this.showPrices(ctx, session.categoryId);
      return true;
      
    } catch (error) {
      console.error('Price update error:', error);
      await ctx.reply('❌ Error updating price');
      return true;
    }
  }

  /**
   * Handle bulk price update
   */
  async handleBulkPrices(ctx, categoryId) {
    this.sessions.set(ctx.from.id, { 
      action: 'bulk_prices',
      categoryId 
    });
    
    await ctx.editMessageText(
      '📊 *Bulk Price Update*\n\n' +
      'Send prices in format:\n' +
      '`quantity1 price1`\n`quantity2 price2`\n\n' +
      'Example:\n' +
      '1 49\n' +
      '5 249\n' +
      '10 498\n\n' +
      'Max 20 entries at once.',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', `category_prices_${categoryId}`)]
        ]).reply_markup
      }
    );
  }

  /**
   * Process bulk price update
   */
  async processBulkPrices(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'bulk_prices') return false;
      
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length > 20) {
        await ctx.reply('❌ Maximum 20 entries at once');
        return true;
      }
      
      const category = await db.getCategory(session.categoryId);
      let updated = 0;
      let failed = 0;
      
      for (const line of lines) {
        const parts = line.trim().split(' ');
        if (parts.length !== 2) {
          failed++;
          continue;
        }
        
        const quantity = parseInt(parts[0]);
        const price = parseFloat(parts[1]);
        
        if (isNaN(quantity) || quantity < 1 || quantity > 100 || isNaN(price) || price < 1) {
          failed++;
          continue;
        }
        
        await db.updatePriceTier(session.categoryId, quantity, price);
        updated++;
      }
      
      await ctx.reply(`✅ Bulk update complete!\nUpdated: ${updated}\nFailed: ${failed}`);
      
      // Show updated prices
      await this.showPrices(ctx, session.categoryId);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Bulk price error:', error);
      await ctx.reply('❌ Error updating prices');
      return true;
    }
  }

  /**
   * Handle toggle category status
   */
  async handleToggle(ctx) {
    const categories = await db.getCategories();
    
    if (categories.length === 0) {
      await ctx.editMessageText('❌ No categories found');
      return;
    }
    
    const buttons = categories.map(cat => [
      Markup.button.callback(
        `${cat.is_active ? '🔴' : '🟢'} ${cat.display_name}`, 
        `category_toggle_${cat.id}`
      )
    ]);
    buttons.push([Markup.button.callback('❌ Cancel', 'category_cancel')]);
    
    await ctx.editMessageText(
      '🔄 *Toggle Category Status*',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      }
    );
  }

  /**
   * Process toggle
   */
  async processToggle(ctx, categoryId) {
    try {
      const category = await db.getCategory(categoryId);
      if (!category) {
        await ctx.editMessageText('❌ Category not found');
        return;
      }
      
      await db.updateCategory(categoryId, {
        is_active: !category.is_active
      });
      
      await ctx.editMessageText(
        `✅ Category ${category.display_name} is now ${!category.is_active ? '✅ Active' : '❌ Inactive'}`
      );
      
      // Show updated panel
      await this.showPanel(ctx);
      
    } catch (error) {
      console.error('Toggle error:', error);
      await ctx.editMessageText('❌ Error toggling category');
    }
  }

  /**
   * View all categories
   */
  async viewAll(ctx) {
    const categories = await db.getCategories();
    
    let message = '📊 *All Categories*\n\n';
    
    for (const cat of categories) {
      const prices = await db.getPriceTiers(cat.id);
      message += 
        `• *${cat.display_name}*\n` +
        `  ID: ${cat.id}\n` +
        `  Stock: ${cat.stock}\n` +
        `  Status: ${cat.is_active ? '✅' : '❌'}\n` +
        `  Prices: ${prices.length} configured\n`;
      
      // Show sample prices
      const samplePrices = prices.filter(p => [1, 5, 10, 20].includes(p.quantity));
      if (samplePrices.length > 0) {
        message += `  Sample: `;
        samplePrices.forEach(p => {
          message += `Q${p.quantity}=₹${p.price} `;
        });
        message += '\n';
      }
      message += '\n';
    }
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('↩️ Back', 'category_cancel')]
      ]).reply_markup
    });
  }

  /**
   * Handle cancel
   */
  async handleCancel(ctx) {
    this.sessions.delete(ctx.from.id);
    await this.showPanel(ctx);
  }
}

module.exports = new CategoryManager();
