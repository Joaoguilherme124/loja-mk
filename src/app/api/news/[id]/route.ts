import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { deleteNewsById, listNews, updateNewsRecord } from "@/lib/database";
import { revalidateStorefront } from "@/lib/revalidate-storefront";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const news = await listNews();
  const current = news.find((item) => item.id === id);

  if (!current) {
    return NextResponse.json({ error: "Novidade não encontrada" }, { status: 404 });
  }

  const saved = await updateNewsRecord({
    ...current,
    title: String(body.title ?? current.title).trim(),
    content: String(body.content ?? current.content).trim(),
    image: String(body.image ?? current.image).trim(),
    active: body.active !== false,
  });
  revalidateStorefront();
  return NextResponse.json(saved);
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await deleteNewsById(id);
  revalidateStorefront();
  return NextResponse.json({ ok: true });
}
