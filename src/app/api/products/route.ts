import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { parseVariants, withSyncedPricing } from "@/lib/product-variants";
import { parseSoldBy } from "@/lib/sold-by";
import { parseProductKind } from "@/lib/product-kind";
import { createId } from "@/lib/store";
import { insertProduct, listProducts } from "@/lib/database";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import type { Product } from "@/lib/types";

export async function GET() {
  const admin = await isAdminAuthenticated();
  const products = await listProducts({ activeOnly: !admin });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const variants = parseVariants(body.variants);

  const product = withSyncedPricing({
    id: createId("p"),
    name: String(body.name || "").trim(),
    description: String(body.description || "").trim(),
    price: Number(body.price) || 0,
    soldBy: parseSoldBy(body.soldBy),
    kind: parseProductKind(body.kind),
    image: String(body.image || "").trim(),
    images: Array.isArray(body.images)
      ? body.images.map((item: unknown) => String(item || "").trim()).filter(Boolean)
      : undefined,
    category: String(body.category || "Geral").trim(),
    featured: Boolean(body.featured),
    active: body.active !== false,
    createdAt: new Date().toISOString(),
    variants,
  } satisfies Product);

  if (!product.name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  if (variants.length === 0 && product.price <= 0) {
    return NextResponse.json(
      { error: "Nome e preço são obrigatórios" },
      { status: 400 }
    );
  }

  await insertProduct(product);
  revalidateStorefront();
  return NextResponse.json(product, { status: 201 });
}
