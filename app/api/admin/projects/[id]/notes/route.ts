import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeProjectUpdate, type ProjectUpdateKind } from "@/lib/project-messages";

const CLIENT_KINDS = new Set<ProjectUpdateKind>(["client_update", "feedback_request", "approval_request"]);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const text = String(body?.body || "").trim();
    if (!text) return NextResponse.json({ error: "Note is required" }, { status: 400 });

    const requestedKind = String(body?.kind || "internal");
    const isClientUpdate = CLIENT_KINDS.has(requestedKind as ProjectUpdateKind);
    const kind = isClientUpdate ? requestedKind as ProjectUpdateKind : null;
    const visibility = isClientUpdate ? "client" : "internal";
    const storedBody = kind ? encodeProjectUpdate(text, kind) : text;

    const note = await prisma.projectNote.create({
      data: {
        projectId: Number(id),
        body: storedBody,
        visibility,
        author: body?.author || "UPZ Admin",
      },
    });

    await prisma.projectActivity.create({
      data: {
        projectId: Number(id),
        type: isClientUpdate ? requestedKind : "note_added",
        message: isClientUpdate ? "Client-visible project update posted" : "Internal note added",
        actor: note.author,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to add note" }, { status: 500 });
  }
}
