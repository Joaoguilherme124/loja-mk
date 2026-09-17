import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
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

  store.products[index] = {
    ...store.products[index],
    name: String(body.name ?? store.products[index].name).trim(),
    description: String(body.description ?? store.products[index].description).trim(),
    price: Number(body.price ?? store.products[index].price),
    image: String(body.image ?? store.products[index].image).trim(),
    category: String(body.category ?? store.products[index].category).trim(),
    featured: Boolean(body.featured),
    active: body.active !== false,
  };

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
