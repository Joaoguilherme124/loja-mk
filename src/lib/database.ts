import { Pool, type QueryResultRow } from "pg";
import { defaultStore } from "./seed";
import { parseImages } from "./product-images";
import { parseVariants } from "./product-variants";
import { parseSoldBy } from "./sold-by";
import {
  parseProductKind,
  resolveTortaCorteSizes,
  resolveTortaSizes,
} from "./product-kind";
import { readLocalDatabase, writeLocalDatabase } from "./local-store";
import type {
  NewsItem,
  Order,
  Product,
  Promotion,
  StoreData,
  StoreSettings,
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
  images?: string | null;
  featured: boolean;
  active: boolean;
  createdAt: string;
  variants?: string | null;
  soldBy?: string | null;
  kind?: string | null;
};
type OrderRow = QueryResultRow & {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: string | Order["items"];
  total: number | string;
  extraAmount?: number | string | null;
  status: Order["status"];
  notes: string;
  deliveryDate: string;
  deliveryTime: string;
  createdAt: string;
  updatedAt: string;
};

export type DatabaseData = StoreData & { users: User[]; orders: Order[] };

/** Garante data de calendário YYYY-MM-DD (sem deslocar por fuso UTC). */
function toDateOnly(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const raw = String(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : raw;
}

function useLocalStore() {
  return !process.env.DATABASE_URL;
}

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

  await db.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS "soldBy" VARCHAR(16) NOT NULL DEFAULT 'unit'
  `);
  await db.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS kind VARCHAR(32) NOT NULL DEFAULT 'default'
  `);
  await db.query(`
    ALTER TABLE products
    ALTER COLUMN kind TYPE VARCHAR(32)
  `);
  await db.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS images TEXT NULL
  `);
  await db.query(`
    ALTER TABLE settings
    ADD COLUMN IF NOT EXISTS "tortaSizes" TEXT NULL
  `);
  await db.query(`
    ALTER TABLE settings
    ADD COLUMN IF NOT EXISTS "tortaCorteSizes" TEXT NULL
  `);
  await db.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS "extraAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS products_active_idx ON products (active);
    CREATE INDEX IF NOT EXISTS products_kind_idx ON products (kind);
    CREATE INDEX IF NOT EXISTS orders_created_idx ON orders ("createdAt" DESC);
    CREATE INDEX IF NOT EXISTS orders_user_idx ON orders ("userId");
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
    CREATE INDEX IF NOT EXISTS promotions_active_idx ON promotions (active);
    CREATE INDEX IF NOT EXISTS news_active_idx ON news (active);
  `);

  const settings = await db.query('SELECT id FROM settings WHERE id = 1');
  if (settings.rowCount === 0) {
    const s = defaultStore.settings;
    await db.query(
      'INSERT INTO settings (id, "storeName", tagline, whatsapp, about, "tortaSizes", "tortaCorteSizes") VALUES (1, $1, $2, $3, $4, $5, $6)',
      [
        s.storeName,
        s.tagline,
        s.whatsapp,
        s.about,
        JSON.stringify(s.tortaSizes || []),
        JSON.stringify(s.tortaCorteSizes || []),
      ]
    );
  }
}

function parseJsonField(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mapSettings(s: QueryResultRow): StoreSettings {
  return {
    storeName: String(s.storeName),
    tagline: String(s.tagline),
    whatsapp: String(s.whatsapp),
    about: String(s.about),
    tortaSizes: resolveTortaSizes({
      tortaSizes: parseJsonField((s as { tortaSizes?: unknown }).tortaSizes),
    }),
    tortaCorteSizes: resolveTortaCorteSizes({
      tortaCorteSizes: parseJsonField(
        (s as { tortaCorteSizes?: unknown }).tortaCorteSizes
      ),
    }),
  };
}

function mapProduct(product: ProductRow): Product {
  const images = parseImages(product.images, product.image);
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    soldBy: parseSoldBy(product.soldBy),
    kind: parseProductKind(product.kind),
    category: product.category,
    image: images[0] || product.image || "",
    images,
    featured: Boolean(product.featured),
    active: Boolean(product.active),
    createdAt: new Date(product.createdAt).toISOString(),
    variants: parseVariants(product.variants),
  };
}

function mapOrder(order: OrderRow): Order {
  return {
    ...order,
    items:
      typeof order.items === "string"
        ? (JSON.parse(order.items) as Order["items"])
        : order.items ?? [],
    totalPrice: Number(order.total),
    extraAmount: Number(order.extraAmount) || 0,
    deliveryDate: toDateOnly(order.deliveryDate),
    deliveryTime: String(order.deliveryTime || ""),
    createdAt: new Date(order.createdAt).toISOString(),
    updatedAt: new Date(order.updatedAt).toISOString(),
  };
}

function productWriteParams(product: Product) {
  return [
    product.id,
    product.name,
    product.description,
    product.price,
    product.category,
    product.image,
    JSON.stringify(product.images || (product.image ? [product.image] : [])),
    product.featured,
    product.active,
    product.createdAt,
    JSON.stringify(product.variants || []),
    parseSoldBy(product.soldBy),
    parseProductKind(product.kind),
  ];
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
  if (useLocalStore()) {
    return readLocalDatabase();
  }

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
  const s = settingsResult.rows[0];

  return {
    settings: s ? mapSettings(s) : defaultStore.settings,
    users: usersResult.rows.map((user) => ({ ...user, active: Boolean(user.active) })),
    products: productsResult.rows.map(mapProduct),
    promotions: promotionsResult.rows as Promotion[],
    news: newsResult.rows as NewsItem[],
    orders: ordersResult.rows.map(mapOrder),
  };
}

export async function writeDatabase(data: DatabaseData): Promise<void> {
  if (useLocalStore()) {
    await writeLocalDatabase(data);
    return;
  }

  await ensureDatabase();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      'UPDATE settings SET "storeName" = $1, tagline = $2, whatsapp = $3, about = $4, "tortaSizes" = $5, "tortaCorteSizes" = $6 WHERE id = 1',
      [
        data.settings.storeName,
        data.settings.tagline,
        data.settings.whatsapp,
        data.settings.about,
        JSON.stringify(resolveTortaSizes(data.settings)),
        JSON.stringify(resolveTortaCorteSizes(data.settings)),
      ]
    );
    await client.query("DELETE FROM orders");
    await client.query("DELETE FROM users");
    await client.query("DELETE FROM products");
    for (const product of data.products) {
      await client.query(
        'INSERT INTO products (id, name, description, price, category, image, images, featured, active, "createdAt", variants, "soldBy", kind) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        [
          product.id,
          product.name,
          product.description,
          product.price,
          product.category,
          product.image,
          JSON.stringify(product.images || (product.image ? [product.image] : [])),
          product.featured,
          product.active,
          product.createdAt,
          JSON.stringify(product.variants || []),
          parseSoldBy(product.soldBy),
          parseProductKind(product.kind),
        ]
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
        'INSERT INTO orders (id, "userId", "customerName", "customerEmail", "customerPhone", items, total, "extraAmount", status, notes, "deliveryDate", "deliveryTime", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
        [
          order.id,
          order.userId,
          order.customerName,
          order.customerEmail,
          order.customerPhone,
          JSON.stringify(order.items),
          order.totalPrice,
          Number(order.extraAmount) || 0,
          order.status,
          order.notes,
          toDateOnly(order.deliveryDate) || null,
          order.deliveryTime ?? "",
          order.createdAt,
          order.updatedAt,
        ]
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

export async function getSettings(): Promise<StoreSettings> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    return data.settings;
  }
  await ensureDatabase();
  const result = await getPool().query("SELECT * FROM settings WHERE id = 1");
  const row = result.rows[0];
  return row ? mapSettings(row) : defaultStore.settings;
}

export async function updateSettingsRecord(
  settings: StoreSettings
): Promise<StoreSettings> {
  const next: StoreSettings = {
    ...settings,
    tortaSizes: resolveTortaSizes(settings),
    tortaCorteSizes: resolveTortaCorteSizes(settings),
  };
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    data.settings = next;
    await writeLocalDatabase(data);
    return next;
  }
  await ensureDatabase();
  await getPool().query(
    'UPDATE settings SET "storeName" = $1, tagline = $2, whatsapp = $3, about = $4, "tortaSizes" = $5, "tortaCorteSizes" = $6 WHERE id = 1',
    [
      next.storeName,
      next.tagline,
      next.whatsapp,
      next.about,
      JSON.stringify(next.tortaSizes || []),
      JSON.stringify(next.tortaCorteSizes || []),
    ]
  );
  return next;
}

export async function listProducts(options?: {
  activeOnly?: boolean;
}): Promise<Product[]> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    return options?.activeOnly
      ? data.products.filter((product) => product.active)
      : data.products;
  }
  await ensureDatabase();
  const result = options?.activeOnly
    ? await getPool().query<ProductRow>(
        'SELECT * FROM products WHERE active = TRUE ORDER BY "createdAt" DESC'
      )
    : await getPool().query<ProductRow>(
        'SELECT * FROM products ORDER BY "createdAt" DESC'
      );
  return result.rows.map(mapProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    return data.products.find((product) => product.id === id) || null;
  }
  await ensureDatabase();
  const result = await getPool().query<ProductRow>(
    "SELECT * FROM products WHERE id = $1",
    [id]
  );
  const row = result.rows[0];
  return row ? mapProduct(row) : null;
}

export async function insertProduct(product: Product): Promise<Product> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    data.products.unshift(product);
    await writeLocalDatabase(data);
    return product;
  }
  await ensureDatabase();
  await getPool().query(
    'INSERT INTO products (id, name, description, price, category, image, images, featured, active, "createdAt", variants, "soldBy", kind) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
    productWriteParams(product)
  );
  return product;
}

export async function updateProductRecord(product: Product): Promise<Product> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    const index = data.products.findIndex((entry) => entry.id === product.id);
    if (index < 0) throw new Error("Produto não encontrado");
    data.products[index] = product;
    await writeLocalDatabase(data);
    return product;
  }
  await ensureDatabase();
  const result = await getPool().query(
    `UPDATE products SET
      name = $2,
      description = $3,
      price = $4,
      category = $5,
      image = $6,
      images = $7,
      featured = $8,
      active = $9,
      variants = $11,
      "soldBy" = $12,
      kind = $13
    WHERE id = $1`,
    productWriteParams(product)
  );
  if (result.rowCount === 0) throw new Error("Produto não encontrado");
  return product;
}

export async function deleteProductById(id: string): Promise<boolean> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    const before = data.products.length;
    data.products = data.products.filter((product) => product.id !== id);
    if (data.products.length === before) return false;
    await writeLocalDatabase(data);
    return true;
  }
  await ensureDatabase();
  const result = await getPool().query("DELETE FROM products WHERE id = $1", [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export async function listPromotions(options?: {
  activeOnly?: boolean;
}): Promise<Promotion[]> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    return options?.activeOnly
      ? data.promotions.filter((item) => item.active)
      : data.promotions;
  }
  await ensureDatabase();
  const result = options?.activeOnly
    ? await getPool().query<Promotion>(
        'SELECT * FROM promotions WHERE active = TRUE ORDER BY "createdAt" DESC'
      )
    : await getPool().query<Promotion>(
        'SELECT * FROM promotions ORDER BY "createdAt" DESC'
      );
  return result.rows;
}

export async function insertPromotion(promotion: Promotion): Promise<Promotion> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    data.promotions.unshift(promotion);
    await writeLocalDatabase(data);
    return promotion;
  }
  await ensureDatabase();
  await getPool().query(
    'INSERT INTO promotions (id, title, description, "discountLabel", image, active, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [
      promotion.id,
      promotion.title,
      promotion.description,
      promotion.discountLabel,
      promotion.image,
      promotion.active,
      promotion.createdAt,
    ]
  );
  return promotion;
}

export async function updatePromotionRecord(
  promotion: Promotion
): Promise<Promotion> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    const index = data.promotions.findIndex((item) => item.id === promotion.id);
    if (index < 0) throw new Error("Promoção não encontrada");
    data.promotions[index] = promotion;
    await writeLocalDatabase(data);
    return promotion;
  }
  await ensureDatabase();
  const result = await getPool().query(
    'UPDATE promotions SET title = $2, description = $3, "discountLabel" = $4, image = $5, active = $6 WHERE id = $1',
    [
      promotion.id,
      promotion.title,
      promotion.description,
      promotion.discountLabel,
      promotion.image,
      promotion.active,
    ]
  );
  if (result.rowCount === 0) throw new Error("Promoção não encontrada");
  return promotion;
}

export async function deletePromotionById(id: string): Promise<boolean> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    const before = data.promotions.length;
    data.promotions = data.promotions.filter((item) => item.id !== id);
    if (data.promotions.length === before) return false;
    await writeLocalDatabase(data);
    return true;
  }
  await ensureDatabase();
  const result = await getPool().query("DELETE FROM promotions WHERE id = $1", [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export async function listNews(options?: {
  activeOnly?: boolean;
}): Promise<NewsItem[]> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    return options?.activeOnly
      ? data.news.filter((item) => item.active)
      : data.news;
  }
  await ensureDatabase();
  const result = options?.activeOnly
    ? await getPool().query<NewsItem>(
        'SELECT * FROM news WHERE active = TRUE ORDER BY "createdAt" DESC'
      )
    : await getPool().query<NewsItem>(
        'SELECT * FROM news ORDER BY "createdAt" DESC'
      );
  return result.rows;
}

export async function insertNewsItem(item: NewsItem): Promise<NewsItem> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    data.news.unshift(item);
    await writeLocalDatabase(data);
    return item;
  }
  await ensureDatabase();
  await getPool().query(
    'INSERT INTO news (id, title, content, image, active, "createdAt") VALUES ($1, $2, $3, $4, $5, $6)',
    [item.id, item.title, item.content, item.image, item.active, item.createdAt]
  );
  return item;
}

export async function updateNewsRecord(item: NewsItem): Promise<NewsItem> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    const index = data.news.findIndex((entry) => entry.id === item.id);
    if (index < 0) throw new Error("Novidade não encontrada");
    data.news[index] = item;
    await writeLocalDatabase(data);
    return item;
  }
  await ensureDatabase();
  const result = await getPool().query(
    "UPDATE news SET title = $2, content = $3, image = $4, active = $5 WHERE id = $1",
    [item.id, item.title, item.content, item.image, item.active]
  );
  if (result.rowCount === 0) throw new Error("Novidade não encontrada");
  return item;
}

export async function deleteNewsById(id: string): Promise<boolean> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    const before = data.news.length;
    data.news = data.news.filter((item) => item.id !== id);
    if (data.news.length === before) return false;
    await writeLocalDatabase(data);
    return true;
  }
  await ensureDatabase();
  const result = await getPool().query("DELETE FROM news WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listOrders(options?: {
  userId?: string;
}): Promise<Order[]> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    return options?.userId
      ? data.orders.filter((order) => order.userId === options.userId)
      : data.orders;
  }
  await ensureDatabase();
  const result = options?.userId
    ? await getPool().query<OrderRow>(
        'SELECT * FROM orders WHERE "userId" = $1 ORDER BY "createdAt" DESC',
        [options.userId]
      )
    : await getPool().query<OrderRow>(
        'SELECT * FROM orders ORDER BY "createdAt" DESC'
      );
  return result.rows.map(mapOrder);
}

export type DashboardCounts = {
  products: number;
  promotions: number;
  news: number;
  orders: number;
  pendingOrders: number;
};

export async function getDashboardCounts(): Promise<DashboardCounts> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    return {
      products: data.products.length,
      promotions: data.promotions.length,
      news: data.news.length,
      orders: data.orders.length,
      pendingOrders: data.orders.filter((order) => order.status === "pendente")
        .length,
    };
  }
  await ensureDatabase();
  const result = await getPool().query(
    `SELECT
      (SELECT COUNT(*)::int FROM products) AS products,
      (SELECT COUNT(*)::int FROM promotions) AS promotions,
      (SELECT COUNT(*)::int FROM news) AS news,
      (SELECT COUNT(*)::int FROM orders) AS orders,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'pendente') AS pending`
  );
  const row = result.rows[0] || {};
  return {
    products: Number(row.products) || 0,
    promotions: Number(row.promotions) || 0,
    news: Number(row.news) || 0,
    orders: Number(row.orders) || 0,
    pendingOrders: Number(row.pending) || 0,
  };
}

export async function getStorefront() {
  const [settings, products, promotions, news] = await Promise.all([
    getSettings(),
    listProducts({ activeOnly: true }),
    listPromotions({ activeOnly: true }),
    listNews({ activeOnly: true }),
  ]);
  return { settings, products, promotions, news };
}

const ORDER_INSERT_SQL =
  'INSERT INTO orders (id, "userId", "customerName", "customerEmail", "customerPhone", items, total, "extraAmount", status, notes, "deliveryDate", "deliveryTime", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';

function orderInsertParams(order: Order) {
  return [
    order.id,
    order.userId,
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    JSON.stringify(order.items),
    order.totalPrice,
    Number(order.extraAmount) || 0,
    order.status,
    order.notes,
    toDateOnly(order.deliveryDate) || null,
    order.deliveryTime ?? "",
    order.createdAt,
    order.updatedAt,
  ];
}

/** Insere um pedido sem reescrever o resto do banco. */
export async function insertOrder(order: Order): Promise<Order> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    data.orders.unshift(order);
    await writeLocalDatabase(data);
    return order;
  }

  await ensureDatabase();
  await getPool().query(ORDER_INSERT_SQL, orderInsertParams(order));
  return order;
}

/** Atualiza um pedido existente sem reescrever o resto do banco. */
export async function updateOrderRecord(order: Order): Promise<Order> {
  const updated: Order = {
    ...order,
    updatedAt: new Date().toISOString(),
  };

  if (useLocalStore()) {
    const data = await readLocalDatabase();
    const index = data.orders.findIndex((entry) => entry.id === order.id);
    if (index < 0) throw new Error("Pedido não encontrado");
    data.orders[index] = updated;
    await writeLocalDatabase(data);
    return updated;
  }

  await ensureDatabase();
  const result = await getPool().query(
    `UPDATE orders SET
      "userId" = $2,
      "customerName" = $3,
      "customerEmail" = $4,
      "customerPhone" = $5,
      items = $6,
      total = $7,
      "extraAmount" = $8,
      status = $9,
      notes = $10,
      "deliveryDate" = $11,
      "deliveryTime" = $12,
      "updatedAt" = $13
    WHERE id = $1`,
    [
      updated.id,
      updated.userId,
      updated.customerName,
      updated.customerEmail,
      updated.customerPhone,
      JSON.stringify(updated.items),
      updated.totalPrice,
      Number(updated.extraAmount) || 0,
      updated.status,
      updated.notes,
      toDateOnly(updated.deliveryDate) || null,
      updated.deliveryTime ?? "",
      updated.updatedAt,
    ]
  );
  if (result.rowCount === 0) throw new Error("Pedido não encontrado");
  return updated;
}

/** Remove um pedido pelo id, sem reescrever o resto do banco. */
export async function deleteOrderById(orderId: string): Promise<boolean> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    const before = data.orders.length;
    data.orders = data.orders.filter((order) => order.id !== orderId);
    if (data.orders.length === before) return false;
    await writeLocalDatabase(data);
    return true;
  }

  await ensureDatabase();
  const result = await getPool().query("DELETE FROM orders WHERE id = $1", [
    orderId,
  ]);
  return (result.rowCount ?? 0) > 0;
}

/** Busca um pedido pelo id. */
export async function getOrderById(orderId: string): Promise<Order | null> {
  if (useLocalStore()) {
    const data = await readLocalDatabase();
    return data.orders.find((order) => order.id === orderId) || null;
  }

  await ensureDatabase();
  const result = await getPool().query<OrderRow>(
    "SELECT * FROM orders WHERE id = $1",
    [orderId]
  );
  const order = result.rows[0];
  if (!order) return null;
  return mapOrder(order);
}
