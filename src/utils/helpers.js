async function deleteOldMessage(ctx) {
  try {
    if (ctx.chat && ctx.message) {
      // Store current message ID in session for future deletion
      ctx.session = ctx.session || {};
      if (ctx.session.lastMessageId) {
        try {
          await ctx.deleteMessage(ctx.session.lastMessageId);
        } catch (e) {
          // Message might already be deleted
        }
      }
      ctx.session.lastMessageId = ctx.message.message_id;
    }
  } catch (error) {
    // Ignore deletion errors
  }
}

async function saveUser(userId, username, firstName, lastName) {
  try {
    await global.pool.query(
      `INSERT INTO users (user_id, username, first_name, last_name, joined_at, last_active)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         username = EXCLUDED.username,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         last_active = CURRENT_TIMESTAMP`,
      [userId, username, firstName, lastName]
    );
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function generateOrderId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SVH-${year}${month}${day}-${random}`;
}

function calculatePrice(category, quantity) {
  // Use database price tiers instead of hardcoded
  return 0; // Placeholder
}

module.exports = {
  deleteOldMessage,
  saveUser,
  formatNumber,
  generateOrderId,
  calculatePrice
};
