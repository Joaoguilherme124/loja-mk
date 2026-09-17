import { NextResponse } from "next/server";
import { readDatabase, writeDatabase } from "@/lib/database";
import { cookies } from "next/headers";
import { isAdminAuthenticated } from "@/lib/auth";

async function isAdmin(): Promise<boolean> {
  if (await isAdminAuthenticated()) return true;

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const orderId = (await params).id;
    const body = await request.json();
    const data = await readDatabase();

    const order = data.orders.find((o) => o.id === orderId);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    if (body.status) order.status = body.status;
    if (body.notes !== undefined) order.notes = body.notes;
    if (body.deliveryDate) order.deliveryDate = body.deliveryDate;
    if (body.deliveryTime !== undefined) {
      order.deliveryTime = String(body.deliveryTime || "").trim();
    }
    order.updatedAt = new Date().toISOString();

    await writeDatabase(data);
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const orderId = (await params).id;
    const data = await readDatabase();

    data.orders = data.orders.filter((o) => o.id !== orderId);
    await writeDatabase(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}
