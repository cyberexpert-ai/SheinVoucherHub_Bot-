# 🎯 Shein Voucher Hub Bot

Complete Telegram Bot for selling Shein vouchers with dynamic pricing based on quantity.

## ✨ Features

### 👤 User Features
- ✅ Channel join verification
- 🛒 Buy vouchers with quantity-based pricing
- 📦 Order history & tracking
- 🔁 Voucher recovery (2 hours window)
- 🆘 Support integration
- 📜 Disclaimer
- 💳 Manual payment with QR code
- 📸 Screenshot upload
- 🔢 UTR submission

### 👑 Admin Features
- 📊 Live dashboard
- 👥 User management (block/unblock)
- 📁 Category management
- 🎫 Voucher management
- 📋 Order management
- 💰 Payment management
- ⚙️ Settings
- 📢 Broadcast messages
- 🔄 Backup & restore

### 💰 Dynamic Pricing
- Different prices for different quantities
- Price tiers: 1, 5, 10, 20+ codes
- Admin can update prices per tier
- Automatic total calculation

## 🚀 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/SheinVoucherHub_Bot.git
cd SheinVoucherHub_Bot

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values
nano .env

# Start bot
npm start
