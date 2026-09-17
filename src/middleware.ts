import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "mk_admin_session";
const SECRET = process.env.AUTH_SECRET || "atelier-mk-dev-secret";

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isValidToken(token: string | undefined) {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  const expected = await sign(issuedAt);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rotas do admin (antigo sistema baseado em senha)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!(await isValidToken(token))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/admin/login") {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (await isValidToken(token)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // Proteger rota do dashboard (novo sistema de usuários)
  if (pathname === "/dashboard") {
    const userSession = request.cookies.get("mk_user_session")?.value;
    if (!userSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard"],
};
