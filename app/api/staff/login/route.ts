import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStaffToken, STAFF_COOKIE } from "@/lib/staff-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    const adminEmail = String(process.env.ADMIN_EMAIL || "admin@upzdesign.com").trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || "");
    let session: { role: "admin" | "contributor"; name: string; email?: string } | null = null;

    if (email === adminEmail && adminPassword && password === adminPassword) {
      session = { role: "admin", name: "UPZ Admin", email };
    } else {
      const staffPassword = String(process.env.STAFF_PASSWORD || "");
      const member = await prisma.teamMember.findFirst({ where: { email, active: true } });
      if (member && staffPassword && password === staffPassword) {
        session = { role: "contributor", name: member.name, email: member.email || email };
      }
    }

    if (!session) return NextResponse.json({ error: "Invalid staff credentials" }, { status: 401 });
    const response = NextResponse.json({ session });
    response.cookies.set(STAFF_COOKIE, createStaffToken(session), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to sign in" }, { status: 500 });
  }
}
