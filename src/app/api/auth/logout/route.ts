import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth-user";

export async function POST() {
  try {
    await clearUserSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer logout" },
      { status: 500 }
    );
  }
}
