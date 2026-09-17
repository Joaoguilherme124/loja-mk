"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { SafeImage } from "@/components/SafeImage";
import {
  findVariant,
  hasVariants,
  uniqueSizes,
  uniqueStyles,
  variantLabel,
} from "@/lib/product-variants";
import { buildWhatsAppLink, formatPrice } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  whatsapp: string;
};

export function ProductDetail({ product, whatsapp }: Props) {
  const variantsEnabled = hasVariants(product);
  const sizes = uniqueSizes(product);
  const styles = uniqueStyles(product);
  const [size, setSize] = useState(sizes[0] || "");
  const [style, setStyle] = useState(styles[0] || "");
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const selectedVariant = useMemo(() => {
    if (!variantsEnabled) return null;
    return findVariant(product, size, style) || product.variants?.[0] || null;
  }, [variantsEnabled, product, size, style]);

  const unitPrice = selectedVariant?.price ?? product.price;
  const image = selectedVariant?.image ?? product.image;
  const displayName = selectedVariant
    ? `${product.name} (${variantLabel(selectedVariant)})`
    : product.name;

  const availableStylesForSize = useMemo(() => {
    if (!variantsEnabled) return styles;
    return styles.filter((entry) => findVariant(product, size, entry));
  }, [variantsEnabled, styles, product, size]);

  const link = useMemo(
    () =>
      buildWhatsAppLink(
        whatsapp,
        { name: displayName, price: unitPrice },
        quantity
      ),
    [whatsapp, displayName, unitPrice, quantity]
  );

  function selectSize(nextSize: string) {
    setSize(nextSize);
    const nextStyles = styles.filter((styleOption) =>
      findVariant(product, nextSize, styleOption)
    );
    if (!nextStyles.includes(style)) {
      setStyle(nextStyles[0] || "");
    }
  }

  return (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.8rem] bg-cappuccino/30">
        <SafeImage
          src={image}
          alt={displayName}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 50vw"
          priority
        />
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mocha">
            {product.category}
          </p>
          <h1 className="mt-2 font-display text-4xl text-espresso md:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-espresso/75">
            {product.description}
          </p>
        </div>

        <div className="space-y-5 rounded-[1.5rem] border border-cappuccino/60 bg-foam/70 p-5 shadow-[0_16px_40px_rgba(59,42,34,0.08)] backdrop-blur-sm md:p-6">
          <div>
            <p className="text-sm text-mocha">Valor unitário</p>
            <p className="font-display text-3xl text-espresso">
              {formatPrice(unitPrice)}
            </p>
          </div>

          {variantsEnabled ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-espresso">Tamanho</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm ${
                        size === entry
                          ? "border-mocha bg-mocha text-foam"
                          : "border-cappuccino bg-white/70 text-espresso"
                      }`}
                      onClick={() => selectSize(entry)}
                    >
                      {entry}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-espresso">Estilo</p>
                <div className="flex flex-wrap gap-2">
                  {availableStylesForSize.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm ${
                        style === entry
                          ? "border-mocha bg-mocha text-foam"
                          : "border-cappuccino bg-white/70 text-espresso"
                      }`}
                      onClick={() => setStyle(entry)}
                    >
                      {entry}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

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
              {formatPrice(unitPrice * quantity)}
            </strong>
          </p>

          <button
            type="button"
            className="btn-primary w-full"
            disabled={variantsEnabled && !selectedVariant}
            onClick={() =>
              addItem(
                {
                  productId: product.id,
                  variantId: selectedVariant?.id,
                  name: displayName,
                  price: unitPrice,
                  image,
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
      </div>
    </>
  );
}
