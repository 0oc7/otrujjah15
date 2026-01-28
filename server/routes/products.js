const express = require('express');
const db = require('../db');
const { verifyAdminToken } = require('../middleware/auth'); // استيراد middleware المصادقة

const router = express.Router();

// Get all products (لجميع الزوار)
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM products ORDER BY created_at DESC';

  // Use promise-based approach for database queries
  db.promise().query(sql)
    .then(([results]) => {
      // تأكد من UTF-8 encoding
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json(results);
    })
    .catch(err => {
      console.error('Database error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
});

// Get product by ID (لجميع الزوار)
router.get('/:id', (req, res) => {
  const productId = req.params.id;
  const sql = 'SELECT * FROM products WHERE id = ?';
  
  db.promise().query(sql, [productId])
    .then(([results]) => {
      if (results.length === 0) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json(results[0]);
    })
    .catch(err => {
      console.error('Database error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
});

// Search products by name (لجميع الزوار)
router.get('/search/:name', (req, res) => {
  const name = req.params.name;
  const sql = 'SELECT * FROM products WHERE name LIKE ?';
  
  db.promise().query(sql, [`%${name}%`])
    .then(([results]) => {
      res.json(results);
    })
    .catch(err => {
      console.error('Database error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
});

/**
 * 🔒 [PERFORMANCE FIX]
 * البحث حسب الفئة
 * تم تغيير الاستعلام من LIKE إلى JSON_CONTAINS
 */
router.get('/category/:category', (req, res) => {
  const category = req.params.category;
  
  // [FIXED] هذا الاستعلام يبحث عن "category" كعنصر داخل مصفوفة الـ JSON
  // مثال: البحث عن "men" سيتطابق مع ["men", "summer"]
  const sql = 'SELECT * FROM products WHERE JSON_CONTAINS(categories, ?)';
  
  // يجب أن نرسل القيمة كـ JSON string (نص JSON)
  const searchValue = JSON.stringify(category); 

  db.promise().query(sql, [searchValue])
    .then(([results]) => {
      res.json(results);
    })
    .catch(err => {
      console.error('Database error (JSON_CONTAINS):', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
});

// --- Admin Routes (Protected) ---

// Admin: Add new product
router.post('/', verifyAdminToken, (req, res) => {
  const { name, description, price, image, top_notes, middle_notes, base_notes, type, categories } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ success: false, error: 'Name and price are required' });
  }
  
  const sql = 'INSERT INTO products (name, description, price, image, top_notes, middle_notes, base_notes, type, categories, rating, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)';
  
  // [FIXED] التأكد من أن categories هي JSON string
  const safeCategories = Array.isArray(categories) ? JSON.stringify(categories) : (categories || JSON.stringify([]));
  
  const values = [name, description, price, image, top_notes, middle_notes, base_notes, type || 'محايد', safeCategories];
  
  db.promise().query(sql, values)
    .then(([result]) => {
      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        productId: result.insertId
      });
    })
    .catch(err => {
      console.error('Database error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
});

// Admin: Update product
router.put('/:id', verifyAdminToken, (req, res) => {
  const productId = req.params.id;
  const { name, description, price, image, top_notes, middle_notes, base_notes, type, categories } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ success: false, error: 'Name and price are required' });
  }

  // [FIXED] التأكد من أن categories هي JSON string
  const safeCategories = Array.isArray(categories) ? JSON.stringify(categories) : (categories || JSON.stringify([]));
  
  const sql = 'UPDATE products SET name = ?, description = ?, price = ?, image = ?, top_notes = ?, middle_notes = ?, base_notes = ?, type = ?, categories = ? WHERE id = ?';
  const values = [name, description, price, image, top_notes, middle_notes, base_notes, type || 'محايد', safeCategories, productId];
  
  db.promise().query(sql, values)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, message: 'Product updated successfully' });
    })
    .catch(err => {
      console.error('Database error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
});

// Admin: Delete product
router.delete('/:id', verifyAdminToken, (req, res) => {
  const productId = req.params.id;
  const sql = 'DELETE FROM products WHERE id = ?';
  
  db.promise().query(sql, [productId])
    .then(([result]) => {
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      res.json({ success: true, message: 'Product deleted successfully' });
    })
    .catch(err => {
      console.error('Database error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
});

module.exports = router;