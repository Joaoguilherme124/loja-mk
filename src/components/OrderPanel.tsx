"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { buildWhatsAppLink, formatPrice } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  whatsapp: string;
};

export function OrderPanel({ product, whatsapp }: Props) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const link = useMemo(
    () => buildWhatsAppLink(whatsapp, product, quantity),
    [whatsapp, product, quantity]
  );

  return (
    <div className="space-y-5 rounded-[1.5rem] border border-cappuccino/60 bg-foam/70 p-5 shadow-[0_16px_40px_rgba(59,42,34,0.08)] backdrop-blur-sm md:p-6">
      <div>
        <p className="text-sm text-mocha">Valor unitário</p>
        <p className="font-display text-3xl text-espresso">
          {formatPrice(product.price)}
        </p>
      </div>

      <label className="block space-y-2 text-sm font-medium text-espresso">
        Quantidade
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="h-10 w-10 rounded-full border border-cappuccino bg-white/70 text-lg"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Diminuir"
          >
            −
          </button>
          <span className="min-w-8 text-center text-lg font-semibold">
            {quantity}
          </span>
          <button
            type="button"
            className="h-10 w-10 rounded-full border border-cappuccino bg-white/70 text-lg"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Aumentar"
          >
            +
          </button>
        </div>
      </label>

      <p className="text-sm text-espresso/70">
        Total estimado:{" "}
        <strong className="text-espresso">
          {formatPrice(product.price * quantity)}
        </strong>
      </p>

      <button
        type="button"
        className="btn-primary w-full"
        onClick={() =>
          addItem(
            {
              productId: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
            },
            quantity
          )
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
