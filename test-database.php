<?php
// InfinityFree Database Connection Test
// Upload this file to your InfinityFree hosting and access it via browser

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Database Test - Otrujjah Perfume Store</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🔍 InfinityFree Database Test</h1>
    
    <?php
    // Database credentials
    $host = 'sql211.infinityfree.com';
    $dbname = 'if0_40999964_perfume_store_db';
    $username = 'if0_40999964';
    $password = 'bJXuPxcuZyHUok';
    
    echo "<div class='test-section'>";
    echo "<h2>📋 Configuration</h2>";
    echo "<p><strong>Host:</strong> $host</p>";
    echo "<p><strong>Database:</strong> $dbname</p>";
    echo "<p><strong>User:</strong> $username</p>";
    echo "</div>";
    
    try {
        // Connect to database
        echo "<div class='test-section'>";
        echo "<h2>⏳ Connecting to Database...</h2>";
        
        $conn = new mysqli($host, $username, $password, $dbname);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        echo "<p class='success'>✅ Connected successfully!</p>";
        echo "</div>";
        
        // Test 1: MySQL Version
        echo "<div class='test-section'>";
        echo "<h2>📊 Test 1: MySQL Version</h2>";
        $result = $conn->query("SELECT VERSION() as version");
        $row = $result->fetch_assoc();
        echo "<p class='success'>✅ MySQL Version: " . $row['version'] . "</p>";
        echo "</div>";
        
        // Test 2: List Tables
        echo "<div class='test-section'>";
        echo "<h2>📊 Test 2: Database Tables</h2>";
        $result = $conn->query("SHOW TABLES");
        echo "<p class='success'>✅ Found " . $result->num_rows . " tables:</p>";
        echo "<ul>";
        while ($row = $result->fetch_array()) {
            echo "<li>" . $row[0] . "</li>";
        }
        echo "</ul>";
        echo "</div>";
        
        // Test 3: Users
        echo "<div class='test-section'>";
        echo "<h2>📊 Test 3: Users Table</h2>";
        $result = $conn->query("SELECT id, username, email, role FROM users");
        echo "<p class='success'>✅ Total users: " . $result->num_rows . "</p>";
        echo "<table>";
        echo "<tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th></tr>";
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . $row['username'] . "</td>";
            echo "<td>" . $row['email'] . "</td>";
            echo "<td>" . $row['role'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        echo "</div>";
        
        // Test 4: Products
        echo "<div class='test-section'>";
        echo "<h2>📊 Test 4: Products Table</h2>";
        $result = $conn->query("SELECT id, name, price, type FROM products");
        echo "<p class='success'>✅ Total products: " . $result->num_rows . "</p>";
        echo "<table>";
        echo "<tr><th>ID</th><th>Name</th><th>Price</th><th>Type</th></tr>";
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td>" . $row['name'] . "</td>";
            echo "<td>" . $row['price'] . " EGP</td>";
            echo "<td>" . $row['type'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        echo "</div>";
        
        // Test 5: Orders
        echo "<div class='test-section'>";
        echo "<h2>📊 Test 5: Orders Table</h2>";
        $result = $conn->query("SELECT id, user_id, total_amount, status FROM orders");
        echo "<p class='success'>✅ Total orders: " . $result->num_rows . "</p>";
        if ($result->num_rows > 0) {
            echo "<table>";
            echo "<tr><th>Order ID</th><th>User ID</th><th>Amount</th><th>Status</th></tr>";
            while ($row = $result->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $row['id'] . "</td>";
                echo "<td>" . $row['user_id'] . "</td>";
                echo "<td>" . $row['total_amount'] . " EGP</td>";
                echo "<td>" . $row['status'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
        echo "</div>";
        
        echo "<div class='test-section' style='background-color: #d4edda; border-color: #c3e6cb;'>";
        echo "<h2 class='success'>✅ ALL TESTS PASSED!</h2>";
        echo "<p>Your InfinityFree database is working correctly and ready for deployment!</p>";
        echo "</div>";
        
        $conn->close();
        
    } catch (Exception $e) {
        echo "<div class='test-section' style='background-color: #f8d7da; border-color: #f5c6cb;'>";
        echo "<h2 class='error'>❌ TEST FAILED!</h2>";
        echo "<p class='error'>Error: " . $e->getMessage() . "</p>";
        echo "</div>";
    }
    ?>
    
    <div class='test-section'>
        <h2>📝 Admin Login Credentials</h2>
        <p><strong>Email:</strong> ad9002500@gmail.com</p>
        <p><strong>Password:</strong> As120340560</p>
    </div>
</body>
</html>
