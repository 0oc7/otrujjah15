-- ==========================================
-- INFINITYFREE DATABASE SETUP
-- ==========================================
-- Database: if0_40999964_perfume_store_db
-- Note: InfinityFree databases use utf8mb4_general_ci collation
-- ==========================================

USE if0_40999964_perfume_store_db;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. DROP Tables
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;

-- 2. Create Users Table
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `role` enum('client','admin') DEFAULT 'client',
  `roles` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Insert Users (With Verified Hashes)
-- Admin Password: As120340560
-- User Password: 123456
INSERT INTO `users` (`id`, `username`, `email`, `password`, `phone`, `role`, `roles`) VALUES
(1, 'admin', 'ad9002500@gmail.com', '$2a$10$SCTk7HpsEd9S/QKBBhM2tuxK9BbAdt5gByCQkYuFBOU107EGUwGZW', '01000000000', 'admin', 'ROLE_ADMIN'),
(3, 'abdo', 'as9002500@gmail.com', '$2a$10$BCWsP.FATLtL9q3Y45KLLOin8iIGBFiPqtemnIh36KWBz2GXayE6G', '01100000000', 'client', 'ROLE_USER');

-- 4. Create Roles Tables (Optional but in schema)
CREATE TABLE `roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_role_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `user_roles` (
  `user_id` bigint unsigned NOT NULL,
  `role_id` int unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `FK_user_roles_role_id` (`role_id`),
  CONSTRAINT `FK_user_roles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_user_roles_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. Create Products Table
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `top_notes` text,
  `middle_notes` text,
  `base_notes` text,
  `type` enum('رجالي','نسائي','محايد') DEFAULT 'محايد',
  `categories` json DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT '0.00',
  `reviews` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. Insert Products Data
INSERT INTO `products` (`id`, `name`, `description`, `price`, `image`, `type`) VALUES 
(23, 'ون ميليون', 'عطر رجالي فاخر يتميز برائحة جذابة وقوية.', 1000.00, 'assets/images/products/pngtree-blue-square-bottle-perfume-png-image_5716287_1761582563788.jpeg', 'رجالي'),
(24, 'عطر الزهور', 'عطر نسائي رقيق برائحة الزهور الطبيعية.', 200.00, 'assets/images/products/pngtree-3d-perfume-bottle-yellow-png-image_4523147_1761582574872.png', 'نسائي'),
(25, 'عود ملكي', 'عطر شرقي فاخر من العود الأصلي.', 500.00, 'assets/images/products/images (1)_1761582594436.jpeg', 'رجالي');

-- 7. Create Orders Table
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `products` json NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  `shipping_address` json NOT NULL,
  `payment_method` enum('cod','vodafone','instapay') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. Insert Orders Data
INSERT INTO `orders` (`id`, `user_id`, `products`, `total_amount`, `status`, `shipping_address`, `payment_method`) VALUES 
(5, 3, '[{"product_id": 23, "quantity": 1}]', 1000.00, 'pending', '{"address": "Cairo, Egypt", "city": "Cairo"}', 'cod');

-- 9. Create Reviews Table
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `product_id` int NOT NULL,
  `rating` int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
