/**
 * User Commands Index
 * Location: /src/commands/user/index.js
 * Export all user commands
 */

const buyVoucher = require('./buyVoucher');
const myOrders = require('./myOrders');
const recoverVoucher = require('./recoverVoucher');
const support = require('./support');
const disclaimer = require('./disclaimer');
const back = require('./back');
const leave = require('./leave');

module.exports = {
  // Main commands
  buyVoucher: (ctx) => buyVoucher(ctx),
  myOrders: (ctx) => myOrders(ctx),
  recoverVoucher: (ctx) => recoverVoucher(ctx),
  support: (ctx) => support(ctx),
  disclaimer: (ctx) => disclaimer(ctx),
  
  // Navigation
  back: (ctx) => back(ctx),
  leave: (ctx) => leave(ctx),
  
  // Export individual handlers for advanced use
  buyVoucherHandler: buyVoucher,
  recoverVoucherHandler: recoverVoucher,
  supportHandler: support
};
