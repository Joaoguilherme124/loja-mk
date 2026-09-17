"use client";

import { parsePercent, useCart } from "@/components/CartProvider";
import type { Product, Promotion } from "@/lib/types";
import { buildPromotionWhatsAppLink } from "@/lib/whatsapp";

type Props = {
  promotion: Promotion;
  whatsapp: string;
  suggestedProducts: Product[];
};

export function PromoOrderButton({
  promotion,
  whatsapp,
  suggestedProducts,
}: Props) {
  const { applyCombo } = useCart();
  const promoLink = buildPromotionWhatsAppLink(whatsapp, promotion);
  const percent = parsePercent(promotion.discountLabel, 15);

  function handleAddCombo() {
    if (suggestedProducts.length === 0) {
      window.open(promoLink, "_blank", "noopener,noreferrer");
      return;
    }

    applyCombo(
      suggestedProducts.map((product) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      })),
      {
        title: promotion.title,
        discountLabel: promotion.discountLabel || `${percent}% OFF`,
        percent,
        productIds: suggestedProducts.map((product) => product.id),
      }
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button type="button" className="btn-primary" onClick={handleAddCombo}>
        {suggestedProducts.length > 0
          ? "Montar combo no pedido"
          : "Aproveitar no WhatsApp"}
      </button>
      <a
        href={promoLink}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost"
      >
        Falar da promoção
      </a>
    </div>
  );
}
