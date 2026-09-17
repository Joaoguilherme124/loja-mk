import type { Product } from "./types";

export function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function buildWhatsAppLink(
  phone: string,
  product: Pick<Product, "name" | "price">,
  quantity = 1
) {
  const digits = phone.replace(/\D/g, "");
  const total = formatPrice(product.price * quantity);
  const message = `Olá! Quero pedir: *${product.name}* — ${quantity} unidade(s). Valor: ${total}. Pode confirmar?`;
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
  }
) {
  const digits = phone.replace(/\D/g, "");
  const lines = items.map(
    (item) =>
      `• ${item.quantity}x ${item.name} — ${formatPrice(item.price * item.quantity)}`
  );
  const subtotal =
    promo?.subtotal ??
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = promo?.total ?? subtotal;

  let totalsBlock = `*Total estimado:* ${formatPrice(total)}`;
  if (promo && promo.discountAmount > 0) {
    totalsBlock = `Subtotal: ${formatPrice(promo.subtotal)}\nDesconto ${promo.discountLabel} (${promo.title}): -${formatPrice(promo.discountAmount)}\n*Total estimado:* ${formatPrice(promo.total)}`;
  }

  const noteBlock = note?.trim() ? `\n\nObs: ${note.trim()}` : "";
  const message = `Olá! Quero fazer este pedido:\n\n${lines.join("\n")}\n\n${totalsBlock}${noteBlock}\n\nPode confirmar?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildPromotionWhatsAppLink(
  phone: string,
  promotion: { title: string; description: string; discountLabel: string }
) {
  const text = `Olá! Quero aproveitar a promoção *${promotion.title}* (${promotion.discountLabel}).\n\n${promotion.description}\n\nPode me ajudar a montar o pedido?`;
  return buildGeneralWhatsAppLink(phone, text);
}
