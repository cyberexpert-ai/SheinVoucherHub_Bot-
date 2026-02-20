const db = require('../database/database');
const { Markup } = require('telegraf');

class CodeManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Show code management panel
   */
  async showPanel(ctx) {
    const categories = await db.getCategories();
    
    let message = '🎟 *Code Manager*\n\nSelect category:';
    
    const buttons = categories.map(cat => [
      Markup.button.callback(`${cat.display_name} (${cat.stock})`, `code_cat_${cat.id}`)
    ]);
    buttons.push([Markup.button.callback('↩️ Back to Admin', 'admin_back')]);
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Show category code options
   */
  async showCategoryOptions(ctx, categoryId) {
    const category = await db.getCategory(categoryId);
    const stock = await db.getAvailableStock(categoryId);
    const totalCodes = await db.query(
      'SELECT COUNT(*) as count FROM voucher_codes WHERE category_id = ?',
      [categoryId]
    );
    
    const message = 
      `🎟 *Code Manager - ${category.display_name}*\n\n` +
      `📊 *Statistics*\n` +
      `• Available Stock: ${stock}\n` +
      `• Total Codes: ${totalCodes[0].count}\n\n` +
      `Choose action:`;
    
    const buttons = [
      [Markup.button.callback('➕ Add Single Code', `code_add_${categoryId}`)],
      [Markup.button.callback('📦 Add Bulk Codes', `code_bulk_${categoryId}`)],
      [Markup.button.callback('📋 View Available Codes', `code_view_${categoryId}`)],
      [Markup.button.callback('🔍 Search Code', `code_search_${categoryId}`)],
      [Markup.button.callback('🗑 Delete Specific Code', `code_delete_${categoryId}`)],
      [Markup.button.callback('🗑 Delete All Unused', `code_delete_all_${categoryId}`)],
      [Markup.button.callback('📊 Export Codes', `code_export_${categoryId}`)],
      [Markup.button.callback('🔄 Check Stock', `code_stock_${categoryId}`)],
      [Markup.button.callback('↩️ Back', 'code_back')]
    ];
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Handle add single code
   */
  async handleAddSingle(ctx, categoryId) {
    this.sessions.set(ctx.from.id, { 
      action: 'adding_code',
      categoryId 
    });
    
    await ctx.editMessageText(
      '✏️ *Add Single Code*\n\n' +
      'Send the voucher code:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', `code_cat_${categoryId}`)]
        ]).reply_markup
      }
    );
  }

  /**
   * Process add single code
   */
  async processAddSingle(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'adding_code') return false;
      
      const code = text.trim();
      if (code.length < 3) {
        await ctx.reply('❌ Code too short (min 3 characters)');
        return true;
      }
      
      // Check if code already exists
      const existing = await db.query(
        'SELECT * FROM voucher_codes WHERE code = ?',
        [code]
      );
      
      if (existing.length > 0) {
        await ctx.reply('❌ This code already exists in database');
        return true;
      }
      
      await db.addVoucherCode(session.categoryId, code, ctx.from.id);
      
      const stock = await db.getAvailableStock(session.categoryId);
      
      await ctx.reply(`✅ Code added successfully!\nCurrent stock: ${stock}`);
      
      // Show category options again
      await this.showCategoryOptions(ctx, session.categoryId);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Add code error:', error);
      await ctx.reply('❌ Error adding code');
      return true;
    }
  }

  /**
   * Handle bulk codes
   */
  async handleBulk(ctx, categoryId) {
    this.sessions.set(ctx.from.id, { 
      action: 'adding_bulk',
      categoryId 
    });
    
    await ctx.editMessageText(
      '📦 *Add Bulk Codes*\n\n' +
      'Send codes separated by new lines:\n\n' +
      'Example:\n' +
      'CODE123\n' +
      'CODE456\n' +
      'CODE789\n\n' +
      'Max 100 codes at a time.',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', `code_cat_${categoryId}`)]
        ]).reply_markup
      }
    );
  }

  /**
   * Process bulk codes
   */
  async processBulk(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'adding_bulk') return false;
      
      const codes = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (codes.length === 0) {
        await ctx.reply('❌ No valid codes found');
        return true;
      }
      
      if (codes.length > 100) {
        await ctx.reply('❌ Maximum 100 codes at a time');
        return true;
      }
      
      // Check for duplicates in database
      const placeholders = codes.map(() => '?').join(',');
      const existing = await db.query(
        `SELECT code FROM voucher_codes WHERE code IN (${placeholders})`,
        codes
      );
      
      const existingCodes = existing.map(e => e.code);
      const newCodes = codes.filter(c => !existingCodes.includes(c));
      
      if (newCodes.length === 0) {
        await ctx.reply('❌ All codes already exist in database');
        return true;
      }
      
      await db.addBulkVoucherCodes(session.categoryId, newCodes, ctx.from.id);
      
      const stock = await db.getAvailableStock(session.categoryId);
      
      await ctx.reply(
        `✅ Added ${newCodes.length} codes successfully!\n` +
        `Skipped ${codes.length - newCodes.length} duplicates.\n` +
        `Current stock: ${stock}`
      );
      
      // Show category options again
      await this.showCategoryOptions(ctx, session.categoryId);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Bulk add error:', error);
      await ctx.reply('❌ Error adding codes');
      return true;
    }
  }

  /**
   * Handle view codes
   */
  async handleView(ctx, categoryId, page = 1) {
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const codes = await db.query(
      'SELECT * FROM voucher_codes WHERE category_id = ? AND is_used = FALSE ORDER BY id DESC LIMIT ? OFFSET ?',
      [categoryId, limit, offset]
    );
    
    const total = await db.query(
      'SELECT COUNT(*) as count FROM voucher_codes WHERE category_id = ? AND is_used = FALSE',
      [categoryId]
    );
    
    if (codes.length === 0) {
      await ctx.editMessageText('📋 No unused codes available');
      return;
    }
    
    let message = `📋 *Available Codes (Page ${page})*\n\n`;
    
    codes.forEach((code, index) => {
      message += `${offset + index + 1}. \`${code.code}\`\n`;
    });
    
    message += `\nShowing ${codes.length} of ${total[0].count} codes`;
    
    const buttons = [];
    const navButtons = [];
    
    if (page > 1) {
      navButtons.push(Markup.button.callback('◀️ Prev', `code_view_${categoryId}_${page - 1}`));
    }
    if (offset + limit < total[0].count) {
      navButtons.push(Markup.button.callback('Next ▶️', `code_view_${categoryId}_${page + 1}`));
    }
    
    if (navButtons.length > 0) {
      buttons.push(navButtons);
    }
    
    buttons.push([Markup.button.callback('↩️ Back', `code_cat_${categoryId}`)]);
    
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }

  /**
   * Handle search code
   */
  async handleSearch(ctx, categoryId) {
    this.sessions.set(ctx.from.id, { 
      action: 'searching_code',
      categoryId 
    });
    
    await ctx.editMessageText(
      '🔍 *Search Code*\n\n' +
      'Enter code or part of code to search:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', `code_cat_${categoryId}`)]
        ]).reply_markup
      }
    );
  }

  /**
   * Process search
   */
  async processSearch(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'searching_code') return false;
      
      const searchTerm = `%${text}%`;
      
      const codes = await db.query(
        'SELECT * FROM voucher_codes WHERE category_id = ? AND code LIKE ? LIMIT 20',
        [session.categoryId, searchTerm]
      );
      
      if (codes.length === 0) {
        await ctx.reply('❌ No codes found matching your search');
        return true;
      }
      
      let message = `🔍 *Search Results*\n\n`;
      codes.forEach((code, index) => {
        message += `${index + 1}. \`${code.code}\`\n`;
        if (code.is_used) {
          message += `   Used: ${code.order_id || 'Yes'}\n`;
        } else {
          message += `   Available\n`;
        }
      });
      
      await ctx.reply(message, { parse_mode: 'Markdown' });
      
      // Show category options again
      await this.showCategoryOptions(ctx, session.categoryId);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Search error:', error);
      await ctx.reply('❌ Error searching codes');
      return true;
    }
  }

  /**
   * Handle delete single code
   */
  async handleDelete(ctx, categoryId) {
    this.sessions.set(ctx.from.id, { 
      action: 'deleting_code',
      categoryId 
    });
    
    await ctx.editMessageText(
      '🗑 *Delete Code*\n\n' +
      'Send the exact code to delete:',
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', `code_cat_${categoryId}`)]
        ]).reply_markup
      }
    );
  }

  /**
   * Process delete code
   */
  async processDelete(ctx, text) {
    try {
      const session = this.sessions.get(ctx.from.id);
      if (!session || session.action !== 'deleting_code') return false;
      
      const code = text.trim();
      
      const result = await db.query(
        'DELETE FROM voucher_codes WHERE category_id = ? AND code = ? AND is_used = FALSE',
        [session.categoryId, code]
      );
      
      if (result.affectedRows === 0) {
        await ctx.reply('❌ Code not found or already used');
        return true;
      }
      
      // Update stock
      await db.updateCategoryStock(session.categoryId);
      
      const stock = await db.getAvailableStock(session.categoryId);
      
      await ctx.reply(`✅ Code deleted successfully!\nCurrent stock: ${stock}`);
      
      // Show category options again
      await this.showCategoryOptions(ctx, session.categoryId);
      
      this.sessions.delete(ctx.from.id);
      return true;
      
    } catch (error) {
      console.error('Delete code error:', error);
      await ctx.reply('❌ Error deleting code');
      return true;
    }
  }

  /**
   * Handle delete all codes
   */
  async handleDeleteAll(ctx, categoryId) {
    const category = await db.getCategory(categoryId);
    const unused = await db.query(
      'SELECT COUNT(*) as count FROM voucher_codes WHERE category_id = ? AND is_used = FALSE',
      [categoryId]
    );
    
    await ctx.editMessageText(
      `⚠️ *Delete All Unused Codes*\n\n` +
      `Category: ${category.display_name}\n` +
      `Unused codes: ${unused[0].count}\n\n` +
      `This will delete ALL unused codes!\n` +
      `This action cannot be undone!`,
      {
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('✅ Yes, Delete All', `code_delete_all_confirm_${categoryId}`)],
          [Markup.button.callback('❌ No, Cancel', `code_cat_${categoryId}`)]
        ]).reply_markup
      }
    );
  }

  /**
   * Process delete all
   */
  async processDeleteAll(ctx, categoryId) {
    try {
      const result = await db.query(
        'DELETE FROM voucher_codes WHERE category_id = ? AND is_used = FALSE',
        [categoryId]
      );
      
      // Update stock
      await db.updateCategoryStock(categoryId);
      
      await ctx.editMessageText(`✅ Deleted ${result.affectedRows} unused codes successfully!`);
      
      // Show category options again
      await this.showCategoryOptions(ctx, categoryId);
      
    } catch (error) {
      console.error('Delete all error:', error);
      await ctx.editMessageText('❌ Error deleting codes');
    }
  }

  /**
   * Handle export codes
   */
  async handleExport(ctx, categoryId) {
    try {
      const category = await db.getCategory(categoryId);
      const codes = await db.query(
        'SELECT code FROM voucher_codes WHERE category_id = ? AND is_used = FALSE',
        [categoryId]
      );
      
      if (codes.length === 0) {
        await ctx.answerCbQuery('No codes to export', { alert: true });
        return;
      }
      
      // Split into chunks to avoid message too long
      const chunks = [];
      for (let i = 0; i < codes.length; i += 50) {
        chunks.push(codes.slice(i, i + 50));
      }
      
      await ctx.editMessageText(
        `📊 *Export - ${category.display_name}*\n\n` +
        `Total: ${codes.length} codes\n` +
        `Sending in ${chunks.length} messages...`,
        { parse_mode: 'Markdown' }
      );
      
      for (let i = 0; i < chunks.length; i++) {
        const text = chunks[i].map(c => c.code).join('\n');
        await ctx.reply(
          `📊 Part ${i + 1}/${chunks.length}\n\`\`\`\n${text}\n\`\`\``,
          { parse_mode: 'Markdown' }
        );
      }
      
      // Show category options again
      await this.showCategoryOptions(ctx, categoryId);
      
    } catch (error) {
      console.error('Export error:', error);
      await ctx.answerCbQuery('❌ Export failed', { alert: true });
    }
  }

  /**
   * Check stock
   */
  async checkStock(ctx, categoryId) {
    const stock = await db.getAvailableStock(categoryId);
    const total = await db.query(
      'SELECT COUNT(*) as count FROM voucher_codes WHERE category_id = ?',
      [categoryId]
    );
    const used = await db.query(
      'SELECT COUNT(*) as count FROM voucher_codes WHERE category_id = ? AND is_used = TRUE',
      [categoryId]
    );
    
    const message = 
      `📊 *Stock Check*\n\n` +
      `Available: ${stock}\n` +
      `Used: ${used[0].count}\n` +
      `Total: ${total[0].count}`;
    
    await ctx.answerCbQuery(`Stock: ${stock}`, { alert: true });
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('↩️ Back', `code_cat_${categoryId}`)]
      ]).reply_markup
    });
  }

  /**
   * Handle back
   */
  async handleBack(ctx) {
    await this.showPanel(ctx);
  }

  /**
   * Handle cancel
   */
  async handleCancel(ctx) {
    this.sessions.delete(ctx.from.id);
    await this.showPanel(ctx);
  }
}

module.exports = new CodeManager();
