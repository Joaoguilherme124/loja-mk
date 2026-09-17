import { NextRequest, NextResponse } from "next/server";
import { registerUser, setUserSession } from "@/lib/auth-user";

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, role } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, nome e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const validRoles = ["cliente", "empreendedor"];
    const userRole = validRoles.includes(role) ? role : "cliente";

    const result = await registerUser(email, name, password, userRole);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    await setUserSession(result.user!);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        role: result.user!.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar" },
      { status: 500 }
    );
  }
}
