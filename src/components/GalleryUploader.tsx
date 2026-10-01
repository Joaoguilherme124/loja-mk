"use client";

import { useRef, useState } from "react";

type Props = {
  values: string[];
  onChange: (urls: string[]) => void;
};

export function GalleryUploader({ values, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setLoading(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const contentType = res.headers.get("content-type");
        const data = contentType?.includes("application/json")
          ? await res.json()
          : null;
        if (!res.ok) {
          throw new Error(data?.error || `Falha no upload (${res.status})`);
        }
        if (!data?.url) {
          throw new Error("O servidor não retornou a URL da imagem");
        }
        uploaded.push(String(data.url));
      }
      onChange([...values, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    if (values.includes(url)) {
      setError("Essa foto já foi adicionada");
      return;
    }
    onChange([...values, url]);
    setUrlDraft("");
    setError("");
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-2 text-sm font-medium text-espresso">
        Adicionar fotos
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="field"
          disabled={loading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[14rem] flex-1 space-y-2 text-sm font-medium text-espresso">
          Ou cole a URL da imagem
          <input
            className="field"
            value={urlDraft}
            placeholder="https://..."
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
        </label>
        <button
          type="button"
          className="btn-ghost !px-4 !py-2"
          onClick={addUrl}
          disabled={loading || !urlDraft.trim()}
        >
          Incluir URL
        </button>
      </div>
      {loading ? <p className="text-sm text-mocha">Enviando imagens...</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {values.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {values.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="space-y-2 rounded-xl border border-cappuccino/35 bg-foam/80 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="h-28 w-full rounded-lg object-cover"
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-espresso/60">
                  {index === 0 ? "Capa" : `Foto ${index + 1}`}
                </p>
                <button
                  type="button"
                  className="text-xs font-semibold text-red-800"
                  onClick={() => removeAt(index)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-espresso/60">Nenhuma foto ainda.</p>
      )}
    </div>
  );
}
