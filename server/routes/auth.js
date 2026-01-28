const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// جلب المفتاح السري من متغيرات البيئة أو استخدام قيمة افتراضية
const JWT_SECRET = process.env.JWT_SECRET || 'otrujjah_perfume_store_secret_key_2025';

/**
 * 🔒 [SECURITY FIX]
 * تسجيل مستخدم جديد (عميل فقط)
 */
router.post('/register', async (req, res) => {
  const { username, email, password, phone } = req.body;

  // 1. التحقق من المدخلات
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  try {
    // 2. التحقق من وجود المستخدم
    const checkUserSql = 'SELECT * FROM users WHERE email = ? OR username = ?';
    const [existingUsers] = await db.promise().query(checkUserSql, [email, username]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists with this email or username' });
    }

    // 3. تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. [FIXED] إنشاء مستخدم كـ "client" دائماً
    const userRole = 'client';

    // 5. حفظ المستخدم الجديد (مع رقم الهاتف)
    const insertUserSql = 'INSERT INTO users (username, email, password, phone, role, roles) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await db.promise().query(insertUserSql, [
      username,
      email,
      hashedPassword,
      phone || null,
      userRole,
      'ROLE_USER'
    ]);

    // 6. إنشاء توكن للمستخدم الجديد
    const token = jwt.sign(
      { userId: result.insertId, username, email, role: userRole, roles: ['ROLE_USER'] },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: {
        userId: result.insertId,
        username,
        email,
        role: userRole,
        roles: ['ROLE_USER']
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * 🔒 [FIXED]
 * تسجيل دخول العميل
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    // 1. البحث عن المستخدم
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [results] = await db.promise().query(sql, [email]);

    if (results.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = results[0];

    // 2. [FIXED] التحقق من أنه "عميل"
    if (user.role !== 'client') {
      return res.status(403).json({ success: false, error: 'Access denied. Please use admin login.' });
    }

    // 3. التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // 4. Parse roles array
    const rolesArray = user.roles ? user.roles.split(',') : ['ROLE_USER'];

    // 5. إنشاء التوكن
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        roles: rolesArray
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        roles: rolesArray
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    // 1. البحث عن المستخدم
    const sql = 'SELECT * FROM users WHERE email = ?';
    const [results] = await db.promise().query(sql, [email]);

    if (results.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }

    const user = results[0];

    // 2. [FIXED] التحقق من أنه "أدمن"
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Not an admin.' });
    }

    // 3. التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }

    // 4. إنشاء التوكن
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;