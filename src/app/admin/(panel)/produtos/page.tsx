"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import {
  flavorsFromVariants,
  isDocinhosProduct,
  parseProductKind,
  variantsFromFlavors,
} from "@/lib/product-kind";
import { formatRate, parseSoldBy } from "@/lib/sold-by";
import type { Product, ProductKind, ProductVariant, SoldBy } from "@/lib/types";
import { formatPrice } from "@/lib/whatsapp";

type VariantForm = {
  id: string;
  size: string;
  style: string;
  price: string;
  image: string;
};

type FlavorForm = {
  id: string;
  name: string;
  price: string;
  image: string;
};

const emptyVariant = (): VariantForm => ({
  id: `var_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
  size: "",
  style: "",
  price: "",
  image: "",
});

const emptyFlavor = (): FlavorForm => ({
  id: `flav_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
  name: "",
  price: "",
  image: "",
});

const emptyForm = {
  kind: "default" as ProductKind,
  name: "",
  description: "",
  price: "",
  image: "",
  category: "Geral",
  soldBy: "unit" as SoldBy,
  featured: false,
  active: true,
  variants: [] as VariantForm[],
  flavors: [] as FlavorForm[],
};

function toVariantForms(variants?: ProductVariant[]): VariantForm[] {
  if (!variants?.length) return [];
  return variants.map((variant) => ({
    id: variant.id,
    size: variant.size,
    style: variant.style,
    price: String(variant.price),
    image: variant.image,
  }));
}

function toFlavorForms(variants?: ProductVariant[]): FlavorForm[] {
  return flavorsFromVariants(variants).map((flavor) => ({
    id: flavor.id,
    name: flavor.name,
    price: String(flavor.price),
    image: flavor.image || "",
  }));
}

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
    const kind = isDocinhosProduct(product)
      ? "docinhos"
      : parseProductKind(product.kind);
    setEditingId(product.id);
    setForm({
      kind,
      name: product.name,
      description: product.description,
      price: String(product.price),
      image: product.image,
      category: product.category,
      soldBy: kind === "docinhos" ? "unit" : parseSoldBy(product.soldBy),
      featured: product.featured,
      active: product.active,
      variants: kind === "docinhos" ? [] : toVariantForms(product.variants),
      flavors:
        kind === "docinhos"
          ? toFlavorForms(product.variants).length > 0
            ? toFlavorForms(product.variants)
            : [emptyFlavor()]
          : [],
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function setKind(kind: ProductKind) {
    setForm((current) => ({
      ...current,
      kind,
      soldBy: kind === "docinhos" ? "unit" : current.soldBy,
      category:
        kind === "docinhos" && current.category === "Geral"
          ? "Docinhos"
          : current.category,
      variants: kind === "docinhos" ? [] : current.variants,
      flavors:
        kind === "docinhos"
          ? current.flavors.length > 0
            ? current.flavors
            : [emptyFlavor()]
          : [],
      price: kind === "docinhos" ? "" : current.price,
    }));
  }

  function updateVariant(id: string, patch: Partial<VariantForm>) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        variant.id === id ? { ...variant, ...patch } : variant
      ),
    }));
  }

  function removeVariant(id: string) {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((variant) => variant.id !== id),
    }));
  }

  function updateFlavor(id: string, patch: Partial<FlavorForm>) {
    setForm((current) => ({
      ...current,
      flavors: current.flavors.map((flavor) =>
        flavor.id === id ? { ...flavor, ...patch } : flavor
      ),
    }));
  }

  function removeFlavor(id: string) {
    setForm((current) => ({
      ...current,
      flavors: current.flavors.filter((flavor) => flavor.id !== id),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      let variants: ProductVariant[] = [];
      let image = form.image.trim();
      let price = Number(form.price) || 0;

      if (form.kind === "docinhos") {
        const cover = form.image.trim();
        const flavors = form.flavors.map((flavor) => ({
          id: flavor.id,
          name: flavor.name.trim(),
          price: Number(flavor.price) || 0,
          image: flavor.image.trim() || cover,
        }));

        const named = flavors.filter((flavor) => flavor.name);
        const valid = named.filter((flavor) => flavor.price > 0 && flavor.image);

        if (named.length === 0) {
          throw new Error("Adicione pelo menos um sabor");
        }
        if (valid.length !== named.length) {
          throw new Error(
            "Cada sabor precisa de preço e foto (ou uma foto de capa para todos)"
          );
        }

        variants = variantsFromFlavors(valid, cover);
        image = cover || variants[0]?.image || "";
        price = Math.min(...variants.map((variant) => variant.price));
      } else {
        variants = form.variants
          .map((variant) => ({
            id: variant.id,
            size: variant.size.trim(),
            style: variant.style.trim(),
            price: Number(variant.price) || 0,
            image: variant.image.trim(),
          }))
          .filter(
            (variant) =>
              variant.size && variant.style && variant.image && variant.price > 0
          );

        if (form.variants.length > 0 && variants.length !== form.variants.length) {
          throw new Error(
            "Preencha tamanho, estilo, preço e foto em todas as variações"
          );
        }
      }

      const payload = {
        name: form.name,
        description: form.description,
        price,
        soldBy: form.kind === "docinhos" ? "unit" : form.soldBy,
        kind: form.kind,
        image,
        category: form.category,
        featured: form.featured,
        active: form.active,
        variants,
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

  const isDocinhos = form.kind === "docinhos";
  const usingVariants = !isDocinhos && form.variants.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-espresso">Produtos</h1>
        <p className="mt-2 text-espresso/70">
          Cadastre bolos, tortas e docinhos. Para docinhos use o modo rápido.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-[1.4rem] border border-cappuccino/50 bg-foam/75 p-5 md:p-6"
      >
        <h2 className="font-display text-2xl text-espresso">
          {editingId ? "Editar produto" : "Novo produto"}
        </h2>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full border px-4 py-2 text-sm ${
              !isDocinhos
                ? "border-mocha bg-mocha text-foam"
                : "border-cappuccino bg-white/70 text-espresso"
            }`}
            onClick={() => setKind("default")}
          >
            Bolos/Tortas
          </button>
          <button
            type="button"
            className={`rounded-full border px-4 py-2 text-sm ${
              isDocinhos
                ? "border-mocha bg-mocha text-foam"
                : "border-cappuccino bg-white/70 text-espresso"
            }`}
            onClick={() => setKind("docinhos")}
          >
            Docinhos
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            {isDocinhos ? "Nome do grupo" : "Nome"}
            <input
              className="field"
              value={form.name}
              placeholder={isDocinhos ? "Ex.: Docinhos" : ""}
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

          {!isDocinhos ? (
            <>
              <label className="space-y-2 text-sm font-medium">
                Vendido por
                <select
                  className="field"
                  value={form.soldBy}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      soldBy: parseSoldBy(e.target.value),
                    })
                  }
                >
                  <option value="unit">Unidade</option>
                  <option value="kg">Quilo (kg)</option>
                </select>
              </label>
              {!usingVariants ? (
                <label className="space-y-2 text-sm font-medium">
                  {form.soldBy === "kg"
                    ? "Preço por kg (R$)"
                    : "Preço por unidade (R$)"}
                  <input
                    className="field"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    required={!usingVariants}
                  />
                </label>
              ) : (
                <p className="text-sm text-espresso/65 md:col-span-1">
                  Com variações, o preço do catálogo usa o menor valor
                  cadastrado
                  {form.soldBy === "kg" ? " (por kg)" : ""}.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-espresso/70 md:col-span-2">
              Cadastre os sabores abaixo. O cliente escolhe o sabor e a
              quantidade de unidades.
            </p>
          )}

          <div className="flex flex-wrap items-end gap-4 pb-2 text-sm md:col-span-2">
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

        {!usingVariants || isDocinhos ? (
          <div className="space-y-2">
            {isDocinhos ? (
              <p className="text-sm font-medium text-espresso">
                Foto de capa (opcional)
              </p>
            ) : null}
            <ImageUploader
              value={form.image}
              onChange={(image) => setForm({ ...form, image })}
            />
            {isDocinhos ? (
              <p className="text-xs text-espresso/60">
                Usada no catálogo. Se um sabor não tiver foto própria, usa esta.
              </p>
            ) : null}
          </div>
        ) : null}

        {isDocinhos ? (
          <div className="space-y-3 rounded-[1.1rem] border border-cappuccino/40 bg-white/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl text-espresso">Sabores</h3>
                <p className="text-sm text-espresso/65">
                  Nome, preço e foto de cada sabor.
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost !px-4 !py-2"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    flavors: [...current.flavors, emptyFlavor()],
                  }))
                }
              >
                Adicionar sabor
              </button>
            </div>

            <div className="space-y-4">
              {form.flavors.map((flavor, index) => (
                <div
                  key={flavor.id}
                  className="space-y-3 rounded-xl border border-cappuccino/35 bg-foam/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-espresso">
                      Sabor {index + 1}
                    </p>
                    <button
                      type="button"
                      className="btn-ghost !px-3 !py-1.5 !text-sm !text-red-800"
                      onClick={() => removeFlavor(flavor.id)}
                      disabled={form.flavors.length <= 1}
                    >
                      Remover
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1 text-sm font-medium">
                      Nome
                      <input
                        className="field"
                        placeholder="Brigadeiro"
                        value={flavor.name}
                        onChange={(e) =>
                          updateFlavor(flavor.id, { name: e.target.value })
                        }
                        required
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Preço (R$)
                      <input
                        className="field"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="2.50"
                        value={flavor.price}
                        onChange={(e) =>
                          updateFlavor(flavor.id, { price: e.target.value })
                        }
                        required
                      />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-espresso">
                      Foto do sabor
                    </p>
                    <ImageUploader
                      value={flavor.image}
                      onChange={(image) => updateFlavor(flavor.id, { image })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-[1.1rem] border border-cappuccino/40 bg-white/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl text-espresso">Variações</h3>
                <p className="text-sm text-espresso/65">
                  Ex.: tamanho (12 a 15 fatias) e estilo (Cobertura / Vulcão).
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost !px-4 !py-2"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    variants: [...current.variants, emptyVariant()],
                  }))
                }
              >
                Adicionar variação
              </button>
            </div>

            {form.variants.length === 0 ? (
              <p className="text-sm text-espresso/60">
                Sem variações: o produto usa uma foto e um preço únicos.
              </p>
            ) : (
              <div className="space-y-4">
                {form.variants.map((variant, index) => (
                  <div
                    key={variant.id}
                    className="space-y-3 rounded-xl border border-cappuccino/35 bg-foam/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-espresso">
                        Variação {index + 1}
                      </p>
                      <button
                        type="button"
                        className="btn-ghost !px-3 !py-1.5 !text-sm !text-red-800"
                        onClick={() => removeVariant(variant.id)}
                      >
                        Remover
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="space-y-2 text-sm font-medium">
                        Tamanho
                        <input
                          className="field"
                          placeholder="12 a 15 fatias"
                          value={variant.size}
                          onChange={(e) =>
                            updateVariant(variant.id, { size: e.target.value })
                          }
                          required
                        />
                      </label>
                      <label className="space-y-2 text-sm font-medium">
                        Estilo
                        <input
                          className="field"
                          placeholder="Cobertura ou Vulcão"
                          value={variant.style}
                          onChange={(e) =>
                            updateVariant(variant.id, { style: e.target.value })
                          }
                          required
                        />
                      </label>
                      <label className="space-y-2 text-sm font-medium">
                        {form.soldBy === "kg"
                          ? "Preço por kg (R$)"
                          : "Preço (R$)"}
                        <input
                          className="field"
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariant(variant.id, { price: e.target.value })
                          }
                          required
                        />
                      </label>
                    </div>
                    <ImageUploader
                      value={variant.image}
                      onChange={(image) => updateVariant(variant.id, { image })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                {product.category}
                {isDocinhosProduct(product) ? " · docinhos" : ""} ·{" "}
                {(product.variants || []).length > 0
                  ? `a partir de ${formatRate(product.price, product.soldBy, formatPrice)} · ${
                      product.variants?.length
                    } ${
                      isDocinhosProduct(product) ? "sabores" : "variações"
                    }`
                  : formatRate(product.price, product.soldBy, formatPrice)}
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
