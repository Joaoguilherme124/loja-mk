import type { Product, ProductKind, ProductVariant } from "./types";

export const DOCINHO_SIZE = "Unidade";

export function parseProductKind(value: unknown): ProductKind {
  return value === "docinhos" ? "docinhos" : "default";
}

export function isDocinhosProduct(product: Pick<Product, "kind" | "variants">) {
  if (product.kind === "docinhos") return true;
  const variants = product.variants || [];
  return (
    variants.length > 0 &&
    variants.every((variant) => variant.size === DOCINHO_SIZE)
  );
}

export function flavorsFromVariants(variants?: ProductVariant[]) {
  return (variants || [])
    .filter((variant) => variant.style && variant.price > 0)
    .map((variant) => ({
      id: variant.id,
      name: variant.style,
      price: variant.price,
      image: variant.image || "",
    }));
}

export function variantsFromFlavors(
  flavors: { id: string; name: string; price: number; image?: string }[],
  fallbackImage = ""
): ProductVariant[] {
  return flavors
    .map((flavor) => ({
      id: flavor.id,
      size: DOCINHO_SIZE,
      style: flavor.name.trim(),
      price: flavor.price,
      image: (flavor.image || fallbackImage).trim(),
    }))
    .filter((variant) => variant.style && variant.price > 0 && variant.image);
}
