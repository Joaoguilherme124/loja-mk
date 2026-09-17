"use client";

import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import { useCart } from "@/components/CartProvider";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";

type Props = {
  product: Product;
};

export function ProductCard({ product }: Props) {
  const { addItem } = useCart();

  return (
    <article className="border-b border-cappuccino/40 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-4 md:gap-5">
        <Link
          href={`/produto/${product.id}`}
          className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-cappuccino/30 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-mocha md:h-32 md:w-32"
        >
          <SafeImage
            src={product.image}
            alt={product.name}
            fill
            sizes="128px"
            className="object-cover"
          />
        </Link>

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
              {formatPrice(product.price)}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/produto/${product.id}`}
                className="btn-ghost !px-3 !py-2 !text-sm"
              >
                Detalhes
              </Link>
              <button
                type="button"
                className="btn-primary !px-3 !py-2 !text-sm"
                onClick={() =>
                  addItem({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  })
                }
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
