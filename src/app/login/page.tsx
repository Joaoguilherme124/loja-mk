"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email e senha são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha no login");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-[1.8rem] border border-cappuccino/60 bg-foam/80 p-8 shadow-[0_24px_60px_rgba(59,42,34,0.12)] backdrop-blur">
        <Link href="/" className="text-sm text-mocha hover:underline">
          ← Voltar à loja
        </Link>
        <h1 className="mt-6 font-display text-4xl text-espresso">Entrar</h1>
        <p className="mt-2 text-sm text-espresso/70">
          Acesse sua conta para gerenciar pedidos e préferências.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block space-y-2 text-sm font-medium text-espresso">
            Email
            <input
              type="email"
              className="field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu@email.com"
              required
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-espresso">
            Senha
            <input
              type="password"
              className="field"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••"
              required
            />
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-espresso/70">
          Não tem conta?{" "}
          <Link href="/register" className="font-semibold text-espresso hover:underline">
            Cadastre-se aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
