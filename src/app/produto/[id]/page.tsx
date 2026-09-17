import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const store = await readStore();
  const product = store.products.find((p) => p.id === id && p.active);

  if (!product) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative bg-espresso pb-10 pt-4">
        <SiteHeader
          storeName={store.settings.storeName}
          whatsapp={store.settings.whatsapp}
        />
        <div className="mx-auto max-w-6xl px-5 pt-24 md:px-8">
          <Link href="/catalogo" className="text-sm text-foam/70 hover:text-foam">
            ← Catálogo
          </Link>
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-5 py-12 md:grid-cols-2 md:px-8">
        <ProductDetail product={product} whatsapp={store.settings.whatsapp} />
      </main>

      <SiteFooter storeName={store.settings.storeName} />
    </div>
  );
}
