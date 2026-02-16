// Captcha functions
async function saveCaptcha(userId, captchaText) {
    try {
        const sheet = doc.sheetsByTitle['Captcha'];
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 5); // 5 minutes expiry
        
        // Delete old captchas
        const rows = await sheet.getRows();
        const oldCaptchas = rows.filter(row => row.user_id === userId.toString());
        for (const captcha of oldCaptchas) {
            await captcha.delete();
        }
        
        await sheet.addRow({
            user_id: userId.toString(),
            captcha_text: captchaText,
            expiry: expiry.toISOString(),
            attempts: '0'
        });
        return true;
    } catch (error) {
        console.error('Error saving captcha:', error);
        return false;
    }
}

async function verifyCaptcha(userId, userInput) {
    try {
        const sheet = doc.sheetsByTitle['Captcha'];
        const rows = await sheet.getRows();
        const captchaRow = rows.find(row => row.user_id === userId.toString());
        
        if (!captchaRow) return false;
        
        const expiry = new Date(captchaRow.expiry);
        if (new Date() > expiry) {
            await captchaRow.delete();
            return false;
        }
        
        const attempts = parseInt(captchaRow.attempts) + 1;
        captchaRow.attempts = attempts.toString();
        await captchaRow.save();
        
        if (captchaRow.captcha_text === userInput) {
            await captchaRow.delete();
            
            // Update user verification status
            const userSheet = doc.sheetsByTitle['Users'];
            const userRows = await userSheet.getRows();
            const user = userRows.find(row => row.user_id === userId.toString());
            if (user) {
                user.verified = 'true';
                await user.save();
            }
            
            return true;
        }
        
        if (attempts >= 3) {
            await captchaRow.delete();
            return false;
        }
        
        return false;
    } catch (error) {
        console.error('Error verifying captcha:', error);
        return false;
    }
}
