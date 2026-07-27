import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeProjectUpdate, type ProjectUpdateKind } from "@/lib/project-messages";

const CLIENT_KINDS = new Set<ProjectUpdateKind>(["client_update", "feedback_request", "approval_request"]);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const projectId = Number(id);
    const body = await request.json();
    const text = String(body?.body || "").trim();
    if (!projectId || !text) return NextResponse.json({ error: "Note is required" }, { status: 400 });

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const requestedKind = String(body?.kind || "internal");
    const isClientUpdate = CLIENT_KINDS.has(requestedKind as ProjectUpdateKind);
    const kind = isClientUpdate ? requestedKind as ProjectUpdateKind : null;
    const visibility = isClientUpdate ? "client" : "internal";
    const storedBody = kind ? encodeProjectUpdate(text, kind) : text;
    const author = body?.author || "UPZ Admin";

    const [note] = await prisma.$transaction([
      prisma.projectNote.create({
        data: { projectId, body: storedBody, visibility, author },
      }),
      prisma.projectActivity.create({
        data: {
          projectId,
          type: isClientUpdate ? requestedKind : "note_added",
          message: isClientUpdate ? "Client-visible project update posted" : "Internal note added",
          actor: author,
        },
      }),
      prisma.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } }),
    ]);

    return NextResponse.json(note, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Project note error:", error);
    return NextResponse.json({ error: "Unable to add note" }, { status: 500 });
  }
}
