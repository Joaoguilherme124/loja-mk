"use client";

import { useEffect, useState } from "react";
import {
  corteSizeId,
  normalizeTortaCorteSizes,
  tortaCorteSizeLabel,
} from "@/lib/product-kind";
import type { TortaCorteSizeOption } from "@/lib/types";

type Draft = {
  width: string;
  height: string;
  kg: string;
  fatias: string;
};

const emptyDraft = (): Draft => ({
  width: "",
  height: "",
  kg: "",
  fatias: "",
});

function draftFromOption(option: TortaCorteSizeOption): Draft {
  return {
    width: String(option.width),
    height: String(option.height),
    kg: String(option.kg).replace(".", ","),
    fatias: String(option.fatias),
  };
}

function parseDraft(draft: Draft): TortaCorteSizeOption | null {
  const width = Number(draft.width.trim().replace(",", "."));
  const height = Number(draft.height.trim().replace(",", "."));
  const kg = Number(draft.kg.trim().replace(",", "."));
  const fatias = Number(draft.fatias.trim().replace(",", "."));
  if (!Number.isFinite(width) || width <= 0) return null;
  if (!Number.isFinite(height) || height <= 0) return null;
  if (!Number.isFinite(kg) || kg <= 0) return null;
  if (!Number.isFinite(fatias) || fatias <= 0) return null;
  return {
    id: corteSizeId(width, height),
    width,
    height,
    kg,
    fatias: Math.round(fatias),
  };
}

type Props = {
  editable?: boolean;
};

export function TortaCorteSizesEditor({ editable = true }: Props) {
  const [sizes, setSizes] = useState<TortaCorteSizeOption[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch("/api/settings", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await res.json();
        if (controller.signal.aborted) return;
        setSizes(normalizeTortaCorteSizes(data.tortaCorteSizes));
        setReady(true);
      } catch {
        if (controller.signal.aborted) return;
        setError("Não foi possível carregar os tamanhos.");
        setReady(true);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  async function persist(next: TortaCorteSizeOption[]) {
    const normalized = normalizeTortaCorteSizes(next);
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ tortaCorteSizes: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      const saved = normalizeTortaCorteSizes(data.tortaCorteSizes);
      setSizes(saved);
      setMessage("Tamanhos salvos.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function startAdd() {
    setAdding(true);
    setEditingIndex(null);
    setDraft(emptyDraft);
    setMessage("");
    setError("");
  }

  function startEdit(index: number) {
    setAdding(false);
    setEditingIndex(index);
    setDraft(draftFromOption(sizes[index]));
    setMessage("");
    setError("");
  }

  function cancelForm() {
    setAdding(false);
    setEditingIndex(null);
    setDraft(emptyDraft);
  }

  async function saveDraft() {
    const parsed = parseDraft(draft);
    if (!parsed) {
      setError("Informe metragem, kg e fatias válidos.");
      return;
    }

    const duplicate = sizes.some(
      (option, index) =>
        option.id === parsed.id &&
        (adding || editingIndex === null || index !== editingIndex)
    );
    if (duplicate) {
      setError(`Já existe um tamanho ${parsed.width}x${parsed.height}.`);
      return;
    }

    let next: TortaCorteSizeOption[];
    if (adding) {
      next = [...sizes, parsed];
    } else if (editingIndex !== null) {
      next = sizes.map((option, index) =>
        index === editingIndex ? parsed : option
      );
    } else {
      return;
    }

    const ok = await persist(next);
    if (ok) cancelForm();
  }

  async function removeAt(index: number) {
    if (sizes.length <= 1) {
      setError("Mantenha pelo menos um tamanho.");
      return;
    }
    const option = sizes[index];
    if (!window.confirm(`Excluir o tamanho ${tortaCorteSizeLabel(option)}?`)) {
      return;
    }
    cancelForm();
    await persist(sizes.filter((_, i) => i !== index));
  }

  if (!ready) {
    return (
      <p className="text-sm text-espresso/60">Carregando tamanhos…</p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {sizes.map((option, index) => (
          <li
            key={option.id}
            className="rounded-xl border border-cappuccino/40 bg-white/50 px-3 py-2"
          >
            {editingIndex === index ? (
              <SizeDraftForm
                draft={draft}
                setDraft={setDraft}
                saving={saving}
                onSave={saveDraft}
                onCancel={cancelForm}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-espresso/85">
                  • {tortaCorteSizeLabel(option)}
                </span>
                {editable ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-ghost !px-3 !py-1.5 !text-xs"
                      onClick={() => startEdit(index)}
                      disabled={saving || adding}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-ghost !px-3 !py-1.5 !text-xs !text-red-800"
                      onClick={() => removeAt(index)}
                      disabled={saving || adding || sizes.length <= 1}
                    >
                      Excluir
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="rounded-xl border border-caramel/40 bg-caramel/10 px-3 py-3">
          <p className="mb-2 text-sm font-medium text-espresso">
            Novo tamanho
          </p>
          <SizeDraftForm
            draft={draft}
            setDraft={setDraft}
            saving={saving}
            onSave={saveDraft}
            onCancel={cancelForm}
          />
        </div>
      ) : editable ? (
        <button
          type="button"
          className="btn-ghost !px-4 !py-2 !text-sm"
          onClick={startAdd}
          disabled={saving || editingIndex !== null}
        >
          Adicionar tamanho
        </button>
      ) : null}

      {message ? (
        <p className="text-sm text-green-800">{message}</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

function SizeDraftForm({
  draft,
  setDraft,
  saving,
  onSave,
  onCancel,
}: {
  draft: Draft;
  setDraft: (draft: Draft) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <label className="space-y-1 text-xs font-medium text-espresso">
          Largura
          <input
            className="field !py-2 !text-sm"
            type="number"
            min="1"
            step="1"
            placeholder="21"
            value={draft.width}
            onChange={(e) => setDraft({ ...draft, width: e.target.value })}
            disabled={saving}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-espresso">
          Altura
          <input
            className="field !py-2 !text-sm"
            type="number"
            min="1"
            step="1"
            placeholder="16"
            value={draft.height}
            onChange={(e) => setDraft({ ...draft, height: e.target.value })}
            disabled={saving}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-espresso">
          kg
          <input
            className="field !py-2 !text-sm"
            type="text"
            inputMode="decimal"
            placeholder="2"
            value={draft.kg}
            onChange={(e) => setDraft({ ...draft, kg: e.target.value })}
            disabled={saving}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-espresso">
          Fatias
          <input
            className="field !py-2 !text-sm"
            type="number"
            min="1"
            step="1"
            placeholder="20"
            value={draft.fatias}
            onChange={(e) => setDraft({ ...draft, fatias: e.target.value })}
            disabled={saving}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary !px-4 !py-2 !text-sm"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          className="btn-ghost !px-4 !py-2 !text-sm"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
