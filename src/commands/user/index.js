// সব ইউজার কমান্ড একসাথে এক্সপোর্ট করা হবে
const buyVoucher = require('./buyVoucher');
const myOrders = require('./myOrders');
const recoverVoucher = require('./recoverVoucher');
const support = require('./support');
const disclaimer = require('./disclaimer');

// ইউজার স্টেট ম্যানেজমেন্ট
let userState = {};

module.exports = {
    ...buyVoucher,
    ...myOrders,
    ...recoverVoucher,
    ...support,
    ...disclaimer,
    userState
};
