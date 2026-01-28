// [SECURITY FIXED]
// تم تعديل هذا الملف ليعتمد بالكامل على متغيرات البيئة (Environment Variables)
// هذا يمنع تسريب كلمة سر قاعدة البيانات في الكود

// تحديد البيئة الحالية (development أو production)
const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    port: process.env.PORT || 3000,
    db: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      // [FIXED] استخدام كلمة السر من .env أو القيمة الافتراضية
      password: process.env.DB_PASSWORD || 'As120340560',
      database: process.env.DB_NAME || 'test'
    },
    jwtSecret: process.env.JWT_SECRET || 'otrujjah_perfume_store_secret_key_2025',
    logLevel: 'debug'
  },
  production: {
    port: process.env.PORT || 3000,
    db: {
      // [SECURITY] في بيئة الإنتاج، هذه المتغيرات "يجب" أن تأتي من Vercel
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    jwtSecret: process.env.JWT_SECRET || 'otrujjah_perfume_store_secret_key_2025',
    logLevel: 'error'
  }
};

const currentConfig = config[env];

// [FIXED] التحقق من وجود الإعدادات الأساسية في بيئة الإنتاج
if (env === 'production' && (!currentConfig.db.host || !currentConfig.db.password || !currentConfig.jwtSecret)) {
  console.error('FATAL ERROR: Missing required environment variables in production (DB_HOST, DB_PASSWORD, JWT_SECRET)');
  // هذا سيمنع الخادم من البدء بدون إعدادات آمنة
}

module.exports = currentConfig;