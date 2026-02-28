# Shein Voucher Hub Bot

Advanced Telegram bot for purchasing and managing Shein vouchers.

## Features

### User Features
- 🛒 Buy vouchers with multiple quantity options
- 🔁 Recover purchased vouchers
- 📦 View order history
- 🆘 Support system
- 📜 Disclaimer information

### Admin Features
- 📊 Dashboard with statistics
- 📂 Category management
- 🎟 Voucher management (add single/bulk)
- 💰 Price management
- 👥 User management (block/unblock)
- 📦 Order management
- 📢 Broadcast messages
- 🏷 Discount codes
- 🔒 Security & fraud detection

## Deployment on Render

1. Fork this repository
2. Create a new Web Service on Render
3. Connect your repository
4. Set environment variables:
   - `BOT_TOKEN`: Your Telegram bot token
   - `ADMIN_ID`: Admin Telegram ID
   - `DB_HOST`: Database host
   - `DB_USER`: Database user
   - `DB_PASSWORD`: Database password
   - `DB_NAME`: Database name
5. Deploy!

## Database Setup

Run the `src/database/init.sql` script to create all required tables.

## Commands

### User Commands
- `/start` - Start the bot

### Admin Panel Access
- Send any message to admin after starting the bot

## Security Features

- Force channel join
- UTR duplicate detection
- Warning system
- Temporary blocks
- Fraud logging
- Rate limiting

## Support

For issues or questions, contact @SheinSupportRobot
