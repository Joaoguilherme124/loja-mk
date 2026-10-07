import type { Product, ProductKind, ProductVariant, TortaSizeOption } from "./types";

export type { TortaSizeOption };

export const DOCINHO_SIZE = "Unidade";

export const TORTA_TIER_TRADICIONAL = "tradicional";
export const TORTA_TIER_ESPECIAL = "especial";
export const TORTA_CHOCOLATE_EXTRA_PER_KG = 5;
export const TORTA_MAX_FLAVORS = 2;

export type TortaMassa = "tradicional" | "chocolate";

export const DEFAULT_TORTA_SIZES: TortaSizeOption[] = [
  { cm: 15, kg: 1.5, fatias: "8 a 10" },
  { cm: 18, kg: 1.8, fatias: "12 a 15" },
  { cm: 20, kg: 2.5, fatias: "23 a 25" },
  { cm: 23, kg: 3.5, fatias: "30 a 35" },
  { cm: 25, kg: 4.5, fatias: "40 a 45" },
  { cm: 30, kg: 5.5, fatias: "50 a 55" },
];

/** Alias do padrão — preferir resolveTortaSizes(settings) no runtime. */
export const TORTA_SIZES = DEFAULT_TORTA_SIZES;

function cloneDefaults() {
  return DEFAULT_TORTA_SIZES.map((option) => ({ ...option }));
}

export function normalizeTortaSizes(raw: unknown): TortaSizeOption[] {
  if (!Array.isArray(raw) || raw.length === 0) return cloneDefaults();

  const parsed: TortaSizeOption[] = [];
  const seen = new Set<number>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const cm = Number(
      String((item as { cm?: unknown }).cm ?? "")
        .trim()
        .replace(",", ".")
    );
    const kg = Number(
      String((item as { kg?: unknown }).kg ?? "")
        .trim()
        .replace(",", ".")
    );
    const fatias = String((item as { fatias?: unknown }).fatias ?? "").trim();
    if (!Number.isFinite(cm) || cm <= 0) continue;
    if (!Number.isFinite(kg) || kg <= 0) continue;
    if (!fatias) continue;
    if (seen.has(cm)) continue;
    seen.add(cm);
    parsed.push({ cm, kg, fatias });
  }

  if (parsed.length === 0) return cloneDefaults();
  return parsed.sort((a, b) => a.cm - b.cm);
}

export function resolveTortaSizes(settings?: {
  tortaSizes?: unknown;
} | null) {
  return normalizeTortaSizes(settings?.tortaSizes);
}

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

export type DocinhoTier = "tradicional" | "especial";

/** Infere tradicional/especial pela categoria, descrição ou nome do produto. */
export function resolveDocinhoTier(
  product: Pick<Product, "category" | "description" | "name">
): DocinhoTier | null {
  const haystack = [product.category, product.description, product.name]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  if (haystack.includes("especial")) return "especial";
  if (haystack.includes("tradicional")) return "tradicional";
  return null;
}

export function buildDocinhoCartLabel(
  product: Pick<Product, "name" | "category" | "description">,
  flavor: string
) {
  const name = product.name.trim() || "docinhos";
  const flavorLabel = flavor.trim();
  const tier = resolveDocinhoTier(product);
  if (!flavorLabel) {
    return tier ? `${name} (${tier})` : name;
  }
  if (!tier) return `${name} (${flavorLabel})`;
  return `${name} (${tier} · ${flavorLabel})`;
}

/** Ordem no carrinho/WhatsApp: outros itens → tradicionais → especiais. */
export function cartItemDocinhoSortKey(item: {
  name: string;
  kind?: string;
}) {
  const lower = item.name.toLowerCase();
  const isDoc =
    item.kind === "docinhos" || /\bdocinhos?\b/i.test(item.name);
  if (!isDoc) return 0;
  if (lower.includes("tradicional")) return 1;
  if (lower.includes("especial")) return 2;
  return 3;
}

export function sortCartItemsByDocinhoTier<
  T extends { name: string; kind?: string },
>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const key =
        cartItemDocinhoSortKey(a.item) - cartItemDocinhoSortKey(b.item);
      if (key !== 0) return key;
      return a.index - b.index;
    })
    .map(({ item }) => item);
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

export function findTortaSizeByCm(
  cm: string | number,
  sizes: TortaSizeOption[] = DEFAULT_TORTA_SIZES
) {
  const value = Number(String(cm).trim().replace(",", "."));
  return sizes.find((option) => option.cm === value) || null;
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
export function tortaCatalogFromPrice(
  product: Pick<Product, "price" | "variants">,
  sizes: TortaSizeOption[] = DEFAULT_TORTA_SIZES
) {
  const rates = getTortaRates(product);
  const list = sizes.length > 0 ? sizes : DEFAULT_TORTA_SIZES;
  const smallest = list[0];
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
