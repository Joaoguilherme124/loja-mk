import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createId } from "@/lib/store";
import { insertPromotion, listPromotions } from "@/lib/database";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import type { Promotion } from "@/lib/types";

export async function GET() {
  const admin = await isAdminAuthenticated();
  const promotions = await listPromotions({ activeOnly: !admin });
  return NextResponse.json(promotions);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();

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

  await insertPromotion(promotion);
  revalidateStorefront();
  return NextResponse.json(promotion, { status: 201 });
}
