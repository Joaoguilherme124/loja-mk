"use client";

import { useCart } from "@/components/CartProvider";

export function FloatingCartButton() {
  const { count, openCart, isOpen } = useCart();

  if (isOpen || count <= 0) return null;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Abrir pedido com ${count} ${count === 1 ? "item" : "itens"}`}
      className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-espresso text-foam shadow-[0_16px_40px_rgba(59,42,34,0.35)] outline-none transition hover:scale-105 hover:bg-mocha focus-visible:ring-2 focus-visible:ring-foam focus-visible:ring-offset-2 md:bottom-8 md:right-8"
    >
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="h-8 w-8"
        >
          <path
            d="M3.5 4h1.7l1.1 1.2 1.4 8.1a1.8 1.8 0 0 0 1.8 1.5h7.8a1.8 1.8 0 0 0 1.8-1.4l1.2-5.4H8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="19" r="1.4" fill="currentColor" />
          <circle cx="17" cy="19" r="1.4" fill="currentColor" />
        </svg>
        <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-caramel px-1 text-xs font-bold text-espresso shadow-sm">
          {count > 99 ? "99+" : count}
        </span>
      </span>
    </button>
  );
}
