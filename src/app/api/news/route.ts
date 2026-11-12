import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createId } from "@/lib/store";
import { insertNewsItem, listNews } from "@/lib/database";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import type { NewsItem } from "@/lib/types";

export async function GET() {
  const admin = await isAdminAuthenticated();
  const news = await listNews({ activeOnly: !admin });
  return NextResponse.json(news);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();

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

  await insertNewsItem(item);
  revalidateStorefront();
  return NextResponse.json(item, { status: 201 });
}
