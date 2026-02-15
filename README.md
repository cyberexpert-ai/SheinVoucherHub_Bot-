# SheinVoucherHub_Bot-# Shein Voucher Hub Telegram Bot

A comprehensive Telegram bot for selling Shein vouchers with admin panel, payment processing, and Google Sheets integration.

## Features

### User Features
- Channel join verification
- Captcha verification
- Browse voucher categories
- Select quantity (1-5 or custom)
- Payment with screenshot & UTR
- Order recovery within 2 hours
- View order history
- Copy delivered vouchers
- Support chat with admin

### Admin Features
- Add/Edit/Delete categories
- Add vouchers to categories
- Update stock
- Block/Unblock users (permanent/temporary)
- Broadcast messages
- Personal messaging
- Approve/Reject payments
- Process recovery requests
- Reply to support messages
- Bot settings management
- View statistics

### Technical Features
- Google Sheets database
- Captcha generation
- Order ID generation
- Recovery period management
- Channel membership verification
- Automatic order notifications

## Deployment on Render

1. Fork this repository to your GitHub

2. Create a new Web Service on Render
   - Connect your GitHub repository
   - Select Node environment
   - Build command: `npm install`
   - Start command: `npm start`

3. Add environment variables:
   - `BOT_TOKEN`: Your Telegram bot token
   - `ADMIN_ID`: Your Telegram user ID
   - `CHANNEL_1`: @SheinVoucherHub
   - `CHANNEL_2`: @OrdersNotify
   - `GOOGLE_SHEETS_ID`: Your Google Sheets ID
   - `PRIVATE_KEY`: Your Google service account private key

4. Deploy!

## Google Sheets Setup

1. Create a new Google Sheet
2. Share it with your service account email (client_email from credentials)
3. Copy the Sheet ID from URL
4. Add to environment variables

## Commands

### User Commands
- `/start` - Start the bot
- `🛒 Buy Voucher` - Purchase vouchers
- `🔁 Recover Vouchers` - Recover lost vouchers
- `📦 My Orders` - View order history
- `📜 Disclaimer` - View disclaimer
- `🆘 Support` - Contact admin

### Admin Commands
- `/admin` - Open admin panel

## License
MIT
