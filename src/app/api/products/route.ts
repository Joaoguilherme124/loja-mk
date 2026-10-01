import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { parseVariants, withSyncedPricing } from "@/lib/product-variants";
import { parseSoldBy } from "@/lib/sold-by";
import { parseProductKind } from "@/lib/product-kind";
import { createId, readStore, writeStore } from "@/lib/store";
import type { Product } from "@/lib/types";

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store.products.filter((p) => p.active || true));
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const store = await readStore();
  const variants = parseVariants(body.variants);

  const product = withSyncedPricing({
    id: createId("p"),
    name: String(body.name || "").trim(),
    description: String(body.description || "").trim(),
    price: Number(body.price) || 0,
    soldBy: parseSoldBy(body.soldBy),
    kind: parseProductKind(body.kind),
    image: String(body.image || "").trim(),
    images: Array.isArray(body.images)
      ? body.images.map((item: unknown) => String(item || "").trim()).filter(Boolean)
      : undefined,
    category: String(body.category || "Geral").trim(),
    featured: Boolean(body.featured),
    active: body.active !== false,
    createdAt: new Date().toISOString(),
    variants,
  } satisfies Product);

  if (!product.name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  if (variants.length === 0 && product.price <= 0) {
    return NextResponse.json(
      { error: "Nome e preço são obrigatórios" },
      { status: 400 }
    );
  }

  store.products.unshift(product);
  await writeStore(store);
  return NextResponse.json(product, { status: 201 });
}
