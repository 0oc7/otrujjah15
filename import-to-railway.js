// Try to load mysql2 from server/node_modules if not found in root
let mysql;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  try {
    // Attempt to resolve from the server directory
    mysql = require('./server/node_modules/mysql2/promise');
  } catch (e2) {
    console.error('❌ Could not find "mysql2". Please run "npm install mysql2" in this directory.');
    console.error('Original error:', e.message);
    process.exit(1);
  }
}
const fs = require('fs');
const path = require('path');

// بيانات الاتصال بـ Railway (Destination)
const railwayConfig = {
  host: 'switchyard.proxy.rlwy.net',
  port: 56688,
  user: 'root',
  password: 'KbEtnoMKqdXunBCWvuhtFRYZxpnbTzNC',
  database: 'railway',
  multipleStatements: true,
  connectTimeout: 60000,
  waitForConnections: true
};

// بيانات الاتصال المحلية (Source) - حاولنا استنتاجها أو استخدام قيم افتراضية شائعة
const localConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: process.env.DB_PASSWORD || 'As120340560', // كلمة المرور الافتراضية من الكود السابق
  database: 'perfume_store_db',
  multipleStatements: true
};

// Helper: Retry connection
async function connectWithRetry(config, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await mysql.createConnection(config);
    } catch (err) {
      console.error(`⚠️ خطأ في الاتصال (محاولة ${i + 1}/${maxRetries}): ${err.message}`);
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
    }
  }
}

async function migrateDatabase() {
  let localConnection;
  let railwayConnection;

  try {
    console.log('🚀 بدء عملية الترحيل (Migration Route)...');
    console.log('');

    // 1. الاتصال بقاعدة البيانات المحلية
    console.log('📥 جاري الاتصال بقاعدة البيانات المحلية...');
    try {
      localConnection = await mysql.createConnection(localConfig);
      console.log('✅ تم الاتصال محلياً.');
    } catch (err) {
      console.error('❌ فشل الاتصال بقاعدة البيانات المحلية.');
      console.error('   Error:', err.message);
      console.error('   يرجى التأكد من تشغيل XAMPP/MySQL وأن البيانات صحيحة.');
      process.exit(1);
    }

    // 2. تصدير البيانات (Export)
    console.log('📦 جاري تصدير البيانات من المحلي...');
    const [tables] = await localConnection.query('SHOW TABLES');
    let sqlDump = '';

    // إعداد: تعطيل قيود المفاتيح الأجنبية
    sqlDump += "SET FOREIGN_KEY_CHECKS = 0;\n\n";

    for (const tableEntry of tables) {
      const tableName = Object.values(tableEntry)[0];

      // تفريغ الجدول القديم إذا وجد
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;

      // هيكل الجدول
      const [createResults] = await localConnection.query(`SHOW CREATE TABLE \`${tableName}\``);
      sqlDump += `${createResults[0]['Create Table']};\n\n`;

      // البيانات
      const [rows] = await localConnection.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');

        // تقسيم الإدخال (Batch Insert) لتجنب الأوامر الطويلة جداً
        const chunkSize = 100; // عدد الصفوف لكل جملة INSERT
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const values = chunk.map(row => {
            return '(' + Object.values(row).map(val => {
              if (val === null) return 'NULL';
              if (typeof val === 'number') return val;
              // Escape quotes and backslashes
              return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
            }).join(', ') + ')';
          }).join(',\n');

          sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES \n${values};\n`;
        }
        sqlDump += "\n";
      }
    }

    // إعادة تفعيل القيود
    sqlDump += "SET FOREIGN_KEY_CHECKS = 1;\n";
    console.log('✅ تم تصدير البيانات بنجاح.');

    // حفظ ملف النسخة الاحتياطية محلياً (احتياطي)
    const dumpFileName = 'railway-dump.sql';
    fs.writeFileSync(path.join(__dirname, dumpFileName), sqlDump);
    console.log(`💾 تم حفظ نسخة من البيانات في الملف: ${dumpFileName}`);

    // 3. الاتصال بـ Railway
    console.log('📤 جاري الاتصال بـ Railway MySQL...');
    try {
      railwayConnection = await connectWithRetry(railwayConfig);
      console.log('✅ تم الاتصال بـ Railway.');
    } catch (err) {
      console.error('❌ فشل الاتصال بـ Railway بعد عدة محاولات.');
      console.error('   Error:', err.message);
      console.error('');
      console.error('⚠️ الحل البديل (Manual Import):');
      console.error('   1. لديك الآن ملف اسمه "railway-dump.sql" يحتوي على كل بياناتك.');
      console.error('   2. قم بتحميل برنامج DBeaver أو TablePlus.');
      console.error('   3. استخدم بيانات الاتصال التالية:');
      console.error(`      Host: ${railwayConfig.host}`);
      console.error(`      Port: ${railwayConfig.port}`);
      console.error(`      User: ${railwayConfig.user}`);
      console.error(`      Password: ${railwayConfig.password}`);
      console.error(`      Database: ${railwayConfig.database}`);
      console.error('   4. بعد الاتصال، قم بتشغيل محتوى الملف "railway-dump.sql" هناك.');
      process.exit(1);
    }

    // 4. استيراد البيانات (Import)
    console.log('🔄 جاري رفع البيانات...');
    await railwayConnection.query(sqlDump);
    console.log('✅ تم استيراد البيانات إلى Railway بنجاح!');

    // 5. التحقق
    // عرض الجداول
    const [remoteTables] = await railwayConnection.query('SHOW TABLES');
    console.log('📋 الجداول في Railway الآن:');
    remoteTables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
    });

    console.log('');
    console.log('🎉 تمت عملية النشر بنجاح!');
    console.log('   الآن أكمل خطوات النشر في الدليل (Deployment Guide).');

  } catch (error) {
    console.error('❌ حدث خطأ غير متوقع:', error);
  } finally {
    if (localConnection) await localConnection.end();
    if (railwayConnection) await railwayConnection.end();
  }
}

// تشغيل
migrateDatabase();
