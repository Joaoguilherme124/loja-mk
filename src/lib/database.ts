import { Pool, type QueryResultRow } from "pg";
import { defaultStore } from "./seed";
import { parseVariants } from "./product-variants";
import type {
  NewsItem,
  Order,
  Product,
  Promotion,
  StoreData,
  User,
} from "./types";

type UserRow = QueryResultRow & User;
type ProductRow = QueryResultRow & {
  id: string;
  name: string;
  description: string;
  price: number | string;
  category: string;
  image: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
  variants?: string | null;
};
type OrderRow = QueryResultRow & {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: string | Order["items"];
  total: number | string;
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

  pool = new Pool({
    connectionString: url,
    max: 10,
    ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });

  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      "passwordHash" VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'cliente',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      variants TEXT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(191) PRIMARY KEY,
      "userId" VARCHAR(191) NOT NULL,
      "customerName" VARCHAR(255) NOT NULL DEFAULT '',
      "customerEmail" VARCHAR(255) NOT NULL DEFAULT '',
      "customerPhone" VARCHAR(64) NOT NULL DEFAULT '',
      items TEXT NULL,
      total DECIMAL(10, 2) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pendente',
      notes TEXT NULL,
      "deliveryDate" DATE NULL,
      "deliveryTime" VARCHAR(32) NOT NULL DEFAULT '',
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (
      id SMALLINT PRIMARY KEY,
      "storeName" VARCHAR(255) NOT NULL,
      tagline TEXT NOT NULL,
      whatsapp VARCHAR(32) NOT NULL,
      about TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS promotions (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      "discountLabel" VARCHAR(100) NOT NULL,
      image TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS news (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      image TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const settings = await db.query('SELECT id FROM settings WHERE id = 1');
  if (settings.rowCount === 0) {
    const s = defaultStore.settings;
    await db.query(
      'INSERT INTO settings (id, "storeName", tagline, whatsapp, about) VALUES (1, $1, $2, $3, $4)',
      [s.storeName, s.tagline, s.whatsapp, s.about]
    );
  }
}

async function ensureDatabase(): Promise<void> {
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
  const [settingsResult, usersResult, productsResult, promotionsResult, newsResult, ordersResult] =
    await Promise.all([
      db.query('SELECT * FROM settings WHERE id = 1'),
      db.query<UserRow>("SELECT * FROM users"),
      db.query<ProductRow>('SELECT * FROM products'),
      db.query<Promotion>("SELECT * FROM promotions"),
      db.query<NewsItem>("SELECT * FROM news"),
      db.query<OrderRow>('SELECT * FROM orders ORDER BY "createdAt" DESC'),
    ]);
  const s = settingsResult.rows[0] ?? defaultStore.settings;

  return {
    settings: {
      storeName: String(s.storeName),
      tagline: String(s.tagline),
      whatsapp: String(s.whatsapp),
      about: String(s.about),
    },
    users: usersResult.rows.map((user) => ({ ...user, active: Boolean(user.active) })),
    products: productsResult.rows.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      category: product.category,
      image: product.image,
      featured: Boolean(product.featured),
      active: Boolean(product.active),
      createdAt: new Date(product.createdAt).toISOString(),
      variants: parseVariants(product.variants),
    }) satisfies Product),
    promotions: promotionsResult.rows as Promotion[],
    news: newsResult.rows as NewsItem[],
    orders: ordersResult.rows.map((order) => ({
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
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      'UPDATE settings SET "storeName" = $1, tagline = $2, whatsapp = $3, about = $4 WHERE id = 1',
      [data.settings.storeName, data.settings.tagline, data.settings.whatsapp, data.settings.about]
    );
    await client.query("DELETE FROM orders");
    await client.query("DELETE FROM users");
    await client.query("DELETE FROM products");
    for (const product of data.products) {
      await client.query(
        'INSERT INTO products (id, name, description, price, category, image, featured, active, "createdAt", variants) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [product.id, product.name, product.description, product.price, product.category, product.image, product.featured, product.active, product.createdAt, JSON.stringify(product.variants || [])]
      );
    }
    await client.query("DELETE FROM promotions");
    for (const promotion of data.promotions) {
      await client.query(
        'INSERT INTO promotions (id, title, description, "discountLabel", image, active, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [promotion.id, promotion.title, promotion.description, promotion.discountLabel, promotion.image, promotion.active, promotion.createdAt]
      );
    }
    await client.query("DELETE FROM news");
    for (const item of data.news) {
      await client.query(
        'INSERT INTO news (id, title, content, image, active, "createdAt") VALUES ($1, $2, $3, $4, $5, $6)',
        [item.id, item.title, item.content, item.image, item.active, item.createdAt]
      );
    }
    for (const user of data.users) {
      await client.query(
        'INSERT INTO users (id, email, name, "passwordHash", role, active, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [user.id, user.email, user.name, user.passwordHash, user.role, user.active, user.createdAt]
      );
    }
    for (const order of data.orders) {
      await client.query(
        'INSERT INTO orders (id, "userId", "customerName", "customerEmail", "customerPhone", items, total, status, notes, "deliveryDate", "deliveryTime", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        [order.id, order.userId, order.customerName, order.customerEmail, order.customerPhone, JSON.stringify(order.items), order.totalPrice, order.status, order.notes, order.deliveryDate, order.deliveryTime ?? "", order.createdAt, order.updatedAt]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
