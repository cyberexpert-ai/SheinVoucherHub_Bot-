const keyboards = {
    mainMenu: {
        reply_markup: {
            keyboard: [
                ['🛒 Buy Voucher', '🔁 Recover Vouchers'],
                ['📦 My Orders', '📜 Disclaimer'],
                ['🆘 Support']
            ],
            resize_keyboard: true
        }
    },
    
    backButton: {
        reply_markup: {
            keyboard: [['↩️ Back']],
            resize_keyboard: true
        }
    },
    
    leaveButton: {
        reply_markup: {
            keyboard: [['↩️ Leave']],
            resize_keyboard: true
        }
    },
    
    cancelButton: {
        reply_markup: {
            keyboard: [['❌ Cancel']],
            resize_keyboard: true
        }
    },
    
    quantityKeyboard: (maxStock) => {
        const buttons = [];
        const quantities = [1, 2, 3, 4, 5];
        
        // Add quantity buttons that are <= maxStock
        const row1 = [];
        const row2 = [];
        
        quantities.forEach((q, index) => {
            const button = { text: q.toString(), callback_data: `qty_${q}` };
            if (index < 3) {
                row1.push(button);
            } else {
                row2.push(button);
            }
        });
        
        buttons.push(row1);
        buttons.push(row2);
        
        // Add custom quantity if maxStock > 5
        if (maxStock > 5) {
            buttons.push([{ text: 'Custom', callback_data: 'qty_custom' }]);
        }
        
        buttons.push([{ text: '🔙 Back', callback_data: 'back_to_categories' }]);
        
        return { inline_keyboard: buttons };
    },
    
    paymentMethodKeyboard: (orderId) => {
        return {
            inline_keyboard: [
                [{ text: '💳 Manual Payment', callback_data: `pay_manual_${orderId}` }],
                [{ text: '🤖 Auto Payment', callback_data: `pay_auto_${orderId}` }],
                [{ text: '❌ Cancel', callback_data: 'cancel_payment' }]
            ]
        };
    },
    
    adminMainMenu: {
        inline_keyboard: [
            [{ text: '📊 System Stats', callback_data: 'admin_stats' }],
            [{ text: '📦 Manage Categories', callback_data: 'admin_categories' }],
            [{ text: '➕ Add Vouchers', callback_data: 'admin_add_vouchers' }],
            [{ text: '👥 Manage Users', callback_data: 'admin_users' }],
            [{ text: '🔒 Block/Unblock', callback_data: 'admin_block' }],
            [{ text: '📢 Broadcast', callback_data: 'admin_broadcast' }],
            [{ text: '⚙️ Settings', callback_data: 'admin_settings' }],
            [{ text: '💰 Payments', callback_data: 'admin_payment' }],
            [{ text: '📈 Reports', callback_data: 'admin_reports' }],
            [{ text: '🔄 Backup', callback_data: 'admin_backup' }]
        ]
    },
    
    confirmationKeyboard: (action, data) => {
        return {
            inline_keyboard: [
                [
                    { text: '✅ Confirm', callback_data: `confirm_${action}_${data}` },
                    { text: '❌ Cancel', callback_data: `cancel_${action}` }
                ]
            ]
        };
    },
    
    channelJoinKeyboard: (channel1, channel2) => {
        return {
            inline_keyboard: [
                [
                    { text: '📢 Join Channel 1', url: channel1 },
                    { text: '📢 Join Channel 2', url: channel2 }
                ],
                [
                    { text: '✅ I have joined', callback_data: 'check_channels' }
                ]
            ]
        };
    },
    
    orderActionsKeyboard: (orderId) => {
        return {
            inline_keyboard: [
                [
                    { text: '✅ Approve', callback_data: `approve_${orderId}` },
                    { text: '❌ Reject', callback_data: `reject_${orderId}` }
                ],
                [
                    { text: '📝 Message User', callback_data: `message_${orderId}` }
                ]
            ]
        };
    },
    
    recoveryActionsKeyboard: (orderId) => {
        return {
            inline_keyboard: [
                [
                    { text: '✅ Send New Code', callback_data: `recover_${orderId}` },
                    { text: '❌ Cannot Recover', callback_data: `norecover_${orderId}` }
                ]
            ]
        };
    },
    
    userManagementKeyboard: (userId) => {
        return {
            inline_keyboard: [
                [
                    { text: '🔒 Block', callback_data: `block_user_${userId}` },
                    { text: '🔓 Unblock', callback_data: `unblock_user_${userId}` }
                ],
                [
                    { text: '📊 Stats', callback_data: `user_stats_${userId}` },
                    { text: '📦 Orders', callback_data: `user_orders_${userId}` }
                ],
                [
                    { text: '✉️ Message', callback_data: `message_user_${userId}` }
                ]
            ]
        };
    },
    
    paginationKeyboard: (page, total, type) => {
        const buttons = [];
        const prevPage = page > 1 ? page - 1 : total;
        const nextPage = page < total ? page + 1 : 1;
        
        buttons.push([
            { text: '◀️ Prev', callback_data: `${type}_page_${prevPage}` },
            { text: `${page}/${total}`, callback_data: 'noop' },
            { text: 'Next ▶️', callback_data: `${type}_page_${nextPage}` }
        ]);
        
        buttons.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);
        
        return { inline_keyboard: buttons };
    },
    
    sortFilterKeyboard: (type) => {
        return {
            inline_keyboard: [
                [
                    { text: '📅 Date', callback_data: `sort_${type}_date` },
                    { text: '💰 Amount', callback_data: `sort_${type}_amount` }
                ],
                [
                    { text: '✅ Status', callback_data: `filter_${type}_status` },
                    { text: '👤 User', callback_data: `filter_${type}_user` }
                ],
                [
                    { text: '🔙 Back', callback_data: `back_to_${type}` }
                ]
            ]
        };
    },
    
    exportOptionsKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '📊 CSV', callback_data: 'export_csv' },
                    { text: '📈 Excel', callback_data: 'export_excel' },
                    { text: '📋 PDF', callback_data: 'export_pdf' }
                ],
                [
                    { text: '📧 Email', callback_data: 'export_email' },
                    { text: '💾 Download', callback_data: 'export_download' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'back_to_reports' }
                ]
            ]
        };
    },
    
    timeRangeKeyboard: (type) => {
        return {
            inline_keyboard: [
                [
                    { text: 'Today', callback_data: `${type}_today` },
                    { text: 'Yesterday', callback_data: `${type}_yesterday` }
                ],
                [
                    { text: 'This Week', callback_data: `${type}_week` },
                    { text: 'This Month', callback_data: `${type}_month` }
                ],
                [
                    { text: 'Custom', callback_data: `${type}_custom` },
                    { text: 'All Time', callback_data: `${type}_all` }
                ],
                [
                    { text: '🔙 Back', callback_data: `back_to_${type}` }
                ]
            ]
        };
    },
    
    categorySelectionKeyboard: (categories) => {
        const buttons = [];
        categories.forEach(cat => {
            buttons.push([{
                text: `${cat.name} (₹${cat.price_per_code} | Stock: ${cat.stock})`,
                callback_data: `select_cat_${cat.category_id}`
            }]);
        });
        buttons.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);
        return { inline_keyboard: buttons };
    },
    
    discountKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '➕ Add Discount', callback_data: 'add_discount' },
                    { text: '🗑 Delete Discount', callback_data: 'delete_discount' }
                ],
                [
                    { text: '🏷 Category Discount', callback_data: 'category_discount' },
                    { text: '🎟 Coupons', callback_data: 'manage_coupons' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'admin_back' }
                ]
            ]
        };
    },
    
    backupOptionsKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '📦 Create Backup', callback_data: 'create_backup' },
                    { text: '🔄 Restore', callback_data: 'restore_backup' }
                ],
                [
                    { text: '⏱ Set Auto Backup', callback_data: 'set_auto_backup' },
                    { text: '📋 List Backups', callback_data: 'list_backups' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'admin_back' }
                ]
            ]
        };
    },
    
    logOptionsKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '👤 Admin Logs', callback_data: 'view_admin_logs' },
                    { text: '❌ Error Logs', callback_data: 'view_error_logs' }
                ],
                [
                    { text: '💰 Payment Logs', callback_data: 'view_payment_logs' },
                    { text: '👥 User Logs', callback_data: 'view_user_logs' }
                ],
                [
                    { text: '🗑 Clear Logs', callback_data: 'clear_logs' },
                    { text: '🔙 Back', callback_data: 'admin_back' }
                ]
            ]
        };
    },
    
    apiSettingsKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '🔌 Toggle API', callback_data: 'toggle_api' },
                    { text: '🔄 Generate Key', callback_data: 'generate_api_key' }
                ],
                [
                    { text: '🔗 Set Webhook', callback_data: 'set_webhook' },
                    { text: '📊 API Stats', callback_data: 'api_stats' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'admin_back' }
                ]
            ]
        };
    },
    
    rateLimitKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '⚙️ Set Limits', callback_data: 'set_rate_limit' },
                    { text: '✅ IP Whitelist', callback_data: 'set_ip_whitelist' }
                ],
                [
                    { text: '❌ IP Blacklist', callback_data: 'set_ip_blacklist' },
                    { text: '📊 Current Limits', callback_data: 'view_rate_limits' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'admin_back' }
                ]
            ]
        };
    },
    
    alertSettingsKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '📧 Email Alerts', callback_data: 'set_email_alerts' },
                    { text: '📱 Telegram Alerts', callback_data: 'set_telegram_alerts' }
                ],
                [
                    { text: '⚠️ Thresholds', callback_data: 'set_alert_thresholds' },
                    { text: '📋 Test Alert', callback_data: 'test_alert' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'admin_back' }
                ]
            ]
        };
    },
    
    regionalSettingsKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '🌐 Language', callback_data: 'set_language' },
                    { text: '🕐 Timezone', callback_data: 'set_timezone' }
                ],
                [
                    { text: '💰 Currency', callback_data: 'set_currency_format' },
                    { text: '📅 Date Format', callback_data: 'set_date_format' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'admin_back' }
                ]
            ]
        };
    },
    
    verificationSettingsKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '🔐 Toggle Captcha', callback_data: 'toggle_captcha' },
                    { text: '🎨 Captcha Type', callback_data: 'set_captcha_type' }
                ],
                [
                    { text: '📢 Channel Check', callback_data: 'set_channel_check' },
                    { text: '🔗 Channel Links', callback_data: 'set_channel_links' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'admin_back' }
                ]
            ]
        };
    },
    
    cleanupKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '🗑 Old Orders', callback_data: 'cleanup_old_orders' },
                    { text: '🗑 Inactive Users', callback_data: 'cleanup_old_users' }
                ],
                [
                    { text: '🗑 Temp Data', callback_data: 'cleanup_temp_data' },
                    { text: '⚠️ Reset All', callback_data: 'reset_all_data' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'admin_back' }
                ]
            ]
        };
    },
    
    inlineUrlButton: (text, url) => {
        return {
            inline_keyboard: [
                [{ text: text, url: url }]
            ]
        };
    },
    
    inlineCallbackButton: (text, callback) => {
        return {
            inline_keyboard: [
                [{ text: text, callback_data: callback }]
            ]
        };
    },
    
    inlineRowButtons: (buttons) => {
        return {
            inline_keyboard: [buttons]
        };
    },
    
    multiRowButtons: (rows) => {
        return {
            inline_keyboard: rows
        };
    },
    
    forceReply: {
        force_reply: true
    },
    
    removeKeyboard: {
        remove_keyboard: true
    },
    
    selectDateKeyboard: () => {
        const buttons = [];
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const row = [];
        
        days.forEach(day => {
            row.push({ text: day, callback_data: `day_${day}` });
        });
        buttons.push(row);
        
        const dates = [];
        for (let i = 1; i <= 31; i++) {
            dates.push({ text: i.toString(), callback_data: `date_${i}` });
        }
        
        // Split dates into rows of 7
        for (let i = 0; i < dates.length; i += 7) {
            buttons.push(dates.slice(i, i + 7));
        }
        
        buttons.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);
        
        return { inline_keyboard: buttons };
    },
    
    selectTimeKeyboard: () => {
        const buttons = [];
        const hours = [];
        
        for (let i = 0; i < 24; i++) {
            const hour = i.toString().padStart(2, '0');
            hours.push({ text: `${hour}:00`, callback_data: `time_${hour}` });
        }
        
        // Split hours into rows of 4
        for (let i = 0; i < hours.length; i += 4) {
            buttons.push(hours.slice(i, i + 4));
        }
        
        buttons.push([{ text: '🔙 Back', callback_data: 'back_to_main' }]);
        
        return { inline_keyboard: buttons };
    },
    
    fileTypeKeyboard: () => {
        return {
            inline_keyboard: [
                [
                    { text: '📷 Photo', callback_data: 'file_photo' },
                    { text: '🎥 Video', callback_data: 'file_video' }
                ],
                [
                    { text: '📄 Document', callback_data: 'file_doc' },
                    { text: '🎵 Audio', callback_data: 'file_audio' }
                ],
                [
                    { text: '🔙 Back', callback_data: 'back_to_main' }
                ]
            ]
        };
    },
    
    shareContactKeyboard: {
        keyboard: [
            [{ text: '📱 Share Contact', request_contact: true }],
            [{ text: '↩️ Back' }]
        ],
        resize_keyboard: true
    },
    
    shareLocationKeyboard: {
        keyboard: [
            [{ text: '📍 Share Location', request_location: true }],
            [{ text: '↩️ Back' }]
        ],
        resize_keyboard: true
    },
    
    pollKeyboard: (question, options) => {
        return {
            inline_keyboard: options.map(opt => [
                { text: opt, callback_data: `poll_${question}_${opt}` }
            ])
        };
    }
};

module.exports = keyboards;
