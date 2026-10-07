import { sortCartItemsByDocinhoTier } from "./product-kind";
import { formatQuantity, formatRate, isSoldByKg } from "./sold-by";
import type { Product, ProductKind, SoldBy } from "./types";

export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type CartCategory = "bolos" | "tortas" | "docinhos" | "outros";

const CATEGORY_ORDER: CartCategory[] = [
  "bolos",
  "tortas",
  "docinhos",
  "outros",
];

const CATEGORY_LABEL: Record<CartCategory, string> = {
  bolos: "bolos",
  tortas: "tortas",
  docinhos: "docinhos",
  outros: "outros",
};

function resolveCartCategory(item: {
  name: string;
  kind?: ProductKind;
}): CartCategory {
  if (item.kind === "bolos") return "bolos";
  if (item.kind === "tortas") return "tortas";
  if (item.kind === "docinhos") return "docinhos";
  const lower = item.name.toLowerCase();
  if (/\bdocinhos?\b/.test(lower)) return "docinhos";
  if (/\btortas?\b/.test(lower)) return "tortas";
  if (/\bbolos?\b/.test(lower)) return "bolos";
  return "outros";
}

function buildCategorySubtotalsBlock(
  items: CartWhatsAppItem[],
  grandTotal: number
) {
  const totals = new Map<CartCategory, number>();
  for (const item of items) {
    const category = resolveCartCategory(item);
    const lineTotal = item.price * item.quantity;
    totals.set(category, (totals.get(category) || 0) + lineTotal);
  }

  const present = CATEGORY_ORDER.filter((category) => {
    const value = totals.get(category) || 0;
    return value > 0;
  });

  // Só mostra subtotais quando há mais de uma categoria no pedido
  if (present.length <= 1) {
    return `Total: ${formatPrice(grandTotal)}`;
  }

  const lines = present.map(
    (category) =>
      `Subtotal ${CATEGORY_LABEL[category]}: ${formatPrice(totals.get(category) || 0)}`
  );
  lines.push(`Total: ${formatPrice(grandTotal)}`);
  return lines.join("\n");
}

export function buildWhatsAppLink(
  phone: string,
  product: Pick<Product, "name" | "price"> & { soldBy?: SoldBy },
  quantity = 1
) {
  const digits = phone.replace(/\D/g, "");
  const soldBy = product.soldBy || "unit";
  const total = formatPrice(product.price * quantity);
  const qtyLabel = isSoldByKg(soldBy)
    ? formatQuantity(quantity, soldBy)
    : `${quantity} unidade(s)`;
  const rateHint = isSoldByKg(soldBy)
    ? ` (${formatRate(product.price, soldBy, formatPrice)})`
    : "";
  const message = `Olá! Quero pedir: *${product.name}* — ${qtyLabel}${rateHint}. Valor: ${total}. Pode confirmar?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildGeneralWhatsAppLink(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "");
  const message =
    text || "Olá! Vim pelo site e gostaria de saber mais sobre os produtos.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export type CartWhatsAppItem = {
  name: string;
  quantity: number;
  price: number;
  soldBy?: SoldBy;
  kind?: ProductKind;
};

export function buildCartWhatsAppLink(
  phone: string,
  items: CartWhatsAppItem[],
  note?: string,
  promo?: {
    title: string;
    discountLabel: string;
    discountAmount: number;
    subtotal: number;
    total: number;
  },
  pickupDate?: string
) {
  const digits = phone.replace(/\D/g, "");
  const orderedItems = [...sortCartItemsByDocinhoTier(items)].sort((a, b) => {
    const catA = CATEGORY_ORDER.indexOf(resolveCartCategory(a));
    const catB = CATEGORY_ORDER.indexOf(resolveCartCategory(b));
    return catA - catB;
  });
  const lines = orderedItems.map((item) => {
    const soldBy = item.soldBy || "unit";
    const qty = isSoldByKg(soldBy)
      ? formatQuantity(item.quantity, soldBy)
      : `${item.quantity}x`;
    return `* ${qty} ${item.name} — ${formatPrice(item.price * item.quantity)}`;
  });
  const subtotal =
    promo?.subtotal ??
    orderedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = promo?.total ?? subtotal;

  let totalsBlock = buildCategorySubtotalsBlock(orderedItems, total);
  if (promo && promo.discountAmount > 0) {
    const categoryBlock = buildCategorySubtotalsBlock(
      orderedItems,
      promo.subtotal
    );
    const categoryLines = categoryBlock
      .split("\n")
      .filter((line) => !line.startsWith("Total:"));
    const prefix =
      categoryLines.length > 0 ? `${categoryLines.join("\n")}\n` : "";
    totalsBlock = `${prefix}Subtotal: ${formatPrice(promo.subtotal)}\nDesconto ${promo.discountLabel} (${promo.title}): -${formatPrice(promo.discountAmount)}\nTotal: ${formatPrice(promo.total)}`;
  }

  const pickupBlock = pickupDate?.trim()
    ? `\n\nRetirada: ${formatPickupDate(pickupDate.trim())}`
    : "";
  const noteBlock = note?.trim() ? `\n\nObs: ${note.trim()}` : "";
  const message = `CONFIRMAÇÃO DE PEDIDO\n\n${lines.join("\n")}\n\nDecoração:\n\n${totalsBlock}${pickupBlock}${noteBlock}\n\nHorario de retirada:\n\n\nPode confirmar?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Formata YYYY-MM-DD para dd/mm/aaaa. */
export function formatPickupDate(isoDate: string) {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function buildPromotionWhatsAppLink(
  phone: string,
  promotion: { title: string; description: string; discountLabel: string }
) {
  const text = `Olá! Quero aproveitar a promoção *${promotion.title}* (${promotion.discountLabel}).\n\n${promotion.description}\n\nPode me ajudar a montar o pedido?`;
  return buildGeneralWhatsAppLink(phone, text);
}
