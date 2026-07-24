import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const members = await prisma.teamMember.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = String(body?.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const member = await prisma.teamMember.create({
    data: {
      name,
      email: body?.email ? String(body.email).trim() : null,
      role: String(body?.role || "Creative Operations").trim(),
      capacity: Math.max(1, Number(body?.capacity || 5)),
      active: body?.active !== false,
    },
  });
  return NextResponse.json(member, { status: 201 });
}
