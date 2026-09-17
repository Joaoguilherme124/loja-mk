import { cookies } from "next/headers";

const COOKIE_NAME = "mk_admin_session";
const SECRET = process.env.AUTH_SECRET || "atelier-mk-dev-secret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mk1234";

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

export function verifyPassword(password: string) {
  return password === ADMIN_PASSWORD;
}

export async function setAdminSession() {
  const issuedAt = Date.now().toString();
  const token = `${issuedAt}.${await sign(issuedAt)}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
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
