import { promises as fs } from "fs";
import path from "path";
import { defaultStore } from "./seed";
import { parseSoldBy } from "./sold-by";
import { parseProductKind } from "./product-kind";
import { parseImages } from "./product-images";
import type { Order, Product, StoreData, User } from "./types";

type LocalDatabaseData = StoreData & { users: User[]; orders: Order[] };

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "local-store.json");

function withDefaults(raw: Partial<LocalDatabaseData> | null): LocalDatabaseData {
  const products = (raw?.products || defaultStore.products).map(
    (product: Product) => {
      const images = parseImages(product.images, product.image);
      return {
        ...product,
        soldBy: parseSoldBy(product.soldBy),
        kind: parseProductKind(product.kind),
        images,
        image: images[0] || product.image || "",
      };
    }
  );

  return {
    settings: raw?.settings || defaultStore.settings,
    products,
    promotions: raw?.promotions || defaultStore.promotions,
    news: raw?.news || defaultStore.news,
    users: raw?.users || [],
    orders: raw?.orders || [],
  };
}

export async function readLocalDatabase(): Promise<LocalDatabaseData> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf8");
    return withDefaults(JSON.parse(content) as Partial<LocalDatabaseData>);
  } catch {
    const seeded = withDefaults(null);
    await writeLocalDatabase(seeded);
    return seeded;
  }
}

export async function writeLocalDatabase(data: LocalDatabaseData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}
