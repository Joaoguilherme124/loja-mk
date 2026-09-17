-- MK Gourmet - schema MySQL 5.5+
-- Execute este arquivo dentro do banco sql10837233.

USE sql10837233;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) NOT NULL,
  email VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'cliente',
  active TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image TEXT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  customerName VARCHAR(255) NOT NULL DEFAULT '',
  customerEmail VARCHAR(255) NOT NULL DEFAULT '',
  customerPhone VARCHAR(64) NOT NULL DEFAULT '',
  items TEXT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pendente',
  notes TEXT NULL,
  deliveryDate DATE NULL,
  deliveryTime VARCHAR(32) NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY orders_user_id (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  id TINYINT UNSIGNED NOT NULL,
  storeName VARCHAR(255) NOT NULL,
  tagline TEXT NOT NULL,
  whatsapp VARCHAR(32) NOT NULL,
  about TEXT NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  discountLabel VARCHAR(100) NOT NULL,
  image TEXT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS news (
  id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image TEXT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO settings (id, storeName, tagline, whatsapp, about)
SELECT 1, 'MK Gourmet',
  'Peças feitas com carinho, do nosso ateliê para a sua casa.',
  '5511999999999',
  'Uma loja acolhedora para descobrir novidades, promoções e encomendar pelo WhatsApp com facilidade.'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
