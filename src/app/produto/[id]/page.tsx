import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderPanel } from "@/components/OrderPanel";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SafeImage } from "@/components/SafeImage";
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
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.8rem] bg-cappuccino/30">
          <SafeImage
            src={product.image}
            alt={product.name}
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
          <OrderPanel product={product} whatsapp={store.settings.whatsapp} />
        </div>
      </main>

      <SiteFooter storeName={store.settings.storeName} />
    </div>
  );
}
