import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminAuthenticated } from "@/lib/auth";
import { createId, readStore } from "@/lib/store";
import { readDatabase, writeDatabase } from "@/lib/database";
import type { Order, OrderItem } from "@/lib/types";

async function isAuthenticated(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("mk_user_session")?.value;
  if (!token) return null;

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return null;

  try {
    const userData = JSON.parse(
      Buffer.from(issuedAt, "base64").toString("utf-8")
    );
    return userData.id;
  } catch {
    return null;
  }
}

async function isUserAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("mk_user_session")?.value;
  if (!token) return false;

  const [issuedAt] = token.split(".");
  if (!issuedAt) return false;

  try {
    const userData = JSON.parse(
      Buffer.from(issuedAt, "base64").toString("utf-8")
    );
    return userData.role === "admin";
  } catch {
    return false;
  }
}

export async function GET() {
  const panelAdmin = await isAdminAuthenticated();
  const userAdmin = await isUserAdmin();
  const userId = await isAuthenticated();

  if (!panelAdmin && !userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { orders } = await readDatabase();

  if (panelAdmin || userAdmin) {
    return NextResponse.json(orders);
  }

  return NextResponse.json(orders.filter((o) => o.userId === userId));
}

export async function POST(request: Request) {
  const panelAdmin = await isAdminAuthenticated();
  const userId = await isAuthenticated();

  if (!panelAdmin && !userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const store = await readStore();
    const ordersData = await readDatabase();

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items: OrderItem[] = rawItems
      .map(
        (item: {
          productId?: string;
          quantity?: number;
          variantId?: string;
        }) => {
          const product = store.products.find((p) => p.id === item.productId);
          if (!product) return null;
          const variant =
            (product.variants || []).find(
              (entry) => entry.id === item.variantId
            ) ||
            ((product.variants || []).length > 0
              ? product.variants![0]
              : undefined);
          const price = variant?.price ?? product.price;
          const variantLabelText = variant
            ? `${variant.size} · ${variant.style}`
            : undefined;
          return {
            productId: product.id,
            productName: variantLabelText
              ? `${product.name} (${variantLabelText})`
              : product.name,
            quantity: Math.max(1, Number(item.quantity) || 1),
            price,
            variantId: variant?.id,
            variantLabel: variantLabelText,
          };
        }
      )
      .filter(Boolean) as OrderItem[];

    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const customerName = String(body.customerName || "").trim();
    const customerPhone = String(body.customerPhone || "").trim();
    const customerEmail = String(body.customerEmail || "").trim();
    const deliveryDate = String(body.deliveryDate || "").trim();
    const deliveryTime = String(body.deliveryTime || "").trim();
    const notes = String(body.notes || "").trim();

    const allowedStatus = [
      "pendente",
      "confirmado",
      "pronto",
      "entregue",
      "cancelado",
    ];
    const status =
      panelAdmin && allowedStatus.includes(body.status)
        ? body.status
        : "pendente";

    if (!customerName || !customerPhone || items.length === 0) {
      return NextResponse.json(
        {
          error:
            "Informe nome, telefone e pelo menos um produto do catálogo",
        },
        { status: 400 }
      );
    }

    const order: Order = {
      id: createId("order"),
      userId: userId || "manual",
      customerName,
      customerEmail,
      customerPhone,
      items,
      totalPrice,
      status,
      notes,
      deliveryDate: deliveryDate || new Date().toISOString().slice(0, 10),
      deliveryTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ordersData.orders.unshift(order);
    await writeDatabase(ordersData);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { error: "Erro ao criar pedido" },
      { status: 500 }
    );
  }
}
