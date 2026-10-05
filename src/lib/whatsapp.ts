import { formatQuantity, formatRate, isSoldByKg } from "./sold-by";
import type { Product, SoldBy } from "./types";

export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
  const lines = items.map((item) => {
    const soldBy = item.soldBy || "unit";
    const qty = isSoldByKg(soldBy)
      ? formatQuantity(item.quantity, soldBy)
      : `${item.quantity}x`;
    return `• ${qty} ${item.name} — ${formatPrice(item.price * item.quantity)}`;
  });
  const subtotal =
    promo?.subtotal ??
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = promo?.total ?? subtotal;

  let totalsBlock = `*Total estimado:* ${formatPrice(total)}`;
  if (promo && promo.discountAmount > 0) {
    totalsBlock = `Subtotal: ${formatPrice(promo.subtotal)}\nDesconto ${promo.discountLabel} (${promo.title}): -${formatPrice(promo.discountAmount)}\n*Total estimado:* ${formatPrice(promo.total)}`;
  }

  const pickupBlock = pickupDate?.trim()
    ? `\n\n*Retirada:* ${formatPickupDate(pickupDate.trim())}`
    : "";
  const noteBlock = note?.trim() ? `\n\nObs: ${note.trim()}` : "";
  const confirmBlock =
    "\n\nHorário de retirada e valor de topo (se houver) confirmamos no WhatsApp.";
  const message = `Olá! Quero fazer este pedido:\n\n${lines.join("\n")}\n\n${totalsBlock}${pickupBlock}${noteBlock}${confirmBlock}\n\nPode confirmar?`;
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
