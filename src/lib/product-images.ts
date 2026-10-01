import type { Product } from "./types";

export function parseImages(raw: unknown, fallbackImage = ""): string[] {
  const fallback = String(fallbackImage || "").trim();
  let value = raw;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      return fallback ? [fallback] : [];
    }
    try {
      value = JSON.parse(trimmed);
    } catch {
      return [trimmed];
    }
  }

  if (!Array.isArray(value)) {
    return fallback ? [fallback] : [];
  }

  const images = value
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (images.length > 0) return Array.from(new Set(images));
  return fallback ? [fallback] : [];
}

export function productGallery(product: Pick<Product, "image" | "images">) {
  return parseImages(product.images, product.image);
}

export function withSyncedImages<T extends Pick<Product, "image" | "images">>(
  product: T
): T & { image: string; images: string[] } {
  const images = parseImages(product.images, product.image);
  return {
    ...product,
    images,
    image: images[0] || String(product.image || "").trim(),
  };
}
