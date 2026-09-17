import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isAdminAuthenticated } from "@/lib/auth";
import { createId } from "@/lib/store";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Imagem deve ter no máximo 5MB" },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${createId("img")}${ext.toLowerCase()}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), bytes);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
