import Link from "next/link";
import { readStore } from "@/lib/store";
import { readDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const store = await readStore();
  const { orders } = await readDatabase();
  const pendingOrders = orders.filter((o) => o.status === "pendente").length;

  const cards = [
    {
      label: "Pedidos",
      value: orders.length,
      href: "/admin/pedidos",
      hint: `${pendingOrders} pendentes`,
    },
    {
      label: "Produtos",
      value: store.products.length,
      href: "/admin/produtos",
      hint: "Fotos, preços e catálogo",
    },
    {
      label: "Promoções",
      value: store.promotions.length,
      href: "/admin/promocoes",
      hint: "Campanhas em destaque",
    },
    {
      label: "Novidades",
      value: store.news.length,
      href: "/admin/novidades",
      hint: "Avisos da loja",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-espresso">Visão geral</h1>
        <p className="mt-2 text-espresso/70">
          Bem-vinda ao painel de {store.settings.storeName}. Gerencie tudo por
          aqui.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-[1.3rem] border border-cappuccino/50 bg-foam/75 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm text-mocha">{card.label}</p>
            <p className="mt-2 font-display text-4xl text-espresso">
              {card.value}
            </p>
            <p className="mt-2 text-sm text-espresso/65">{card.hint}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-[1.3rem] border border-cappuccino/50 bg-foam/70 p-6">
        <h2 className="font-display text-2xl text-espresso">Atalhos</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/produtos" className="btn-primary">
            Adicionar produto
          </Link>
          <Link href="/admin/configuracoes" className="btn-ghost">
            Configurar WhatsApp
          </Link>
        </div>
      </div>
    </div>
  );
}
