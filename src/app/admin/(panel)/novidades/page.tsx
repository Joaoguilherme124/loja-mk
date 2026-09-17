"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import type { NewsItem } from "@/lib/types";

const emptyForm = {
  title: "",
  content: "",
  image: "",
  active: true,
};

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/news");
    setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item: NewsItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      image: item.image,
      active: item.active,
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
      const res = await fetch(
        editingId ? `/api/news/${editingId}` : "/api/news",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setMessage(editingId ? "Novidade atualizada." : "Novidade publicada.");
      resetForm();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remover esta novidade?")) return;
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-espresso">Novidades</h1>
        <p className="mt-2 text-espresso/70">
          Compartilhe lançamentos e avisos com as clientes.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-[1.4rem] border border-cappuccino/50 bg-foam/75 p-5 md:p-6"
      >
        <h2 className="font-display text-2xl text-espresso">
          {editingId ? "Editar novidade" : "Nova novidade"}
        </h2>
        <label className="block space-y-2 text-sm font-medium">
          Título
          <input
            className="field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Conteúdo
          <textarea
            className="field min-h-28"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Ativa
        </label>
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
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-[1.2rem] border border-cappuccino/50 bg-foam/70 p-4 sm:flex-row sm:items-center"
          >
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.title}
                className="h-24 w-full rounded-xl object-cover sm:h-20 sm:w-28"
              />
            ) : null}
            <div className="flex-1">
              <p className="font-semibold text-espresso">{item.title}</p>
              <p className="line-clamp-2 text-sm text-espresso/65">
                {item.content}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost !px-4 !py-2"
                onClick={() => startEdit(item)}
              >
                Editar
              </button>
              <button
                type="button"
                className="btn-ghost !px-4 !py-2 !text-red-800"
                onClick={() => remove(item.id)}
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
