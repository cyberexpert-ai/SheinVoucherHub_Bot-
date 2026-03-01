async function authMiddleware(ctx, next) {
  // Check if user exists in database
  try {
    const userId = ctx.from?.id;
    
    if (!userId) {
      return next();
    }

    // Update last active timestamp
    await global.pool.query(
      `UPDATE users 
       SET last_active = CURRENT_TIMESTAMP 
       WHERE user_id = $1`,
      [userId]
    );

    return next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return next();
  }
}

module.exports = { authMiddleware };
