import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const text = String(body?.body || "").trim();
    if (!text) return NextResponse.json({ error: "Note is required" }, { status: 400 });
    const note = await prisma.projectNote.create({ data: { projectId: Number(id), body: text, visibility: body?.visibility === "client" ? "client" : "internal", author: body?.author || "UPZ Admin" } });
    await prisma.projectActivity.create({ data: { projectId: Number(id), type: "note_added", message: `${note.visibility === "client" ? "Client" : "Internal"} note added`, actor: note.author } });
    return NextResponse.json(note, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to add note" }, { status: 500 }); }
}