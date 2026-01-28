const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
// [FIXED] استيراد middleware المصادقة للتحقق من أن المستخدم هو أدمن
const { verifyAdminToken } = require('../middleware/auth');

// تأكيد وجود مجلد الرفع (سيعمل محلياً فقط)
const uploadDir = path.join(__dirname, '../../client/assets/images/products');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created upload directory:', uploadDir);
  } catch (e) {
    // هذا الخطأ متوقع على Vercel لأن نظام الملفات للقراءة فقط
    console.warn('Could not create upload directory (this is expected on Vercel):', e.message);
  }
}

/**
 * 🔒 [SECURITY FIXED]
 * تم إضافة verifyAdminToken لحماية هذا المسار
 * الآن فقط الأدمن يمكنه رفع الصور
 */
router.post('/', verifyAdminToken, (req, res) => {
  try {
    const { image, fileName } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        success: false,
        error: 'No image data provided' 
      });
    }

    // استخراج بيانات base64
    let base64Data = image;
    let fileExtension = 'png';
    
    // التحقق مما إذا كان data URL
    if (image.includes('data:image')) {
      const matches = image.match(/data:image\/(\w+);base64,(.+)/);
      if (matches) {
        fileExtension = matches[1];
        base64Data = matches[2];
      } else {
        base64Data = image.split(',')[1] || image;
      }
    }

    // إنشاء اسم ملف فريد
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const finalFileName = fileName 
      ? `${fileName.replace(/\.[^/.]+$/, '')}_${timestamp}.${fileExtension}`
      : `product_${timestamp}_${randomStr}.${fileExtension}`;
    
    const filePath = path.join(uploadDir, finalFileName);
    
    // [FIXED] إضافة معالجة خطأ للكتابة على Vercel
    try {
        fs.writeFileSync(filePath, base64Data, 'base64');
    } catch (e) {
        console.error('File system write error:', e.message);
        // هذا الخطأ سيحدث دائماً على Vercel
        return res.status(500).json({
            success: false,
            error: 'File system error. Note: Vercel file system is read-only. Use cloud storage (like S3 or Cloudinary) for uploads in production.'
        });
    }
    
    // إرجاع المسار النسبي الصحيح للعميل
    const imageUrl = `assets/images/products/${finalFileName}`;
    
    console.log('Image uploaded successfully:', imageUrl);
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      fileName: finalFileName
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload image: ' + error.message 
    });
  }
});

/**
 * 🔒 [SECURITY FIXED]
 * تم تأمين هذا المسار أيضاً (لصالح الأدمن فقط)
 */
router.post('/url', verifyAdminToken, (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false,
        error: 'No image URL provided' 
      });
    }

    // التحقق من صحة الرابط (بسيط)
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('assets/')) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid image URL' 
      });
    }

    res.json({
      success: true,
      message: 'Image URL validated',
      imageUrl: imageUrl
    });
    
  } catch (error) {
    console.error('URL validation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to validate URL: ' + error.message 
    });
  }
});

module.exports = router;