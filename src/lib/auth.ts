import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "ordernama_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export type AuthSession = {
  userId: string;
  sellerId: string;
  name: string;
  email: string;
  role: string;
  expiresAt: number;
};

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be configured in production");
  return "ordernama-local-development-session-secret-change-before-deploy";
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [saltHex, keyHex] = storedHash.split(":");
  if (!saltHex || !keyHex || !/^[a-f0-9]+$/i.test(saltHex) || !/^[a-f0-9]+$/i.test(keyHex)) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function encodeSession(session: AuthSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function decodeSession(token?: string): AuthSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthSession;
    if (!session.userId || !session.sellerId || !session.expiresAt || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function attachSessionCookie(response: NextResponse, account: { id: string; sellerId: string; name: string; email: string; role: string }, remember = true) {
  const session: AuthSession = {
    userId: account.id,
    sellerId: account.sellerId,
    name: account.name,
    email: account.email,
    role: account.role,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  response.cookies.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: SESSION_TTL_SECONDS } : {}),
  });
  return response;
}

export async function getAuthSession() {
  const cookieJar = await cookies();
  return decodeSession(cookieJar.get(SESSION_COOKIE)?.value);
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
