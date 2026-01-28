const express = require('express');
const db = require('../db');
const { verifyToken, verifyAdminToken } = require('../middleware/auth');

const router = express.Router();

// [FIXED] سعر الشحن يجب أن يكون ثابتاً على الخادم
const SHIPPING_COST = 50.00; 

/**
 * 🔒 [SECURITY FIX]
 * جلب طلبات المستخدم الحالي (فقط)
 * المسار تم تعديله ليطابق الواجهة الأمامية
 */
router.get('/user/:userId', verifyToken, (req, res) => {
  const requestedUserId = req.params.userId;
  const tokenUserId = req.user.userId; // [FIXED] ID المستخدم من التوكن الآمن

  // [FIXED] التأكد من أن المستخدم يطلب بياناته فقط
  if (String(requestedUserId) !== String(tokenUserId)) {
      return res.status(403).json({ success: false, error: 'Access Denied: You can only view your own orders.' });
  }

  const sql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
  
  db.query(sql, [tokenUserId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error' 
      });
    }
    res.json({
      success: true,
      data: results
    });
  });
});

/**
 * 🔒 [SECURITY FIX]
 * جلب طلب واحد للمستخدم الحالي (فقط)
 */
router.get('/:id', verifyToken, (req, res) => {
  const orderId = req.params.id;
  const tokenUserId = req.user.userId; // [FIXED] ID المستخدم من التوكن الآمن

  const sql = 'SELECT * FROM orders WHERE id = ? AND user_id = ?';
  
  db.query(sql, [orderId, tokenUserId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    
    if (results.length === 0) {
      // إما الطلب غير موجود، أو لا يملكه هذا المستخدم
      return res.status(404).json({ message: 'Order not found or access denied' });
    }
    
    res.json(results[0]);
  });
});

/**
 * 🔒 [CRITICAL SECURITY FIX]
 * إنشاء طلب جديد
 * هذه الدالة أعيدت كتابتها بالكامل لتكون آمنة
 */
router.post('/', verifyToken, async (req, res) => {
  console.log('📦 Received order request');
  
  // [FIXED] البيانات الوحيدة التي نثق بها من العميل
  const { products, shipping_address, payment_method } = req.body;
  
  // [FIXED] ID المستخدم نأخذه من التوكن الموثوق، وليس من الـ body
  const tokenUserId = req.user.userId;

  // 1. التحقق من المدخلات الأساسية
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ success: false, error: 'Products array is required and cannot be empty' });
  }
  if (!shipping_address) {
    return res.status(400).json({ success: false, error: 'shipping_address is required' });
  }
  if (!payment_method) {
    return res.status(400).json({ success: false, error: 'payment_method is required' });
  }

  try {
    // 2. استخراج IDs المنتجات المطلوبة
    const productIds = products.map(p => p.id);
    if (productIds.some(id => !id)) {
        return res.status(400).json({ success: false, error: 'Invalid product ID found in order' });
    }

    // 3. [الأهم] جلب أسعار المنتجات الحقيقية من قاعدة البيانات
    const [dbProducts] = await db.promise().query(
      `SELECT id, name, price, image FROM products WHERE id IN (?)`,
      [productIds]
    );

    let calculatedTotalAmount = 0;
    const safeProductList = []; // قائمة المنتجات الآمنة بالأسعار الصحيحة

    // 4. [الأهم] حساب السعر الإجمالي هنا في الخادم
    for (const item of products) {
      const dbProduct = dbProducts.find(p => p.id === item.id);
      
      if (!dbProduct) {
        return res.status(400).json({ success: false, error: `Product with ID ${item.id} not found` });
      }
      
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity < 1) {
         return res.status(400).json({ success: false, error: `Invalid quantity for product ${item.id}` });
      }

      // حساب سعر هذا العنصر بناءً على سعر قاعدة البيانات
      const itemPrice = parseFloat(dbProduct.price);
      calculatedTotalAmount += itemPrice * quantity;

      // بناء قائمة المنتجات الآمنة التي سيتم حفظها
      safeProductList.push({
        id: dbProduct.id,
        name: dbProduct.name,
        price: itemPrice, // [FIXED] استخدام السعر من قاعدة البيانات
        quantity: quantity,
        image: dbProduct.image
      });
    }

    // 5. إضافة سعر الشحن الثابت
    calculatedTotalAmount += SHIPPING_COST;

    // 6. حفظ الطلب في قاعدة البيانات بالبيانات الموثوقة
    const sql = 'INSERT INTO orders (user_id, products, total_amount, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?)';
    const values = [
      tokenUserId, // [FIXED] ID المستخدم من التوكن
      JSON.stringify(safeProductList), // [FIXED] قائمة المنتجات بالأسعار الصحيحة
      calculatedTotalAmount, // [FIXED] السعر الإجمالي المحسوب
      JSON.stringify(shipping_address), 
      payment_method
    ];

    const [result] = await db.promise().query(sql, values);

    console.log('✅ Order created successfully with ID:', result.insertId);
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      data: {
        orderId: result.insertId
      }
    });

  } catch (err) {
    console.error('❌ Database error creating order:', err.message);
    return res.status(500).json({ 
      success: false,
      error: 'فشل حفظ الطلب: ' + err.message
    });
  }
});

// --- دوال الأدمن (كما هي، محمية بـ verifyAdminToken) ---

// Update order status (admin only)
router.put('/:id/status', verifyAdminToken, (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  
  const sql = 'UPDATE orders SET status = ? WHERE id = ?';
  
  db.query(sql, [status, orderId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order status updated successfully' });
  });
});

// Admin: Get all orders
router.get('/admin/all', verifyAdminToken, (req, res) => {
  const sql = 'SELECT o.*, u.username, u.email, u.phone FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.json(results);
  });
});

// Admin: Get single order details
router.get('/admin/:id', verifyAdminToken, (req, res) => {
  const orderId = req.params.id;
  const sql = 'SELECT o.*, u.username, u.email, u.phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?';

  db.query(sql, [orderId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json(results[0]);
  });
});

// Admin: Update order
router.put('/admin/:id', verifyAdminToken, (req, res) => {
  const orderId = req.params.id;
  const { status, shipping_address, payment_method } = req.body;
  
  let sql = 'UPDATE orders SET ';
  let values = [];
  let updates = [];
  
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (shipping_address) {
    updates.push('shipping_address = ?');
    values.push(JSON.stringify(shipping_address));
  }
  if (payment_method) {
    updates.push('payment_method = ?');
    values.push(payment_method);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }
  
  sql += updates.join(', ') + ' WHERE id = ?';
  values.push(orderId);
  
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order updated successfully' });
  });
});

// Admin: Delete order
router.delete('/admin/:id', verifyAdminToken, (req, res) => {
  const orderId = req.params.id;
  const sql = 'DELETE FROM orders WHERE id = ?';
  
  db.query(sql, [orderId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  });
});

module.exports = router;