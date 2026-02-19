const db = require('../database/database');

function checkBlocked(userId) {
    return db.isUserBlocked(userId);
}

function addWarning(userId, reason) {
    return db.addWarning(userId, reason);
}

module.exports = { checkBlocked, addWarning };
