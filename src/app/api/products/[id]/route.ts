import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { parseVariants, withSyncedPricing } from "@/lib/product-variants";
import { readStore, writeStore } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const store = await readStore();
  const product = store.products.find((p) => p.id === id);
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const store = await readStore();
  const index = store.products.findIndex((p) => p.id === id);

  if (index < 0) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const current = store.products[index];
  const variants = parseVariants(
    body.variants !== undefined ? body.variants : current.variants
  );

  const product = withSyncedPricing({
    ...current,
    name: String(body.name ?? current.name).trim(),
    description: String(body.description ?? current.description).trim(),
    price: Number(body.price ?? current.price),
    image: String(body.image ?? current.image).trim(),
    category: String(body.category ?? current.category).trim(),
    featured: Boolean(body.featured),
    active: body.active !== false,
    variants,
  });

  if (!product.name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  if (variants.length === 0 && !product.image) {
    return NextResponse.json(
      { error: "Imagem é obrigatória (ou adicione variações)" },
      { status: 400 }
    );
  }

  store.products[index] = product;
  await writeStore(store);
  return NextResponse.json(store.products[index]);
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const store = await readStore();
  store.products = store.products.filter((p) => p.id !== id);
  await writeStore(store);
  return NextResponse.json({ ok: true });
}
