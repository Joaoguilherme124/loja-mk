import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
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

  const product: Product = {
    id: createId("p"),
    name: String(body.name || "").trim(),
    description: String(body.description || "").trim(),
    price: Number(body.price) || 0,
    image: String(body.image || "").trim(),
    category: String(body.category || "Geral").trim(),
    featured: Boolean(body.featured),
    active: body.active !== false,
    createdAt: new Date().toISOString(),
  };

  if (!product.name || !product.image) {
    return NextResponse.json(
      { error: "Nome e imagem são obrigatórios" },
      { status: 400 }
    );
  }

  store.products.unshift(product);
  await writeStore(store);
  return NextResponse.json(product, { status: 201 });
}
