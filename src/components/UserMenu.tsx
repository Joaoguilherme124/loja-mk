"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserSession = {
  id: string;
  email: string;
  role: string;
};

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setUser(data.session);
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex gap-2">
        <Link
          href="/login"
          className="rounded-full px-3 py-2 text-foam/90 transition hover:bg-white/10 hover:text-foam"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-foam/95 px-4 py-2 font-semibold text-espresso shadow-sm transition hover:bg-white"
        >
          Cadastro
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {user.role === "cliente" && (
        <Link
          href="/fazer-pedido"
          className="rounded-full bg-caramel/90 px-3 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-caramel"
        >
          Fazer Pedido
        </Link>
      )}
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="rounded-full bg-caramel/90 px-3 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-caramel"
        >
          Painel
        </Link>
      )}
      <button
        onClick={handleLogout}
        className="rounded-full bg-red-500/80 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-red-600"
      >
        Sair
      </button>
    </div>
  );
}
