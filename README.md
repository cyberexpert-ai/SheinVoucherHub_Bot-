# 🤖 SheinVoucherHub_Bot

Advanced Telegram Bot for Shein Voucher Sales with Complete Admin Panel

## 📋 Features

### 🔐 Force Join System
- Must join @SheinVoucherHub and @OrdersNotify
- Auto verification on every command
- If leaves → bot stops working
- Shows join buttons with verify option

### 🛒 Buy Voucher System
- Multiple categories (₹500, ₹1000, ₹2000, ₹4000)
- Dynamic pricing based on quantity
- Live stock display
- Custom quantity option (1-100)
- Cannot exceed available stock
- Price calculation based on quantity

### 💳 Payment System
- QR code payment display
- Screenshot upload required
- UTR/Transaction ID verification
- Duplicate UTR prevention
- Fake payment detection with auto-block
- Payment validation system

### 📦 Order System
- Unique Order ID: `SVH-XXXXXXX-XXXXXX`
- 2-hour recovery window
- Status tracking (Pending/Success/Rejected/Expired)
- Copy voucher codes with one tap
- Order history view

### 🔁 Recovery System
- Get codes within 2 hours of purchase
- Same Telegram ID required
- Automatic expiry after 2 hours
- Max 3 recovery attempts
- Admin can manually recover

### 👑 Admin Panel
- Category Management (Add/Edit/Delete/Toggle)
- Code Management (Add single/bulk, delete, export)
- User Management (Block/Unblock/Temp Ban, message)
- Broadcast Messages (text/photo)
- Order Management (Accept/Reject with reason)
- Support Ticket System with reply
- Full Statistics Dashboard
- Price Management per quantity

### 📊 Database
- MySQL Database with all tables
- All data persistent
- Automatic order expiry cleanup
- Anti-fraud system with UTR blacklist
- User blocking system

### 🔒 Security Features
- Channel verification required
- Block system (temporary/permanent)
- UTR blacklist
- Duplicate order prevention
- Anti-fraud detection
- Rate limiting
- Session management
- Auto message deletion

## 🚀 Installation

### Prerequisites
- Node.js v16 or higher
- MySQL Database (InfinityFree or any)
- Telegram Bot Token (from @BotFather)

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/SheinVoucherHub_Bot.git
cd SheinVoucherHub_Bot
