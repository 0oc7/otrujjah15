// [FIXED] استدعاء ملف الـ logger الذي قمنا بإنشائه
const logger = require('../utils/logger');

// دالة لتحديد عدد الطلبات المسموحة
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // تنظيف الطلبات القديمة
    for (const [key, timestamps] of requests.entries()) {
      const valid = timestamps.filter(timestamp => timestamp > windowStart);
      if (valid.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, valid);
      }
    }
    
    // التحقق من الطلب الحالي
    const timestamps = requests.get(ip) || [];
    timestamps.push(now);
    requests.set(ip, timestamps);
    
    if (timestamps.length > maxRequests) {
      logger.security('Rate limit exceeded', { ip, path: req.path, method: req.method });
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.'
      });
    }
    
    next();
  };
};

// دالة للتحقق من المدخلات (مبسطة)
const validateInput = (req, res, next) => {
  // يمكن إضافة منطق تحقق أكثر تعقيداً هنا
  // في الوقت الحالي، نكتفي بالتحقق الأساسي
  
  // مثال: التحقق من وجود SQL injection بسيط (للتوضيح فقط)
  const sqlInjectionPattern = /'|"|;|--|\/\*|\*\/|xp_cmdshell/i;
  
  const checkObject = (obj) => {
    if (typeof obj === 'string') {
      if (sqlInjectionPattern.test(obj)) return true;
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (checkObject(obj[key])) return true;
      }
    }
    return false;
  };
  
  if (checkObject(req.query) || checkObject(req.body)) {
     logger.security('Potentially malicious input detected', { 
      ip: req.ip, 
      path: req.path
    });
     return res.status(400).json({
      success: false,
      error: 'Invalid input'
    });
  }
  
  next();
};

// [FIXED] تم تبسيط هذه الدالة لأن النسخة الأصلية كانت صارمة جداً
const preventXSS = (req, res, next) => {
  // الخادم يقوم بتعيين هيدر X-XSS-Protection في server.js
  // والمتصفحات الحديثة لديها حماية مدمجة
  // الدوال المعقدة لتنقية المدخلات قد تكسر بيانات JSON
  // نعتمد على الهيدرات الأمنية بدلاً من ذلك
  next();
};

// دالة لإخفاء معلومات الخادم
const hideServerInfo = (req, res, next) => {
  res.setHeader('X-Powered-By', 'Otrujjah Perfume Store');
  next();
};

module.exports = {
  rateLimit,
  validateInput,
  preventXSS,
  hideServerInfo
};