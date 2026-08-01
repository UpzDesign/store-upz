import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const STAFF_COOKIE = "upz_staff_session";
export type StaffRole = "admin" | "manager" | "contributor";
export type StaffSession = { role: StaffRole; name: string; email?: string; specialty?: string; exp: number };

const secret = () => process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "upz-local-development-secret-change-me";
const encode = (value: string) => Buffer.from(value).toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");
const signature = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function createStaffToken(session: Omit<StaffSession, "exp">, maxAge = 60 * 60 * 12) {
  const payload = encode(JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + maxAge }));
  return `${payload}.${signature(payload)}`;
}

export function verifyStaffToken(token?: string | null): StaffSession | null {
  if (!token) return null;
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) return null;
  const expected = signature(payload);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const value = JSON.parse(decode(payload)) as StaffSession;
    if (!value?.role || !value?.name || value.exp <= Math.floor(Date.now() / 1000)) return null;
    return value;
  } catch {
    return null;
  }
}

export async function getStaffSession() {
  const store = await cookies();
  return verifyStaffToken(store.get(STAFF_COOKIE)?.value);
}

export async function requireStaffSession(roles: StaffSession["role"][] = ["admin", "manager", "contributor"]) {
  const session = await getStaffSession();
  if (!session || !roles.includes(session.role)) return null;
  return session;
}
