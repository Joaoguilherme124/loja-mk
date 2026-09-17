"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Validações
    if (!formData.name || !formData.email || !formData.password) {
      setError("Todos os campos são obrigatórios");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "cliente",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao cadastrar");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
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
        <h1 className="mt-6 font-display text-4xl text-espresso">Cadastro</h1>
        <p className="mt-2 text-sm text-espresso/70">
          Crie sua conta para começar a aproveitar nossas ofertas.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block space-y-2 text-sm font-medium text-espresso">
            Nome completo
            <input
              type="text"
              className="field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Seu nome"
              required
            />
          </label>

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

          <label className="block space-y-2 text-sm font-medium text-espresso">
            Confirmar senha
            <input
              type="password"
              className="field"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••"
              required
            />
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-espresso/70">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-espresso hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
