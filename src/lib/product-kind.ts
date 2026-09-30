import type { Product, ProductKind, ProductVariant } from "./types";

export const DOCINHO_SIZE = "Unidade";

export function parseProductKind(value: unknown): ProductKind {
  if (value === "docinhos") return "docinhos";
  if (value === "tortas") return "tortas";
  if (value === "bolos") return "bolos";
  // legado: "default" e valores desconhecidos → bolos
  return "bolos";
}

export function kindCategory(kind: ProductKind) {
  if (kind === "docinhos") return "Docinhos";
  if (kind === "tortas") return "Tortas";
  return "Bolos";
}

export function isDocinhosProduct(product: Pick<Product, "kind" | "variants">) {
  if (product.kind === "docinhos") return true;
  const variants = product.variants || [];
  return (
    variants.length > 0 &&
    variants.every((variant) => variant.size === DOCINHO_SIZE)
  );
}

export function isTortasProduct(product: Pick<Product, "kind">) {
  return parseProductKind(product.kind) === "tortas";
}

/** Resolve o modo do formulário ao editar (considera kind e categoria legada). */
export function resolveFormKind(product: Product): ProductKind {
  if (isDocinhosProduct(product)) return "docinhos";
  const kind = parseProductKind(product.kind);
  if (kind === "tortas" || kind === "docinhos") return kind;
  const category = (product.category || "").trim().toLowerCase();
  if (category.includes("torta")) return "tortas";
  if (category.includes("docinho")) return "docinhos";
  return "bolos";
}

export const TORTA_SIZES = [
  { cm: 15, yield: "8/10" },
  { cm: 17, yield: "10/15" },
  { cm: 20, yield: "20/25" },
  { cm: 22, yield: "30/35" },
] as const;

export type TortaSizeOption = (typeof TORTA_SIZES)[number];

export function tortaSizeLabel(option: Pick<TortaSizeOption, "cm" | "yield">) {
  return `${option.cm} cm · rende ${option.yield}`;
}

export function findTortaSizeByCm(cm: string | number) {
  const value = Number(String(cm).trim().replace(",", "."));
  return TORTA_SIZES.find((option) => option.cm === value) || null;
}

export function buildTortaSize(cm: string | number) {
  const option = findTortaSizeByCm(cm);
  if (!option) return "";
  return tortaSizeLabel(option);
}

export function parseTortaSize(size: string): { cm: string; yield: string } {
  const match = size.match(
    /(\d+(?:[.,]\d+)?)\s*cm(?:\s*[·•\-|]\s*)?(?:rende\s*)?(\d+\s*\/\s*\d+|\d+)/i
  );
  if (!match) return { cm: "", yield: "" };
  const cm = match[1].replace(",", ".");
  const known = findTortaSizeByCm(cm);
  return {
    cm,
    yield: known?.yield || match[2].replace(/\s/g, ""),
  };
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
  fallbackImage = "",
  size: string = DOCINHO_SIZE
): ProductVariant[] {
  return flavors
    .map((flavor) => ({
      id: flavor.id,
      size,
      style: flavor.name.trim(),
      price: flavor.price,
      image: (flavor.image || fallbackImage).trim(),
    }))
    .filter((variant) => variant.style && variant.price > 0 && variant.image);
}
