import { readDatabase, writeDatabase } from "./database";
import type { StoreData } from "./types";

export async function readStore(): Promise<StoreData> {
  const data = await readDatabase();
  return {
    settings: data.settings,
    products: data.products,
    promotions: data.promotions,
    news: data.news,
  };
}

export async function writeStore(data: StoreData): Promise<void> {
  const current = await readDatabase();
  await writeDatabase({ ...current, ...data });
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
