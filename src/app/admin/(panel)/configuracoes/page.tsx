"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { StoreSettings } from "@/lib/types";

const emptySettings: StoreSettings = {
  storeName: "",
  tagline: "",
  whatsapp: "",
  about: "",
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<StoreSettings>(emptySettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      try {
        const res = await fetch("/api/settings", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await res.json();
        if (controller.signal.aborted) return;
        // Não sobrescreve se a pessoa já começou a editar.
        if (!dirtyRef.current) {
          setForm({
            storeName: String(data.storeName || ""),
            tagline: String(data.tagline || ""),
            whatsapp: onlyDigits(String(data.whatsapp || "")),
            about: String(data.about || ""),
          });
        }
        setReady(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError("Não foi possível carregar as configurações.");
        setReady(true);
      }
    }

    loadSettings();
    return () => controller.abort();
  }, []);

  function updateField<K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K]
  ) {
    dirtyRef.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const payload: StoreSettings = {
      storeName: form.storeName.trim(),
      tagline: form.tagline.trim(),
      whatsapp: onlyDigits(form.whatsapp),
      about: form.about.trim(),
    };

    if (!payload.storeName) {
      setError("Informe o nome da loja.");
      setLoading(false);
      return;
    }

    if (payload.whatsapp.length < 10) {
      setError(
        "Informe um WhatsApp válido com DDI e DDD, só números. Ex.: 5548999999999"
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      dirtyRef.current = false;
      setForm({
        storeName: String(data.storeName || ""),
        tagline: String(data.tagline || ""),
        whatsapp: onlyDigits(String(data.whatsapp || "")),
        about: String(data.about || ""),
      });
      setMessage(
        `Configurações salvas. WhatsApp ativo: ${onlyDigits(String(data.whatsapp || ""))}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-espresso">Configurações</h1>
        <p className="mt-2 text-espresso/70">
          Nome da loja, texto de apresentação e número do WhatsApp.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-[1.4rem] border border-cappuccino/50 bg-foam/75 p-5 md:p-6"
      >
        <label className="block space-y-2 text-sm font-medium">
          Nome da loja
          <input
            className="field"
            value={form.storeName}
            onChange={(e) => updateField("storeName", e.target.value)}
            required
            disabled={!ready || loading}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Frase de destaque
          <input
            className="field"
            value={form.tagline}
            onChange={(e) => updateField("tagline", e.target.value)}
            disabled={!ready || loading}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          WhatsApp (com DDI e DDD)
          <input
            className="field"
            type="tel"
            inputMode="numeric"
            value={form.whatsapp}
            placeholder="5548999999999"
            onChange={(e) => updateField("whatsapp", onlyDigits(e.target.value))}
            required
            disabled={!ready || loading}
          />
          <span className="text-xs font-normal text-espresso/55">
            Digite só números, com DDI e DDD. Exemplo: 5548998269160
          </span>
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Sobre a loja
          <textarea
            className="field min-h-28"
            value={form.about}
            onChange={(e) => updateField("about", e.target.value)}
            disabled={!ready || loading}
          />
        </label>
        <button
          type="submit"
          className="btn-primary"
          disabled={!ready || loading}
        >
          {loading ? "Salvando..." : "Salvar configurações"}
        </button>
        {message ? (
          <p className="text-sm text-green-800">{message}</p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </div>
  );
}
