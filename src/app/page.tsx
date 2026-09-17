import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { PromoOrderButton } from "@/components/PromoOrderButton";
import { SafeImage } from "@/components/SafeImage";
import { readStore } from "@/lib/store";
import { buildGeneralWhatsAppLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await readStore();
  const featured = store.products.filter((p) => p.active && p.featured).slice(0, 3);
  const promotions = store.promotions.filter((p) => p.active).slice(0, 1);
  const news = store.news.filter((n) => n.active).slice(0, 2);
  const heroImage =
    promotions[0]?.image ||
    featured[0]?.image ||
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80";

  const activeProducts = store.products.filter((p) => p.active);
  const bolo =
    activeProducts.find((p) => /bolo/i.test(p.category) || /bolo/i.test(p.name)) ||
    null;
  const torta =
    activeProducts.find(
      (p) =>
        p.id !== bolo?.id &&
        (/torta/i.test(p.category) || /torta/i.test(p.name))
    ) || null;
  const comboProducts = [bolo, torta].filter(Boolean) as typeof activeProducts;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="relative min-h-[100svh] overflow-hidden grain">
          <SafeImage
            src={heroImage}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso/85 via-espresso/55 to-espresso/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/50 via-transparent to-espresso/20" />
          <SiteHeader
            storeName={store.settings.storeName}
            whatsapp={store.settings.whatsapp}
          />
          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:px-8 md:pb-24">
            <p className="reveal font-display text-5xl leading-none tracking-[0.12em] text-foam md:text-7xl lg:text-8xl">
              {store.settings.storeName}
            </p>
            <h1 className="reveal reveal-delay-1 mt-6 max-w-xl font-display text-2xl leading-snug text-foam md:text-4xl">
              Beleza artesanal para o seu dia a dia
            </h1>
            <p className="reveal reveal-delay-2 mt-4 max-w-lg text-base leading-relaxed text-foam/85 md:text-lg">
              {store.settings.tagline}
            </p>
            <div className="reveal reveal-delay-3 mt-8 flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn-primary">
                Ver catálogo
              </Link>
              <a
                href={buildGeneralWhatsAppLink(store.settings.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost !border-foam/35 !bg-white/10 !text-foam hover:!bg-white/20"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>

        {promotions[0] ? (
          <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
            <p className="text-xs uppercase tracking-[0.2em] text-mocha">
              Promoção em destaque
            </p>
            <div className="mt-6 grid items-center gap-8 md:grid-cols-2">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[1.8rem]">
                <SafeImage
                  src={promotions[0].image}
                  alt={promotions[0].title}
                  fill
                  className="object-cover float-soft"
                  sizes="(max-width:768px) 100vw, 50vw"
                />
              </div>
              <div>
                <p className="inline-block rounded-full bg-caramel/20 px-3 py-1 text-sm font-semibold text-mocha">
                  {promotions[0].discountLabel}
                </p>
                <h2 className="mt-4 font-display text-4xl text-espresso md:text-5xl">
                  {promotions[0].title}
                </h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-espresso/75">
                  {promotions[0].description}
                </p>
                <PromoOrderButton
                  promotion={promotions[0]}
                  whatsapp={store.settings.whatsapp}
                  suggestedProducts={comboProducts}
                />
              </div>
            </div>
          </section>
        ) : null}

        <section className="border-y border-cappuccino/40 bg-foam/40 py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-mocha">
                  Seleção
                </p>
                <h2 className="mt-2 font-display text-4xl text-espresso">
                  Destaques do MK Gourmet
                </h2>
              </div>
              <Link
                href="/catalogo"
                className="text-sm font-semibold text-mocha underline-offset-4 hover:underline"
              >
                Ver tudo
              </Link>
            </div>
            <div className="divide-y divide-cappuccino/40 rounded-[1.4rem] border border-cappuccino/50 bg-foam/70 px-4 py-2 md:px-6 md:py-3">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {news.length > 0 ? (
          <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
            <p className="text-xs uppercase tracking-[0.2em] text-mocha">
              Novidades
            </p>
            <h2 className="mt-2 font-display text-4xl text-espresso">
              O que chegou agora
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {news.map((item) => (
                <article key={item.id} className="grid gap-5 md:grid-cols-[1.1fr_1fr] md:items-center">
                  <div className="relative aspect-[16/11] overflow-hidden rounded-[1.4rem]">
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw, 40vw"
                    />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-espresso">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-espresso/75">
                      {item.content}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter storeName={store.settings.storeName} />
    </div>
  );
}
