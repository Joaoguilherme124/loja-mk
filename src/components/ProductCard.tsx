"use client";

import Link from "next/link";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SafeImage } from "@/components/SafeImage";
import { useCart } from "@/components/CartProvider";
import { displayPrice, hasVariants } from "@/lib/product-variants";
import { isDocinhosProduct, isTortasProduct } from "@/lib/product-kind";
import { productGallery } from "@/lib/product-images";
import { formatRate, parseSoldBy } from "@/lib/sold-by";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const price = displayPrice(product);
  const withOptions = hasVariants(product);
  const docinhos = isDocinhosProduct(product);
  const tortas = isTortasProduct(product);
  const soldBy = parseSoldBy(product.soldBy);
  const needsChoice = withOptions || soldBy === "kg" || docinhos || tortas;
  const priceLabel = formatRate(price, soldBy, formatPrice);
  const gallery = productGallery(product);

  return (
    <article className="border-b border-cappuccino/40 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-4 md:gap-5">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-cappuccino/30 md:h-32 md:w-32">
          {tortas && gallery.length > 0 ? (
            <ImageCarousel
              images={gallery}
              alt={product.name}
              sizes="128px"
              stopLinkNavigation
            />
          ) : (
            <Link
              href={`/produto/${product.id}`}
              className="absolute inset-0 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-mocha"
            >
              <SafeImage
                src={product.image}
                alt={product.name}
                fill
                sizes="128px"
                className="object-cover"
              />
            </Link>
          )}
          {tortas && gallery.length > 0 ? (
            <Link
              href={`/produto/${product.id}`}
              className="absolute inset-0 z-0"
              aria-label={`Ver ${product.name}`}
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <Link
            href={`/produto/${product.id}`}
            className="outline-none focus-visible:ring-2 focus-visible:ring-mocha"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-mocha/80">
              {product.category}
            </p>
            <h3 className="mt-1 font-display text-xl leading-tight text-espresso md:text-2xl">
              {product.name}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-espresso/70">
              {product.description}
            </p>
          </Link>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-semibold text-mocha md:text-lg">
              {withOptions || tortas
                ? `A partir de ${priceLabel}`
                : priceLabel}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/produto/${product.id}`}
                className="btn-ghost !px-3 !py-2 !text-sm"
              >
                {needsChoice ? "Escolher" : "Detalhes"}
              </Link>
              {!needsChoice ? (
                <button
                  type="button"
                  className="btn-primary !px-3 !py-2 !text-sm"
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
                  Adicionar
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
