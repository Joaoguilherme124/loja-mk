import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { readStore, writeStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function onlyDigits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store.settings, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const store = await readStore();

  const storeName = String(
    body.storeName !== undefined ? body.storeName : store.settings.storeName
  ).trim();
  const tagline = String(
    body.tagline !== undefined ? body.tagline : store.settings.tagline
  ).trim();
  const about = String(
    body.about !== undefined ? body.about : store.settings.about
  ).trim();
  const whatsapp = onlyDigits(
    body.whatsapp !== undefined ? body.whatsapp : store.settings.whatsapp
  );

  if (!storeName) {
    return NextResponse.json(
      { error: "Nome da loja é obrigatório" },
      { status: 400 }
    );
  }

  if (whatsapp.length < 10) {
    return NextResponse.json(
      {
        error:
          "WhatsApp inválido. Use DDI + DDD + número, só dígitos. Ex.: 5548999999999",
      },
      { status: 400 }
    );
  }

  store.settings = {
    storeName,
    tagline,
    whatsapp,
    about,
  };

  await writeStore(store);

  return NextResponse.json(store.settings, {
    headers: { "Cache-Control": "no-store" },
  });
}
