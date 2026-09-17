"use client";

import { useState } from "react";

type Props = {
  value?: string;
  onChange: (url: string) => void;
};

export function ImageUploader({ value, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-2 text-sm font-medium text-espresso">
        Foto
        <input
          type="file"
          accept="image/*"
          className="field"
          disabled={loading}
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
      </label>
      <label className="block space-y-2 text-sm font-medium text-espresso">
        Ou cole a URL da imagem
        <input
          className="field"
          value={value || ""}
          placeholder="https://..."
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {loading && <p className="text-sm text-mocha">Enviando imagem...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Pré-visualização"
          className="h-36 w-full rounded-xl object-cover"
        />
      ) : null}
    </div>
  );
}
