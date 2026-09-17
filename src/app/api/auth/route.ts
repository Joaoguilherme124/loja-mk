import { NextResponse } from "next/server";
import {
  clearAdminSession,
  isAdminAuthenticated,
  setAdminSession,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const password = String(body.password || "");

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const ok = await isAdminAuthenticated();
  return NextResponse.json({ authenticated: ok });
}
