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
  const index = store.news.findIndex((n) => n.id === id);

  if (index < 0) {
    return NextResponse.json({ error: "Novidade não encontrada" }, { status: 404 });
  }

  store.news[index] = {
    ...store.news[index],
    title: String(body.title ?? store.news[index].title).trim(),
    content: String(body.content ?? store.news[index].content).trim(),
    image: String(body.image ?? store.news[index].image).trim(),
    active: body.active !== false,
  };

  await writeStore(store);
  return NextResponse.json(store.news[index]);
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const store = await readStore();
  store.news = store.news.filter((n) => n.id !== id);
  await writeStore(store);
  return NextResponse.json({ ok: true });
}
