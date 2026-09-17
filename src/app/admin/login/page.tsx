"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha no login");
      }
      router.push("/admin");
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
        <h1 className="mt-6 font-display text-4xl text-espresso">Painel MK</h1>
        <p className="mt-2 text-sm text-espresso/70">
          Entre para gerenciar produtos, fotos, promoções e novidades.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block space-y-2 text-sm font-medium text-espresso">
            Senha
            <input
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-xs text-espresso/55">
          Senha padrão de desenvolvimento: <strong>mk1234</strong>
        </p>
      </div>
    </div>
  );
}
