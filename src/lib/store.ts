import {
  getStorefront,
  listNews,
  listProducts,
  listPromotions,
  getSettings,
  readDatabase,
  writeDatabase,
} from "./database";
import type { StoreData } from "./types";

/** Vitrine: só settings e itens ativos, sem pedidos/usuários. */
export async function readStorefront() {
  return getStorefront();
}

/** Catálogo admin: produtos/promo/news completos, sem pedidos/usuários. */
export async function readStore(): Promise<StoreData> {
  const [settings, products, promotions, news] = await Promise.all([
    getSettings(),
    listProducts(),
    listPromotions(),
    listNews(),
  ]);
  return { settings, products, promotions, news };
}

export async function writeStore(data: StoreData): Promise<void> {
  const current = await readDatabase();
  await writeDatabase({ ...current, ...data });
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
