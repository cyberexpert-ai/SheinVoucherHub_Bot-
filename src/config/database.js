const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const dotenv = require('dotenv');

dotenv.config();

let doc;

function setupDatabase() {
    console.log('Database setup initialized...');
    // Database setup is handled in googleSheets.js
}

module.exports = { setupDatabase };
