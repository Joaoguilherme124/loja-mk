"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import {
  isDocinhosProduct,
  isTortasCorteProduct,
  isTortasProduct,
  parseProductKind,
} from "@/lib/product-kind";
import type { Product, TortaCorteSizeOption, TortaSizeOption } from "@/lib/types";

type CatalogTab = "bolos" | "tortas" | "tortas-corte" | "docinhos";

const TABS: { id: CatalogTab; label: string }[] = [
  { id: "bolos", label: "Bolos" },
  { id: "tortas", label: "Tortas" },
  { id: "tortas-corte", label: "Tortas de corte" },
  { id: "docinhos", label: "Docinhos" },
];

function productTab(product: Product): CatalogTab {
  if (
    isTortasCorteProduct(product) ||
    parseProductKind(product.kind) === "tortas-corte"
  ) {
    return "tortas-corte";
  }
  if (isTortasProduct(product) || parseProductKind(product.kind) === "tortas") {
    return "tortas";
  }
  if (
    isDocinhosProduct(product) ||
    parseProductKind(product.kind) === "docinhos"
  ) {
    return "docinhos";
  }
  return "bolos";
}

type Props = {
  products: Product[];
  tortaSizes?: TortaSizeOption[];
  tortaCorteSizes?: TortaCorteSizeOption[];
};

export function CatalogProductTabs({
  products,
  tortaSizes,
  tortaCorteSizes,
}: Props) {
  const grouped = useMemo(() => {
    const map: Record<CatalogTab, Product[]> = {
      bolos: [],
      tortas: [],
      "tortas-corte": [],
      docinhos: [],
    };
    for (const product of products) {
      map[productTab(product)].push(product);
    }
    return map;
  }, [products]);

  const availableTabs = TABS.filter((tab) => grouped[tab.id].length > 0);
  const [active, setActive] = useState<CatalogTab>(
    availableTabs[0]?.id || "bolos"
  );

  const currentTab = availableTabs.some((tab) => tab.id === active)
    ? active
    : availableTabs[0]?.id || "bolos";
  const visible = grouped[currentTab] || [];

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-cappuccino/60 bg-foam/60 p-8 text-espresso/80">
        Nenhum produto publicado ainda. A empreendedora pode adicionar itens no
        painel.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Categorias do catálogo"
      >
        {availableTabs.map((tab) => {
          const selected = tab.id === currentTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selected
                  ? "border-mocha bg-mocha text-foam"
                  : "border-cappuccino/70 bg-foam/80 text-espresso hover:border-mocha/50"
              }`}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-cappuccino/60 bg-foam/60 p-8 text-espresso/80">
          Nenhum produto nesta categoria.
        </p>
      ) : (
        <div
          role="tabpanel"
          className="divide-y divide-cappuccino/40 rounded-[1.4rem] border border-cappuccino/50 bg-foam/70 px-4 py-2 md:px-6 md:py-3"
        >
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              tortaSizes={tortaSizes}
              tortaCorteSizes={tortaCorteSizes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
