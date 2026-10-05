import {
  isTortasProduct,
  parseProductKind,
  tortaCatalogFromPrice,
} from "./product-kind";
import { withSyncedImages } from "./product-images";
import type { Product, ProductVariant, TortaSizeOption } from "./types";

export function parseVariants(raw: unknown): ProductVariant[] {
  if (!raw) return [];
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const size = String(item?.size || "").trim();
      const style = String(item?.style || "").trim();
      const image = String(item?.image || "").trim();
      const price = Number(item?.price) || 0;
      const id = String(item?.id || `var_${index}`).trim();
      if (!size || !style || price <= 0) return null;
      return { id, size, style, price, image } satisfies ProductVariant;
    })
    .filter(Boolean) as ProductVariant[];
}

export function variantLabel(variant: ProductVariant) {
  return `${variant.size} · ${variant.style}`;
}

export function findVariant(
  product: Product,
  size: string,
  style: string
): ProductVariant | undefined {
  return (product.variants || []).find(
    (variant) => variant.size === size && variant.style === style
  );
}

export function uniqueSizes(product: Product) {
  return Array.from(
    new Set((product.variants || []).map((variant) => variant.size))
  );
}

export function uniqueStyles(product: Product) {
  return Array.from(
    new Set((product.variants || []).map((variant) => variant.style))
  );
}

export function displayPrice(
  product: Product,
  tortaSizes?: TortaSizeOption[]
) {
  if (isTortasProduct(product)) {
    return tortaCatalogFromPrice(product, tortaSizes);
  }
  const variants = product.variants || [];
  if (variants.length === 0) return product.price;
  return Math.min(...variants.map((variant) => variant.price));
}

export function hasVariants(product: Product) {
  return (product.variants || []).length > 0;
}

export function withSyncedPricing(product: Product): Product {
  const variants = parseVariants(product.variants);
  const soldBy = product.soldBy === "kg" ? "kg" : "unit";
  const kind = parseProductKind(product.kind);
  const withImages = withSyncedImages(product);

  if (variants.length === 0) {
    return { ...withImages, soldBy, kind, variants: [] };
  }
  if (kind === "tortas") {
    const traditional = variants.find((v) => v.size === "tradicional");
    const price =
      traditional?.price ||
      Math.min(...variants.map((variant) => variant.price));
    const images =
      withImages.images.length > 0
        ? withImages.images
        : variants[0]?.image
          ? [variants[0].image]
          : [];
    return {
      ...withImages,
      soldBy: "unit",
      kind,
      variants,
      price,
      images,
      image: images[0] || withImages.image || "",
    };
  }
  return {
    ...withImages,
    soldBy,
    kind,
    variants,
    price: Math.min(...variants.map((variant) => variant.price)),
    image: withImages.image || variants[0]?.image || product.image,
  };
}
