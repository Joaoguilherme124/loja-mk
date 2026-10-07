import { NextResponse } from "next/server";
import { createId } from "@/lib/store";
import { insertOrder } from "@/lib/database";
import type { Order, OrderItem, SoldBy } from "@/lib/types";

export const dynamic = "force-dynamic";

type IncomingItem = {
  productId?: string;
  productName?: string;
  name?: string;
  quantity?: number;
  price?: number;
  soldBy?: SoldBy;
  variantId?: string;
  variantLabel?: string;
};

function parseItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: IncomingItem) => {
      const productName = String(item.productName || item.name || "").trim();
      const productId = String(item.productId || "custom").trim() || "custom";
      const price = Number(item.price);
      const soldBy: SoldBy = item.soldBy === "kg" ? "kg" : "unit";
      const rawQty = Number(item.quantity);
      const quantity =
        soldBy === "kg"
          ? Math.max(0.5, Math.round((rawQty || 1) * 2) / 2)
          : Math.max(1, Math.round(rawQty || 1));
      if (!productName || !Number.isFinite(price) || price < 0) return null;
      return {
        productId,
        productName,
        quantity,
        price,
        soldBy,
        variantId: item.variantId ? String(item.variantId) : undefined,
        variantLabel: item.variantLabel
          ? String(item.variantLabel)
          : undefined,
      } satisfies OrderItem;
    })
    .filter(Boolean) as OrderItem[];
}

/** Pedido criado pelo site ao enviar o carrinho no WhatsApp (sem login). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = parseItems(body.items);
    const customerName =
      String(body.customerName || "").trim() || "Cliente WhatsApp";
    const customerPhone = String(body.customerPhone || "")
      .replace(/\D/g, "")
      .trim();
    const deliveryDate = String(body.deliveryDate || "").trim();
    const notes = String(body.notes || "").trim();
    const extraAmount = Math.max(0, Number(body.extraAmount) || 0);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Informe pelo menos um item do pedido." },
        { status: 400 }
      );
    }

    if (!deliveryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Informe o dia de retirada." },
        { status: 400 }
      );
    }

    if (customerPhone && customerPhone.length < 10) {
      return NextResponse.json(
        { error: "Telefone inválido. Use DDD + número." },
        { status: 400 }
      );
    }

    const itemsTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalPrice =
      Number(body.totalPrice) > 0 ? Number(body.totalPrice) : itemsTotal;

    const defaultNotes =
      "Pedido pelo site (WhatsApp). Completar horário de retirada e valor do topo, se houver.";

    const order: Order = {
      id: createId("order"),
      userId: "whatsapp",
      customerName,
      customerEmail: "",
      customerPhone: customerPhone || "a confirmar",
      items,
      totalPrice,
      extraAmount,
      status: "pendente",
      notes: notes || defaultNotes,
      deliveryDate,
      deliveryTime: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await insertOrder(order);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pedido WhatsApp:", error);
    return NextResponse.json(
      { error: "Erro ao registrar pedido" },
      { status: 500 }
    );
  }
}
