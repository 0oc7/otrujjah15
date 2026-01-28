const express = require('express');
const db = require('../db');
// [FIXED] الآن هذا الملف موجود ويعمل
const { verifyAdminToken } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', verifyAdminToken, (req, res) => {
  // [FIXED] جلب البيانات الضرورية فقط بدلاً من كل شيء
  const sql = 'SELECT id, username, email, phone, role, created_at FROM users ORDER BY created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
    res.json(results); // [FIXED] إرجاع مصفوفة مباشرة كما تتوقع الواجهة الأمامية
  });
});

// Get user by ID (admin only)
router.get('/:id', verifyAdminToken, (req, res) => {
  const userId = req.params.id;
  const sql = 'SELECT id, username, email, phone, role, created_at FROM users WHERE id = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json(results[0]);
  });
});

// Update user (admin only)
router.put('/:id', verifyAdminToken, (req, res) => {
  const userId = req.params.id;
  const { username, email, role } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ success: false, error: 'Username and email are required' });
  }
  
  const validRole = (role === 'admin' || role === 'client') ? role : 'client';
  
  const sql = 'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?';
  
  db.query(sql, [username, email, validRole, userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User updated successfully' });
  });
});

// Delete user (admin only)
router.delete('/:id', verifyAdminToken, (req, res) => {
  const userId = req.params.id;
  
  // [SECURITY] لا تسمح للأدمن بحذف نفسه
  const tokenUserId = req.user.userId;
  if (String(userId) === String(tokenUserId)) {
     return res.status(400).json({ success: false, error: 'Admin cannot delete their own account' });
  }
  
  const sql = 'DELETE FROM users WHERE id = ?';
  
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  });
});

module.exports = router;