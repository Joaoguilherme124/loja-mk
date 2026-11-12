import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { parseVariants, withSyncedPricing } from "@/lib/product-variants";
import { parseSoldBy } from "@/lib/sold-by";
import { parseProductKind } from "@/lib/product-kind";
import {
  deleteProductById,
  getProductById,
  updateProductRecord,
} from "@/lib/database";
import { revalidateStorefront } from "@/lib/revalidate-storefront";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const product = await getProductById(id);
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
  const current = await getProductById(id);

  if (!current) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const variants = parseVariants(
    body.variants !== undefined ? body.variants : current.variants
  );

  const product = withSyncedPricing({
    ...current,
    name: String(body.name ?? current.name).trim(),
    description: String(body.description ?? current.description).trim(),
    price: Number(body.price ?? current.price),
    soldBy: parseSoldBy(
      body.soldBy !== undefined ? body.soldBy : current.soldBy
    ),
    kind: parseProductKind(
      body.kind !== undefined ? body.kind : current.kind
    ),
    image: String(body.image ?? current.image).trim(),
    images:
      body.images !== undefined
        ? Array.isArray(body.images)
          ? body.images
              .map((item: unknown) => String(item || "").trim())
              .filter(Boolean)
          : current.images
        : current.images,
    category: String(body.category ?? current.category).trim(),
    featured: Boolean(body.featured),
    active: body.active !== false,
    variants,
  });

  if (!product.name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  if (variants.length === 0 && product.price <= 0) {
    return NextResponse.json(
      { error: "Preço é obrigatório" },
      { status: 400 }
    );
  }

  const saved = await updateProductRecord(product);
  revalidateStorefront();
  return NextResponse.json(saved);
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await deleteProductById(id);
  revalidateStorefront();
  return NextResponse.json({ ok: true });
}
