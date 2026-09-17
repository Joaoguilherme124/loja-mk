import { cookies } from "next/headers";
import { User, UserRole } from "./types";
import { readDatabase, writeDatabase } from "./database";

const COOKIE_NAME = "mk_user_session";
const SECRET = process.env.AUTH_SECRET || "atelier-mk-dev-secret";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SECRET);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

async function sign(value: string): Promise<string> {
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

async function isValidToken(token: string | undefined): Promise<boolean> {
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

export async function registerUser(
  email: string,
  name: string,
  password: string,
  role: UserRole = "cliente"
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const store = await readDatabase();

    if (store.users.some((u) => u.email === email)) {
      return { success: false, error: "Email já cadastrado" };
    }

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      passwordHash,
      role,
      active: true,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    await writeDatabase(store);

    return { success: true, user: newUser };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return { success: false, error: "Erro ao cadastrar usuário" };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const store = await readDatabase();
    const user = store.users.find((u) => u.email === email && u.active);

    if (!user) {
      return { success: false, error: "Email ou senha inválidos" };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Email ou senha inválidos" };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return { success: false, error: "Erro ao fazer login" };
  }
}

export async function setUserSession(user: User): Promise<void> {
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

  jar.set(
    "mk_user_data",
    JSON.stringify({ id: user.id, email: user.email, role: user.role }),
    {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }
  );
}

export async function clearUserSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  jar.delete("mk_user_data");
}

export async function isUserAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return await isValidToken(token);
}

export async function getUserSession(): Promise<{
  id: string;
  email: string;
  role: UserRole;
} | null> {
  const jar = await cookies();
  const isValid = await isValidToken(jar.get(COOKIE_NAME)?.value);

  if (!isValid) return null;

  const userData = jar.get("mk_user_data")?.value;
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const store = await readDatabase();
    return store.users.find((u) => u.id === userId) || null;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
}
