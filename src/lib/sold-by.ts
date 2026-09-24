import type { ProductKind, SoldBy } from "./types";

export function parseSoldBy(value: unknown): SoldBy {
  return value === "kg" ? "kg" : "unit";
}

export function isSoldByKg(soldBy?: SoldBy | null) {
  return soldBy === "kg";
}

function isDocinhosKind(kind?: ProductKind | null) {
  return kind === "docinhos";
}

export function minQuantity(
  soldBy?: SoldBy | null,
  kind?: ProductKind | null
) {
  if (isDocinhosKind(kind)) return 25;
  return 1;
}

export function quantityStep(
  soldBy?: SoldBy | null,
  kind?: ProductKind | null
) {
  if (isDocinhosKind(kind)) return 5;
  return isSoldByKg(soldBy) ? 0.5 : 1;
}

/** Docinhos de 5 em 5 (mín. 25); kg de 0,5 em 0,5 (mín. 1); demais em inteiro. */
export function normalizeQuantity(
  value: number,
  soldBy?: SoldBy | null,
  kind?: ProductKind | null
) {
  const raw = Number(value);
  if (isDocinhosKind(kind)) {
    if (!Number.isFinite(raw)) return 25;
    const stepped = Math.round(raw / 5) * 5;
    return Math.max(25, stepped);
  }
  if (!Number.isFinite(raw)) return minQuantity(soldBy, kind);
  if (isSoldByKg(soldBy)) {
    const stepped = Math.round(raw * 2) / 2;
    return Math.max(1, stepped);
  }
  return Math.max(1, Math.round(raw));
}

export function formatQuantity(
  value: number,
  soldBy?: SoldBy | null,
  kind?: ProductKind | null
) {
  if (isSoldByKg(soldBy)) {
    const formatted = value.toLocaleString("pt-BR", {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
      maximumFractionDigits: 1,
    });
    return `${formatted} kg`;
  }
  if (isDocinhosKind(kind)) {
    return `${value} un.`;
  }
  return String(value);
}

export function formatRate(
  price: number,
  soldBy: SoldBy | null | undefined,
  formatPrice: (value: number) => string
) {
  const base = formatPrice(price);
  return isSoldByKg(soldBy) ? `${base}/kg` : base;
}
