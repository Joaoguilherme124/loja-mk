"use client";

import Image from "next/image";
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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          href="/"
          className="outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-foam rounded-full"
          aria-label={storeName}
        >
          <Image
            src="/logo-mk-gourmet.png"
            alt={storeName}
            width={56}
            height={56}
            className="h-12 w-12 rounded-full object-cover shadow-md ring-2 ring-foam/40 md:h-14 md:w-14"
            priority
          />
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
