import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const member = await prisma.teamMember.update({
    where: { id: Number(id) },
    data: {
      name: body.name === undefined ? undefined : String(body.name).trim(),
      email: body.email === undefined ? undefined : body.email ? String(body.email).trim() : null,
      role: body.role === undefined ? undefined : String(body.role).trim(),
      capacity: body.capacity === undefined ? undefined : Math.max(1, Number(body.capacity)),
      active: body.active === undefined ? undefined : Boolean(body.active),
    },
  });
  return NextResponse.json(member);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.teamMember.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
}
