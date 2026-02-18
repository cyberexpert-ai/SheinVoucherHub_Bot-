const keyboards = {
    mainMenu: {
        keyboard: [
            ['🛒 Buy Vouchers', '📦 My Orders'],
            ['🔁 Recover Vouchers', '🆘 Support'],
            ['📜 Disclaimer']
        ],
        resize_keyboard: true
    },
    
    backButton: {
        keyboard: [['🔙 Back to Main Menu']],
        resize_keyboard: true
    },
    
    adminMenu: {
        keyboard: [
            ['📊 Dashboard', '👥 Users', '📁 Categories'],
            ['🎫 Vouchers', '📋 Orders', '💰 Payments'],
            ['🏷️ Discounts', '🎟️ Coupons', '🤝 Referrals'],
            ['📈 Reports', '⚙️ Settings', '🔄 Backup'],
            ['🔐 Security', '📢 Broadcast', '🔌 Integrations'],
            ['🛠️ System', '❓ Help', '🔙 Main Menu']
        ],
        resize_keyboard: true
    }
};

module.exports = keyboards;
