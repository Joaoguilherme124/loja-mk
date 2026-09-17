import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth-user";

export async function GET() {
  try {
    const session = await getUserSession();
    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { error: "Erro ao verificar sessão" },
      { status: 500 }
    );
  }
}
