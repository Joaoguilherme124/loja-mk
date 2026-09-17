import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createId, readStore, writeStore } from "@/lib/store";
import type { NewsItem } from "@/lib/types";

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store.news);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const store = await readStore();

  const item: NewsItem = {
    id: createId("news"),
    title: String(body.title || "").trim(),
    content: String(body.content || "").trim(),
    image: String(body.image || "").trim(),
    active: body.active !== false,
    createdAt: new Date().toISOString(),
  };

  if (!item.title) {
    return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
  }

  store.news.unshift(item);
  await writeStore(store);
  return NextResponse.json(item, { status: 201 });
}
