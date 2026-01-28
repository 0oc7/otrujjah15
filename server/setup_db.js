const mysql = require('mysql2/promise');
const db = require('./db');

async function setupDatabase() {
    console.log('🔄 Setting up database tables...');

    try {
        // 1. Users Table
        const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'client',
        roles TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `;
        await db.promise().query(createUsersTable);
        console.log('✅ Users table validated.');

        // Check if 'roles' column exists
        try {
            await db.promise().query("SELECT roles FROM users LIMIT 1");
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log('⚠️ Column "roles" missing in users. Adding it...');
                await db.promise().query("ALTER TABLE users ADD COLUMN roles TEXT");
                console.log('✅ Column "roles" added.');
            } else {
                throw err;
            }
        }

        // 2. Products Table
        const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image LONGTEXT,
        top_notes TEXT,
        middle_notes TEXT,
        base_notes TEXT,
        type VARCHAR(50),
        categories JSON,
        rating FLOAT DEFAULT 0,
        reviews INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `;
        await db.promise().query(createProductsTable);
        console.log('✅ Products table validated.');

        // Check if 'categories' column exists (it depends on when the DB was created)
        try {
            await db.promise().query("SELECT categories FROM products LIMIT 1");
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log('⚠️ Column "categories" missing in products. Adding it...');
                await db.promise().query("ALTER TABLE products ADD COLUMN categories JSON");
                console.log('✅ Column "categories" added.');
            }
        }


        // 3. Orders Table
        const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        payment_method VARCHAR(50),
        items JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `;
        await db.promise().query(createOrdersTable);
        console.log('✅ Orders table validated.');

        // 4. Admin User
        const checkAdmin = "SELECT * FROM users WHERE email = 'admin@otrujjah.com'";
        const [admins] = await db.promise().query(checkAdmin);

        if (admins.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const insertAdmin = `
        INSERT INTO users (username, email, password, role, roles) 
        VALUES ('Admin', 'admin@otrujjah.com', ?, 'admin', 'ROLE_ADMIN')
      `;
            await db.promise().query(insertAdmin, [hashedPassword]);
            console.log('✅ Default admin user created (admin@otrujjah.com / admin123).');
        } else {
            // Update admin roles if missing
            const adminUser = admins[0];
            if (!adminUser.roles) {
                await db.promise().query("UPDATE users SET roles = 'ROLE_ADMIN' WHERE id = ?", [adminUser.id]);
                console.log('✅ Admin user roles updated.');
            }
            console.log('ℹ️ Admin user verified.');
        }

        console.log('🎉 Database setup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error setting up database:', error);
        process.exit(1);
    }
}

setupDatabase();
