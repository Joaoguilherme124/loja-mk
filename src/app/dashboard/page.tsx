"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserSession = {
  id: string;
  email: string;
  role: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();

        if (!data.session) {
          router.push("/login");
          return;
        }

        setUser(data.session);
      } catch (error) {
        console.error("Error checking session:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-espresso">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-foam/30 to-cappuccino/20 pt-32">
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <Link href="/" className="text-sm text-mocha hover:underline">
          ← Voltar à loja
        </Link>

        <div className="mt-8 space-y-8">
          <div>
            <h1 className="font-display text-4xl text-espresso">
              Bem-vindo, {user.email}!
            </h1>
            <p className="mt-2 text-espresso/70">
              Tipo de conta: <span className="font-semibold capitalize">{user.role}</span>
            </p>
          </div>

          {user.role === "admin" && (
            <div className="rounded-2xl border border-cappuccino/40 bg-white/60 p-8 backdrop-blur">
              <h2 className="font-display text-2xl text-espresso">Painel Administrativo</h2>
              <p className="mt-2 text-espresso/70">
                Gerencie produtos, promoções, notícias e configurações da loja.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/admin"
                  className="rounded-lg bg-espresso px-6 py-3 font-semibold text-white transition hover:bg-espresso/90"
                >
                  Ir para o Painel Admin
                </Link>
              </div>
            </div>
          )}

          {user.role === "empreendedor" && (
            <div className="rounded-2xl border border-cappuccino/40 bg-white/60 p-8 backdrop-blur">
              <h2 className="font-display text-2xl text-espresso">Minha Loja</h2>
              <p className="mt-2 text-espresso/70">
                Gerencie seus produtos e vendas.
              </p>
              <div className="mt-6 space-y-3">
                <p className="text-sm text-espresso/70">
                  Funcionalidade em desenvolvimento...
                </p>
              </div>
            </div>
          )}

          {user.role === "cliente" && (
            <div className="rounded-2xl border border-cappuccino/40 bg-white/60 p-8 backdrop-blur">
              <h2 className="font-display text-2xl text-espresso">Minha Conta</h2>
              <p className="mt-2 text-espresso/70">
                Visualize seus pedidos e informações de perfil.
              </p>
              <div className="mt-6 space-y-3">
                <p className="text-sm text-espresso/70">
                  Funcionalidade em desenvolvimento...
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-cappuccino/40 bg-white/60 p-8 backdrop-blur">
            <h2 className="font-display text-2xl text-espresso">Explorar</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link
                href="/catalogo"
                className="rounded-lg border border-espresso px-6 py-3 text-center font-semibold text-espresso transition hover:bg-espresso/10"
              >
                Ver Catálogo
              </Link>
              <Link
                href="/"
                className="rounded-lg bg-foam px-6 py-3 text-center font-semibold text-espresso transition hover:bg-foam/90"
              >
                Voltar à Página Inicial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
