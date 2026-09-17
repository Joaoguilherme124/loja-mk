import { NextRequest, NextResponse } from "next/server";
import { User, UserRole } from "@/lib/types";
import { readDatabase, writeDatabase } from "@/lib/database";

async function hashPassword(password: string): Promise<string> {
  const SECRET = process.env.AUTH_SECRET || "atelier-mk-dev-secret";
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SECRET);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// GET - Listar todos os usuários
export async function GET() {
  try {
    const store = await readDatabase();
    return NextResponse.json({
      success: true,
      users: store.users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao listar usuários" },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const { email, name, password, role } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, nome e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const store = await readDatabase();

    if (store.users.some((u) => u.email === email)) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ["cliente", "empreendedor", "admin"];
    const userRole = validRoles.includes(role as UserRole)
      ? (role as UserRole)
      : "cliente";

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      passwordHash,
      role: userRole,
      active: true,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    await writeDatabase(store);

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário (promover, desativar, etc)
export async function PUT(request: NextRequest) {
  try {
    const { userId, role, active } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const store = await readDatabase();
    const userIndex = store.users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (role) {
      const validRoles: UserRole[] = ["cliente", "empreendedor", "admin"];
      if (validRoles.includes(role)) {
        store.users[userIndex].role = role as UserRole;
      }
    }

    if (typeof active === "boolean") {
      store.users[userIndex].active = active;
    }

    await writeDatabase(store);

    return NextResponse.json({
      success: true,
      user: store.users[userIndex],
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const store = await readDatabase();
    store.users = store.users.filter((u) => u.id !== userId);
    await writeDatabase(store);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao deletar usuário" },
      { status: 500 }
    );
  }
}
