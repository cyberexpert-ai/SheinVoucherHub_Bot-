// addCategory function update this part
async function addCategory(name, price, stock = '100') {
    try {
        const sheet = doc.sheetsByTitle['Categories'];
        const rows = await sheet.getRows();
        
        // Generate category ID
        const categoryId = (rows.length + 1).toString();
        
        // Format category name with ₹ symbol
        const formattedName = `₹${name} Voucher`;
        
        await sheet.addRow({
            category_id: categoryId,
            name: formattedName,
            price_per_code: price.toString(),
            stock: stock.toString(),
            total_sold: '0',
            discount: '0',
            description: `${name} Taka Shein Voucher`
        });
        
        return true;
    } catch (error) {
        console.error('Error adding category:', error);
        return false;
    }
}
