const jwt = require('jsonwebtoken');
// جلب المفتاح السري من ملف الإعدادات أو متغيرات البيئة
const JWT_SECRET = process.env.JWT_SECRET || 'otrujjah_perfume_store_secret_key_2025';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    console.log('❌ No token provided');
    return res.status(401).json({ success: false, error: 'No token provided, authorization denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(403).json({ success: false, error: 'Token is not valid' });
    }

    console.log('✅ Token verified for user:', {
      userId: user.userId,
      email: user.email,
      role: user.role,
      roles: user.roles
    });

    // [مهم] إضافة بيانات المستخدم (بما في ذلك ID والصلاحيات) إلى كائن الـ request
    req.user = user;
    next();
  });
}

function verifyAdminToken(req, res, next) {
  verifyToken(req, res, () => {
    // التحقق من أن المستخدم لديه صلاحية 'admin'
    const isAdmin = req.user.role === 'admin' ||
                    (req.user.roles && (
                      req.user.roles.includes('admin') ||
                      req.user.roles.includes('ROLE_ADMIN')
                    ));

    if (isAdmin) {
      console.log('✅ Admin verified:', req.user.email || req.user.username);
      next();
    } else {
      console.log('❌ Admin verification failed:', {
        role: req.user.role,
        roles: req.user.roles,
        email: req.user.email
      });
      res.status(403).json({ success: false, error: 'Requires admin role' });
    }
  });
}

module.exports = { verifyToken, verifyAdminToken };