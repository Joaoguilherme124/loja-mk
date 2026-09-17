import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import { isAdminAuthenticated } from "@/lib/auth";
import { createId } from "@/lib/store";

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Armazenamento de imagens não configurado" },
        { status: 503 }
      );
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Envie apenas imagens" },
        { status: 400 }
      );
    }

    // Uploads enviados por uma Vercel Function têm limite total de 4,5 MB.
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Imagem deve ter no máximo 4MB" },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || ".jpg";
    const filename = `products/${createId("img")}${ext.toLowerCase()}`;
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Falha ao enviar imagem para o Vercel Blob:", error);
    return NextResponse.json(
      { error: "Não foi possível enviar a imagem. Tente novamente." },
      { status: 500 }
    );
  }
}
