import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  deletePromotionById,
  listPromotions,
  updatePromotionRecord,
} from "@/lib/database";
import { revalidateStorefront } from "@/lib/revalidate-storefront";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const promotions = await listPromotions();
  const current = promotions.find((item) => item.id === id);

  if (!current) {
    return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 });
  }

  const saved = await updatePromotionRecord({
    ...current,
    title: String(body.title ?? current.title).trim(),
    description: String(body.description ?? current.description).trim(),
    discountLabel: String(body.discountLabel ?? current.discountLabel).trim(),
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
  await deletePromotionById(id);
  revalidateStorefront();
  return NextResponse.json({ ok: true });
}
