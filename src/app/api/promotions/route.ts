import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createId, readStore, writeStore } from "@/lib/store";
import type { Promotion } from "@/lib/types";

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store.promotions);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const store = await readStore();

  const promotion: Promotion = {
    id: createId("promo"),
    title: String(body.title || "").trim(),
    description: String(body.description || "").trim(),
    discountLabel: String(body.discountLabel || "").trim(),
    image: String(body.image || "").trim(),
    active: body.active !== false,
    createdAt: new Date().toISOString(),
  };

  if (!promotion.title) {
    return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
  }

  store.promotions.unshift(promotion);
  await writeStore(store);
  return NextResponse.json(promotion, { status: 201 });
}
