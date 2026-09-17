"use client";

import Link from "next/link";
import { CartDrawer } from "@/components/CartDrawer";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { buildGeneralWhatsAppLink } from "@/lib/whatsapp";

type Props = {
  storeName: string;
  whatsapp: string;
};

export function SiteHeader({ storeName, whatsapp }: Props) {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link
          href="/"
          className="rounded-sm font-display text-2xl tracking-[0.08em] text-foam outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-foam md:text-[1.7rem]"
        >
          {storeName}
        </Link>
        <nav className="flex items-center gap-2 text-sm md:gap-3">
          <Link
            href="/catalogo"
            className="rounded-full px-3 py-2 text-foam/90 outline-none transition hover:bg-white/10 hover:text-foam focus-visible:ring-2 focus-visible:ring-foam"
          >
            Catálogo
          </Link>
          <a
            href={buildGeneralWhatsAppLink(whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-foam/95 px-4 py-2 font-semibold text-espresso shadow-sm outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-foam"
          >
            WhatsApp
          </a>
        </nav>
      </div>
      <FloatingCartButton />
      <CartDrawer whatsapp={whatsapp} />
    </header>
  );
}
