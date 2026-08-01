import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStaffToken, STAFF_COOKIE, type StaffRole } from "@/lib/staff-auth";

function accessFromRole(role:string):{role:StaffRole;specialty:string}{
  const value=role.toLowerCase();
  if(value.includes("project manager")||value.includes("account manager")||value.includes("production manager"))return{role:"manager",specialty:"Project Manager"};
  if(value.includes("photo"))return{role:"contributor",specialty:"Photography"};
  if(value.includes("install")||value.includes("sign"))return{role:"contributor",specialty:"Sign Installation"};
  return{role:"contributor",specialty:role||"Production"};
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    const adminEmail = String(process.env.ADMIN_EMAIL || "admin@upzdesign.com").trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || "");
    let session: { role: StaffRole; name: string; email?: string; specialty?: string } | null = null;

    if (email === adminEmail && adminPassword && password === adminPassword) {
      session = { role: "admin", name: "UPZ Admin", email, specialty:"Administrator" };
    } else {
      const staffPassword = String(process.env.STAFF_PASSWORD || "");
      const member = await prisma.teamMember.findFirst({ where: { email, active: true } });
      if (member && staffPassword && password === staffPassword) {
        const access=accessFromRole(member.role);
        session = { role:access.role, specialty:access.specialty, name: member.name, email: member.email || email };
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
