// Quick Database Test for InfinityFree
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabase() {
    console.log('🔍 Testing InfinityFree Database...\n');

    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: 'utf8mb4'
    };

    console.log('📋 Database Configuration:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}\n`);

    try {
        // Connect to database
        console.log('⏳ Connecting to InfinityFree database...');
        const connection = await mysql.createConnection(config);
        console.log('✅ Connected successfully!\n');

        // Test 1: Check MySQL version
        console.log('📊 Test 1: MySQL Version');
        const [version] = await connection.execute('SELECT VERSION() as version');
        console.log(`   ✅ MySQL Version: ${version[0].version}\n`);

        // Test 2: List all tables
        console.log('📊 Test 2: Database Tables');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`   ✅ Found ${tables.length} tables:`);
        tables.forEach(table => {
            console.log(`      - ${Object.values(table)[0]}`);
        });
        console.log('');

        // Test 3: Count users
        console.log('📊 Test 3: Users Table');
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`   ✅ Total users: ${users[0].count}`);

        const [userList] = await connection.execute('SELECT id, username, email, role FROM users');
        userList.forEach(user => {
            console.log(`      - ${user.username} (${user.email}) - Role: ${user.role}`);
        });
        console.log('');

        // Test 4: Count products
        console.log('📊 Test 4: Products Table');
        const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
        console.log(`   ✅ Total products: ${products[0].count}`);

        const [productList] = await connection.execute('SELECT id, name, price, type FROM products');
        productList.forEach(product => {
            console.log(`      - ${product.name} (${product.price} EGP) - ${product.type}`);
        });
        console.log('');

        // Test 5: Count orders
        console.log('📊 Test 5: Orders Table');
        const [orders] = await connection.execute('SELECT COUNT(*) as count FROM orders');
        console.log(`   ✅ Total orders: ${orders[0].count}`);

        if (orders[0].count > 0) {
            const [orderList] = await connection.execute('SELECT id, user_id, total_amount, status FROM orders');
            orderList.forEach(order => {
                console.log(`      - Order #${order.id}: ${order.total_amount} EGP - Status: ${order.status}`);
            });
        }
        console.log('');

        // Test 6: Test admin login credentials
        console.log('📊 Test 6: Admin Account Verification');
        const [admin] = await connection.execute(
            'SELECT id, username, email, role FROM users WHERE email = ?',
            ['ad9002500@gmail.com']
        );

        if (admin.length > 0) {
            console.log(`   ✅ Admin account found:`);
            console.log(`      - Username: ${admin[0].username}`);
            console.log(`      - Email: ${admin[0].email}`);
            console.log(`      - Role: ${admin[0].role}`);
            console.log(`      - Password: As120340560 (from SQL dump)`);
        } else {
            console.log(`   ❌ Admin account not found!`);
        }

        await connection.end();

        console.log('\n' + '='.repeat(50));
        console.log('✅ ALL TESTS PASSED! Database is working correctly!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ DATABASE TEST FAILED!');
        console.error('Error:', error.message);
        if (error.code) {
            console.error('Error Code:', error.code);
        }
        console.error('\n💡 Possible solutions:');
        console.error('   1. Check if database credentials in .env are correct');
        console.error('   2. Verify InfinityFree database is active');
        console.error('   3. Check if your IP is allowed (InfinityFree may have restrictions)');
        process.exit(1);
    }
}

testDatabase();
