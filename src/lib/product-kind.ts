import type { Product, ProductKind, ProductVariant } from "./types";

export const DOCINHO_SIZE = "Unidade";

export const TORTA_TIER_TRADICIONAL = "tradicional";
export const TORTA_TIER_ESPECIAL = "especial";
export const TORTA_CHOCOLATE_EXTRA_PER_KG = 5;
export const TORTA_MAX_FLAVORS = 2;

export type TortaMassa = "tradicional" | "chocolate";

export const TORTA_SIZES = [
  { cm: 15, kg: 1.2, fatias: "8 a 10" },
  { cm: 18, kg: 1.8, fatias: "12 a 15" },
  { cm: 20, kg: 2.5, fatias: "23 a 25" },
  { cm: 23, kg: 3.5, fatias: "30 a 35" },
  { cm: 25, kg: 4.5, fatias: "40 a 45" },
  { cm: 30, kg: 5.5, fatias: "50 a 55" },
] as const;

export type TortaSizeOption = (typeof TORTA_SIZES)[number];

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
  if (product.kind === "tortas") return false;
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

export function isTortaTier(size: string) {
  return (
    size === TORTA_TIER_TRADICIONAL || size === TORTA_TIER_ESPECIAL
  );
}

export function tortaSizeLabel(option: Pick<TortaSizeOption, "cm" | "kg" | "fatias">) {
  const kg = option.kg.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(option.kg) ? 0 : 1,
    maximumFractionDigits: 1,
  });
  return `${option.cm} cm · ${kg} kg · ${option.fatias} fatias`;
}

export function findTortaSizeByCm(cm: string | number) {
  const value = Number(String(cm).trim().replace(",", "."));
  return TORTA_SIZES.find((option) => option.cm === value) || null;
}

export function getTortaRates(product: Pick<Product, "price" | "variants">) {
  const variants = product.variants || [];
  const traditionalVariant = variants.find(
    (variant) => variant.size === TORTA_TIER_TRADICIONAL
  );
  const specialVariant = variants.find(
    (variant) => variant.size === TORTA_TIER_ESPECIAL
  );
  // legado: sabores sem tier usam o preço do próprio variant / product
  const legacy = variants.find((variant) => !isTortaTier(variant.size));

  const traditional =
    traditionalVariant?.price ||
    legacy?.price ||
    product.price ||
    0;
  const special =
    specialVariant?.price || traditional;

  return { traditional, special };
}

export type TortaFlavorOption = {
  id: string;
  name: string;
  image: string;
  tier: typeof TORTA_TIER_TRADICIONAL | typeof TORTA_TIER_ESPECIAL;
};

export function getTortaFlavors(product: Pick<Product, "variants" | "image">) {
  const cover = product.image || "";
  const variants = product.variants || [];
  const flavors: TortaFlavorOption[] = [];

  for (const variant of variants) {
    if (!variant.style) continue;
    let tier: TortaFlavorOption["tier"];
    if (variant.size === TORTA_TIER_ESPECIAL) {
      tier = TORTA_TIER_ESPECIAL;
    } else if (
      variant.size === TORTA_TIER_TRADICIONAL ||
      !isTortaTier(variant.size)
    ) {
      // legado sem tier → tradicional
      tier = TORTA_TIER_TRADICIONAL;
    } else {
      continue;
    }
    flavors.push({
      id: variant.id,
      name: variant.style,
      image: variant.image || cover,
      tier,
    });
  }

  return {
    traditional: flavors.filter((f) => f.tier === TORTA_TIER_TRADICIONAL),
    special: flavors.filter((f) => f.tier === TORTA_TIER_ESPECIAL),
    all: flavors,
  };
}

export function resolveTortaRatePerKg(
  rates: { traditional: number; special: number },
  selectedFlavors: Pick<TortaFlavorOption, "tier">[]
) {
  const hasSpecial = selectedFlavors.some(
    (flavor) => flavor.tier === TORTA_TIER_ESPECIAL
  );
  return hasSpecial ? rates.special : rates.traditional;
}

export function calcTortaTotal(options: {
  kg: number;
  ratePerKg: number;
  chocolate: boolean;
}) {
  const extra = options.chocolate ? TORTA_CHOCOLATE_EXTRA_PER_KG : 0;
  return (options.ratePerKg + extra) * options.kg;
}

/** Preço de vitrine: menor tamanho × kg tradicional (sem chocolate). */
export function tortaCatalogFromPrice(product: Pick<Product, "price" | "variants">) {
  const rates = getTortaRates(product);
  const smallest = TORTA_SIZES[0];
  return calcTortaTotal({
    kg: smallest.kg,
    ratePerKg: rates.traditional,
    chocolate: false,
  });
}

export function buildTortaCartLabel(options: {
  productName: string;
  size: TortaSizeOption;
  massa: TortaMassa;
  flavors: { name: string }[];
}) {
  const flavorNames = options.flavors.map((f) => f.name).join(" + ");
  const massaLabel =
    options.massa === "chocolate" ? "massa chocolate" : "massa tradicional";
  return `${options.productName} (${tortaSizeLabel(options.size)} · ${massaLabel}${
    flavorNames ? ` · ${flavorNames}` : ""
  })`;
}

export function buildTortaVariantId(options: {
  cm: number;
  massa: TortaMassa;
  flavorIds: string[];
}) {
  const ids = [...options.flavorIds].sort().join("+");
  return `torta:${options.cm}:${options.massa}:${ids}`;
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
    .filter((variant) => variant.style && variant.price > 0);
}

export function variantsFromTortaFlavors(options: {
  traditionalPrice: number;
  specialPrice: number;
  traditional: { id: string; name: string; image?: string }[];
  special: { id: string; name: string; image?: string }[];
  coverImage?: string;
}): ProductVariant[] {
  const cover = (options.coverImage || "").trim();
  const mapTier = (
    flavors: { id: string; name: string; image?: string }[],
    tier: string,
    price: number
  ) =>
    flavors
      .map((flavor) => ({
        id: flavor.id,
        size: tier,
        style: flavor.name.trim(),
        price,
        image: (flavor.image || cover).trim(),
      }))
      .filter((variant) => variant.style && variant.price > 0);

  return [
    ...mapTier(
      options.traditional,
      TORTA_TIER_TRADICIONAL,
      options.traditionalPrice
    ),
    ...mapTier(options.special, TORTA_TIER_ESPECIAL, options.specialPrice),
  ];
}
