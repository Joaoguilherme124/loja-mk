import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";
import { defaultStore } from "./seed";
import type {
  NewsItem,
  Order,
  Product,
  Promotion,
  StoreData,
  User,
} from "./types";

type UserRow = RowDataPacket & User;
type ProductRow = RowDataPacket & {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  featured: number;
  active: number;
  createdAt: string;
};
type OrderRow = RowDataPacket & {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: string | Order["items"];
  total: number;
  status: Order["status"];
  notes: string;
  deliveryDate: string;
  deliveryTime: string;
  createdAt: string;
  updatedAt: string;
};

export type DatabaseData = StoreData & { users: User[]; orders: Order[] };

let pool: Pool | undefined;
let initialized: Promise<void> | undefined;

function getPool(): Pool {
  if (!pool) throw new Error("Pool de conexão não foi inicializado.");
  return pool;
}

async function initializeDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não foi configurada.");

  pool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const db = getPool();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      passwordHash VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'cliente',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image TEXT NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(191) PRIMARY KEY,
      userId VARCHAR(191) NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pendente',
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id TINYINT UNSIGNED PRIMARY KEY,
      storeName VARCHAR(255) NOT NULL,
      tagline TEXT NOT NULL,
      whatsapp VARCHAR(32) NOT NULL,
      about TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS promotions (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      discountLabel VARCHAR(100) NOT NULL,
      image TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS news (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      image TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await addColumnIfMissing(
    db,
    "products",
    "featured",
    "BOOLEAN NOT NULL DEFAULT FALSE"
  );
  await addColumnIfMissing(
    db,
    "products",
    "createdAt",
    "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
  );
  await addColumnIfMissing(
    db,
    "orders",
    "customerName",
    "VARCHAR(255) NOT NULL DEFAULT ''"
  );
  await addColumnIfMissing(
    db,
    "orders",
    "customerEmail",
    "VARCHAR(255) NOT NULL DEFAULT ''"
  );
  await addColumnIfMissing(
    db,
    "orders",
    "customerPhone",
    "VARCHAR(64) NOT NULL DEFAULT ''"
  );
  await addColumnIfMissing(db, "orders", "items", "TEXT NULL");
  await addColumnIfMissing(db, "orders", "notes", "TEXT NULL");
  await addColumnIfMissing(db, "orders", "deliveryDate", "DATE NULL");
  await addColumnIfMissing(
    db,
    "orders",
    "deliveryTime",
    "VARCHAR(32) NOT NULL DEFAULT ''"
  );
  await addColumnIfMissing(
    db,
    "orders",
    "updatedAt",
    "TIMESTAMP NOT NULL"
  );

  const [settings] = await db.query<RowDataPacket[]>("SELECT id FROM settings WHERE id = 1");
  if (settings.length === 0) {
    const s = defaultStore.settings;
    await db.execute(
      "INSERT INTO settings (id, storeName, tagline, whatsapp, about) VALUES (1, ?, ?, ?, ?)",
      [s.storeName, s.tagline, s.whatsapp, s.about]
    );
  }

  async function addColumnIfMissing(
    db: Pool,
    table: string,
    column: string,
    definition: string
  ): Promise<void> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
       LIMIT 1`,
      [table, column]
    );

    if (rows.length === 0) {
      await db.execute(
        `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`
      );
    }
  }
}

async function ensureDatabase() {
  initialized ??= initializeDatabase().catch((error) => {
    initialized = undefined;
    pool = undefined;
    throw error;
  });
  await initialized;
}

export async function readDatabase(): Promise<DatabaseData> {
  await ensureDatabase();
  const db = getPool();
  const [settings] = await db.query<RowDataPacket[]>("SELECT * FROM settings WHERE id = 1");
  const [users] = await db.query<UserRow[]>("SELECT * FROM users");
  const [products] = await db.query<ProductRow[]>("SELECT * FROM products");
  const [promotions] = await db.query<RowDataPacket[]>("SELECT * FROM promotions");
  const [news] = await db.query<RowDataPacket[]>("SELECT * FROM news");
  const [orders] = await db.query<OrderRow[]>("SELECT * FROM orders ORDER BY createdAt DESC");
  const s = settings[0] ?? defaultStore.settings;

  return {
    settings: {
      storeName: String(s.storeName),
      tagline: String(s.tagline),
      whatsapp: String(s.whatsapp),
      about: String(s.about),
    },
    users: users.map((user) => ({ ...user, active: Boolean(user.active) })),
    products: products.map((product) => ({
      ...product,
      price: Number(product.price),
      featured: Boolean(product.featured),
      active: Boolean(product.active),
      createdAt: new Date(product.createdAt).toISOString(),
    })),
    promotions: promotions as Promotion[],
    news: news as NewsItem[],
    orders: orders.map((order) => ({
      ...order,
      items:
        typeof order.items === "string"
          ? (JSON.parse(order.items) as Order["items"])
          : order.items ?? [],
      totalPrice: Number(order.total),
      createdAt: new Date(order.createdAt).toISOString(),
      updatedAt: new Date(order.updatedAt).toISOString(),
    })),
  };
}

export async function writeDatabase(data: DatabaseData): Promise<void> {
  await ensureDatabase();
  const db = getPool();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "UPDATE settings SET storeName = ?, tagline = ?, whatsapp = ?, about = ? WHERE id = 1",
      [data.settings.storeName, data.settings.tagline, data.settings.whatsapp, data.settings.about]
    );
    await connection.execute("DELETE FROM orders");
    await connection.execute("DELETE FROM users");
    await connection.execute("DELETE FROM products");
    for (const product of data.products) {
      await connection.execute(
        "INSERT INTO products (id, name, description, price, category, image, featured, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [product.id, product.name, product.description, product.price, product.category, product.image, product.featured, product.active, product.createdAt]
      );
    }
    await connection.execute("DELETE FROM promotions");
    for (const promotion of data.promotions) {
      await connection.execute(
        "INSERT INTO promotions (id, title, description, discountLabel, image, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [promotion.id, promotion.title, promotion.description, promotion.discountLabel, promotion.image, promotion.active, promotion.createdAt]
      );
    }
    await connection.execute("DELETE FROM news");
    for (const item of data.news) {
      await connection.execute(
        "INSERT INTO news (id, title, content, image, active, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
        [item.id, item.title, item.content, item.image, item.active, item.createdAt]
      );
    }
    for (const user of data.users) {
      await connection.execute(
        "INSERT INTO users (id, email, name, passwordHash, role, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [user.id, user.email, user.name, user.passwordHash, user.role, user.active, user.createdAt]
      );
    }
    for (const order of data.orders) {
      await connection.execute(
        "INSERT INTO orders (id, userId, customerName, customerEmail, customerPhone, items, total, status, notes, deliveryDate, deliveryTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [order.id, order.userId, order.customerName, order.customerEmail, order.customerPhone, JSON.stringify(order.items), order.totalPrice, order.status, order.notes, order.deliveryDate, order.deliveryTime ?? "", order.createdAt, order.updatedAt]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
