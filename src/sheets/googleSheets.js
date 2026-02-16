// এই ফাইলে নিচের ফাংশনগুলো যোগ করুন

// Add notification
async function addNotification(type, message, userId, orderId) {
    try {
        const sheet = doc.sheetsByTitle['Notifications'];
        if (!sheet) {
            sheet = await doc.addSheet({ title: 'Notifications' });
            await sheet.setHeaderRow(['id', 'type', 'message', 'user_id', 'order_id', 'date', 'status']);
        }
        
        await sheet.addRow({
            id: `NOTIF-${Date.now()}`,
            type: type,
            message: message,
            user_id: userId?.toString() || '',
            order_id: orderId || '',
            date: new Date().toISOString(),
            status: 'unread'
        });
    } catch (error) {
        console.error('Error adding notification:', error);
    }
}

// Update order payment details
async function updateOrderPayment(orderId, transactionId, screenshot) {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        const order = rows.find(row => row.order_id === orderId);
        
        if (order) {
            order.transaction_id = transactionId;
            order.screenshot = screenshot;
            await order.save();
        }
    } catch (error) {
        console.error('Error updating order payment:', error);
    }
}

// Get pending orders
async function getPendingOrders() {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        return rows.filter(row => row.status === 'pending_approval' || row.status === 'pending');
    } catch (error) {
        console.error('Error getting pending orders:', error);
        return [];
    }
}

// Update user stats
async function updateUserStats(userId, orderAmount) {
    try {
        const sheet = doc.sheetsByTitle['Users'];
        const rows = await sheet.getRows();
        const user = rows.find(row => row.user_id === userId.toString());
        
        if (user) {
            const ordersCount = parseInt(user.orders_count || '0') + 1;
            const totalSpent = parseInt(user.total_spent || '0') + parseInt(orderAmount);
            
            user.orders_count = ordersCount.toString();
            user.total_spent = totalSpent.toString();
            await user.save();
        }
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
}

// Get daily stats
async function getDailyStats() {
    try {
        const sheet = doc.sheetsByTitle['Orders'];
        const rows = await sheet.getRows();
        const today = new Date().toDateString();
        
        const todayOrders = rows.filter(row => 
            new Date(row.order_date).toDateString() === today
        );
        
        return {
            total: todayOrders.length,
            delivered: todayOrders.filter(o => o.status === 'delivered').length,
            pending: todayOrders.filter(o => o.status === 'pending_approval').length,
            revenue: todayOrders
                .filter(o => o.status === 'delivered')
                .reduce((sum, o) => sum + parseInt(o.total_price || '0'), 0)
        };
    } catch (error) {
        console.error('Error getting daily stats:', error);
        return { total: 0, delivered: 0, pending: 0, revenue: 0 };
    }
}
