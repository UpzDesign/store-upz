import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

export async function GET() {
  const session = await requireStaffSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const members = await prisma.teamMember.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  return NextResponse.json(members, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await requireStaffSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = body?.email ? String(body.email).trim().toLowerCase() : null;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const member = await prisma.teamMember.create({
      data: {
        name,
        email,
        role: String(body?.role || "Creative Operations").trim(),
        capacity: Math.max(1, Number(body?.capacity || 5)),
        active: body?.active !== false,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "That name or email is already in use" }, { status: 409 });
    console.error(error);
    return NextResponse.json({ error: "Unable to add team member" }, { status: 500 });
  }
}
