"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  image: "",
  category: "Geral",
  featured: false,
  active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      image: product.image,
      category: product.category,
      featured: product.featured,
      active: product.active,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        image: form.image,
        category: form.category,
        featured: form.featured,
        active: form.active,
      };

      const res = await fetch(
        editingId ? `/api/products/${editingId}` : "/api/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setMessage(editingId ? "Produto atualizado." : "Produto criado.");
      resetForm();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remover este produto?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-espresso">Produtos</h1>
        <p className="mt-2 text-espresso/70">
          Cadastre fotos, preços e descrições do catálogo.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-[1.4rem] border border-cappuccino/50 bg-foam/75 p-5 md:p-6"
      >
        <h2 className="font-display text-2xl text-espresso">
          {editingId ? "Editar produto" : "Novo produto"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Nome
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Categoria
            <input
              className="field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </label>
          <label className="space-y-2 text-sm font-medium md:col-span-2">
            Descrição
            <textarea
              className="field min-h-24"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Preço (R$)
            <input
              className="field"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </label>
          <div className="flex flex-wrap items-end gap-4 pb-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
              />
              Destaque na home
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Ativo no catálogo
            </label>
          </div>
        </div>
        <ImageUploader
          value={form.image}
          onChange={(image) => setForm({ ...form, image })}
        />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Salvando..." : editingId ? "Atualizar" : "Publicar"}
          </button>
          {editingId ? (
            <button type="button" className="btn-ghost" onClick={resetForm}>
              Cancelar
            </button>
          ) : null}
        </div>
        {message ? <p className="text-sm text-mocha">{message}</p> : null}
      </form>

      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-col gap-4 rounded-[1.2rem] border border-cappuccino/50 bg-foam/70 p-4 sm:flex-row sm:items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="h-24 w-full rounded-xl object-cover sm:h-20 sm:w-20"
            />
            <div className="flex-1">
              <p className="font-semibold text-espresso">{product.name}</p>
              <p className="text-sm text-espresso/65">
                {product.category} · {formatPrice(product.price)}
                {!product.active ? " · oculto" : ""}
                {product.featured ? " · destaque" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost !px-4 !py-2"
                onClick={() => startEdit(product)}
              >
                Editar
              </button>
              <button
                type="button"
                className="btn-ghost !px-4 !py-2 !text-red-800"
                onClick={() => remove(product.id)}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
