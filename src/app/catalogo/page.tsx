import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const store = await readStore();
  const products = store.products.filter((p) => p.active);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="relative overflow-hidden bg-espresso pb-16 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(176,137,104,0.35),transparent_45%)]" />
        <SiteHeader
          storeName={store.settings.storeName}
          whatsapp={store.settings.whatsapp}
        />
        <div className="relative z-10 mx-auto max-w-6xl px-5 pt-24 md:px-8">
          <Link href="/" className="text-sm text-foam/70 hover:text-foam">
            ← Voltar
          </Link>
          <h1 className="mt-4 font-display text-5xl text-foam md:text-6xl">
            Catálogo
          </h1>
          <p className="mt-3 max-w-xl text-foam/80">
            Adicione quantos itens quiser ao pedido e envie tudo de uma vez no
            WhatsApp.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 md:px-8">
        {products.length === 0 ? (
          <p className="rounded-2xl border border-cappuccino/60 bg-foam/60 p-8 text-espresso/80">
            Nenhum produto publicado ainda. A empreendedora pode adicionar itens
            no painel.
          </p>
        ) : (
          <div className="divide-y divide-cappuccino/40 rounded-[1.4rem] border border-cappuccino/50 bg-foam/70 px-4 py-2 md:px-6 md:py-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter storeName={store.settings.storeName} />
    </div>
  );
}
