import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const store = await readStore();
  const index = store.promotions.findIndex((p) => p.id === id);

  if (index < 0) {
    return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 });
  }

  store.promotions[index] = {
    ...store.promotions[index],
    title: String(body.title ?? store.promotions[index].title).trim(),
    description: String(
      body.description ?? store.promotions[index].description
    ).trim(),
    discountLabel: String(
      body.discountLabel ?? store.promotions[index].discountLabel
    ).trim(),
    image: String(body.image ?? store.promotions[index].image).trim(),
    active: body.active !== false,
  };

  await writeStore(store);
  return NextResponse.json(store.promotions[index]);
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const store = await readStore();
  store.promotions = store.promotions.filter((p) => p.id !== id);
  await writeStore(store);
  return NextResponse.json({ ok: true });
}
