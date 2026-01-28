const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
// استيراد الملفات التي قمنا بإنشائها/إصلاحها
const { verifyToken, verifyAdminToken } = require('./middleware/auth');
const { rateLimit, validateInput, preventXSS, hideServerInfo } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// --- إعدادات الأمان و CORS ---
app.use(hideServerInfo);

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://otrojjah.vercel.app',
      'https://otrojjah-admin.vercel.app'
    ];
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// إصلاح UTF-8 encoding للـ responses
// [FIXED] فقط لـ API responses وليس لجميع responses
// This needs to be placed AFTER static file serving to avoid affecting HTML files

// --- 1. تقديم ملفات المتجر (Client) و Admin ---
// --- 1. تقديم ملفات المتجر (Client) و Admin ---
// Vercel path resolution: Files are usually at process.cwd() + /client
const clientPath = path.join(process.cwd(), 'client');
const adminPath = path.join(process.cwd(), 'admin');

console.log('📂 Setting Static Paths:');
console.log('   Client:', clientPath);
console.log('   Admin:', adminPath);

// Serve static files FIRST
app.use(express.static(clientPath));
app.use('/admin', express.static(adminPath));
app.use('/assets', express.static(path.join(clientPath, 'assets'))); // Explicit assets route

// Serve static files FIRST (before any API routes)
app.use(express.static(clientPath));
app.use('/admin', express.static(adminPath));

// Debugging Assets Route
app.get('/assets/*', (req, res) => {
  const assetPath = path.join(clientPath, req.path);
  if (fs.existsSync(assetPath)) {
    res.sendFile(assetPath);
  } else {
    // List contents of assets folder to see what IS there
    const assetsDir = path.join(clientPath, 'assets');
    const available = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : 'Assets folder missing';

    res.status(404).json({
      error: "Asset not found",
      requestedPath: assetPath,
      clientPath: clientPath,
      availableFiles: available
    });
  }
});

// NOW we can apply JSON content-type to API routes only
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// --- 2. مسارات الـ API (يجب أن تأتي بعد Static files) ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// --- 3. تقديم ملفات لوحة التحكم (Admin) ---
// جعل /admin يفتح index.html الخاص بالأدمن
app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

// --- 4. معالجة إعادة تحميل الصفحات (SPA Fallback) ---
// هذا يجعل أي مسار لا يتعرف عليه (وليس API أو Admin) يرجع إلى index.html الخاص بالمتجر

// Root Handler
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.get('*', (req, res) => {
  // Only block strictly known API prefixes
  if (req.path.startsWith('/api/') || (req.path.startsWith('/admin/') && !req.path.includes('.'))) {
    if (req.path === '/admin') {
      const adminDir = path.join(process.cwd(), 'admin');
      if (fs.existsSync(path.join(adminDir, 'index.html'))) {
        return res.sendFile(path.join(adminDir, 'index.html'));
      }
    }
    return res.status(404).send('Not found');
  }

  // For everything else, serve the client app (fallback)
  const clientDir = path.join(process.cwd(), 'client');
  const indexPath = path.join(clientDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`Not Found (Static file missing). Path checked: ${indexPath}`);
  }
});

// --- تشغيل الخادم (فقط في بيئة التطوير المحلية) ---
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Store available at: http://localhost:3000`);
    console.log(`Admin panel available at: http://localhost:3000/admin`);

    // التحقق من اتصال قاعدة البيانات
    db.promise().query('SELECT 1')
      .then(([results]) => {
        console.log('✅ Database connection successful.');
      })
      .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        console.error('💡 Please ensure MySQL server is running and credentials in server/config/env.js are correct.');
      });
  });
}

module.exports = app;