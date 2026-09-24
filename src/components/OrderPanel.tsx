"use client";

import { useCart } from "@/components/CartProvider";
import {
  formatRate,
  parseSoldBy,
} from "@/lib/sold-by";
import { buildWhatsAppLink, formatPrice } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  whatsapp: string;
};

/** Painel simples para produtos sem a página ProductDetail (legado). */
export function OrderPanel({ product, whatsapp }: Props) {
  const { addItem } = useCart();
  const soldBy = parseSoldBy(product.soldBy);
  const link = buildWhatsAppLink(whatsapp, { ...product, soldBy }, 1);

  return (
    <div className="space-y-5 rounded-[1.5rem] border border-cappuccino/60 bg-foam/70 p-5 shadow-[0_16px_40px_rgba(59,42,34,0.08)] backdrop-blur-sm md:p-6">
      <div>
        <p className="text-sm text-mocha">
          {soldBy === "kg" ? "Valor por kg" : "Valor unitário"}
        </p>
        <p className="font-display text-3xl text-espresso">
          {formatRate(product.price, soldBy, formatPrice)}
        </p>
      </div>
      <button
        type="button"
        className="btn-primary w-full"
        onClick={() =>
          addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            soldBy,
          })
        }
      >
        Adicionar ao pedido
      </button>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost w-full"
      >
        Pedir só este no WhatsApp
      </a>
    </div>
  );
}
