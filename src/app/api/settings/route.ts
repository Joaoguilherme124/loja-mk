import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  normalizeTortaCorteSizes,
  normalizeTortaSizes,
  resolveTortaCorteSizes,
  resolveTortaSizes,
} from "@/lib/product-kind";
import { getSettings, updateSettingsRecord } from "@/lib/database";
import { revalidateStorefront } from "@/lib/revalidate-storefront";

export const dynamic = "force-dynamic";

function onlyDigits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(
    {
      ...settings,
      tortaSizes: resolveTortaSizes(settings),
      tortaCorteSizes: resolveTortaCorteSizes(settings),
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const current = await getSettings();

  const storeName = String(
    body.storeName !== undefined ? body.storeName : current.storeName
  ).trim();
  const tagline = String(
    body.tagline !== undefined ? body.tagline : current.tagline
  ).trim();
  const about = String(
    body.about !== undefined ? body.about : current.about
  ).trim();
  const whatsapp = onlyDigits(
    body.whatsapp !== undefined ? body.whatsapp : current.whatsapp
  );
  const tortaSizes =
    body.tortaSizes !== undefined
      ? normalizeTortaSizes(body.tortaSizes)
      : resolveTortaSizes(current);
  const tortaCorteSizes =
    body.tortaCorteSizes !== undefined
      ? normalizeTortaCorteSizes(body.tortaCorteSizes)
      : resolveTortaCorteSizes(current);

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

  if (!tortaSizes.length) {
    return NextResponse.json(
      { error: "Informe pelo menos um tamanho de torta." },
      { status: 400 }
    );
  }

  if (!tortaCorteSizes.length) {
    return NextResponse.json(
      { error: "Informe pelo menos um tamanho de torta de corte." },
      { status: 400 }
    );
  }

  const settings = await updateSettingsRecord({
    ...current,
    storeName,
    tagline,
    whatsapp,
    about,
    tortaSizes,
    tortaCorteSizes,
  });
  revalidateStorefront();

  return NextResponse.json(
    {
      ...settings,
      tortaSizes: resolveTortaSizes(settings),
      tortaCorteSizes: resolveTortaCorteSizes(settings),
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
