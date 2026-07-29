import { NextRequest, NextResponse } from "next/server";

const COOKIE = "upz_staff_session";
const decode = (value: string) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0))));
const bytesToBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

async function session(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied) return null;
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "upz-local-development-secret-change-me";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  if (bytesToBase64Url(signed) !== supplied) return null;
  try {
    const value = decode(payload);
    return value.exp > Math.floor(Date.now() / 1000) ? value : null;
  } catch { return null; }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login" || path.startsWith("/api/staff/")) return NextResponse.next();
  const user = await session(request);
  const isAdminPage = path.startsWith("/admin");
  const isAdminApi = path.startsWith("/api/admin");
  if (!isAdminPage && !isAdminApi) return NextResponse.next();
  if (!user) {
    if (isAdminApi) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const url = new URL("/admin/login", request.url); url.searchParams.set("next", path); return NextResponse.redirect(url);
  }
  if (user.role === "contributor") {
    const allowedPage = path === "/admin/my-tasks";
    const allowedApi = path.startsWith("/api/admin/my-tasks") || path.startsWith("/api/admin/tasks/");
    if (!allowedPage && !allowedApi) {
      if (isAdminApi) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      return NextResponse.redirect(new URL("/admin/my-tasks", request.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*", "/api/staff/:path*"] };
