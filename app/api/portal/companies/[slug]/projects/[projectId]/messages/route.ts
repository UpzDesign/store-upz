import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  encodeClientResponse,
  parseProjectMessage,
  type ClientResponseAction,
} from "@/lib/project-messages";

const ACTIONS = new Set<ClientResponseAction>([
  "reply",
  "approved",
  "revision_requested",
]);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; projectId: string }> }
) {
  try {
    const { slug, projectId } = await context.params;
    const body = await request.json().catch(() => null);
    const updateId = Number(body?.updateId || 0);
    const action = String(body?.action || "reply") as ClientResponseAction;
    const message = String(body?.message || "").trim();

    if (!updateId || !ACTIONS.has(action)) {
      return NextResponse.json(
        { error: "A valid project update is required" },
        { status: 400 }
      );
    }

    if (["reply", "revision_requested"].includes(action) && !message) {
      return NextResponse.json(
        {
          error:
            action === "revision_requested"
              ? "Please describe what should be revised"
              : "Reply is required",
        },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Reply must be 2,000 characters or fewer" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { slug, portalEnabled: true },
      select: { id: true, shortName: true, name: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: Number(projectId),
        companyId: company.id,
        clientVisible: true,
        status: { notIn: ["cancelled"] },
      },
      select: { id: true, title: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const update = await prisma.projectNote.findFirst({
      where: { id: updateId, projectId: project.id, visibility: "client" },
      select: { id: true, body: true, author: true },
    });

    if (!update) {
      return NextResponse.json(
        { error: "Project update not found" },
        { status: 404 }
      );
    }

    const parsedUpdate = parseProjectMessage(update.body);

    if (
      parsedUpdate.kind === "client_response" ||
      / Client$/.test(update.author || "")
    ) {
      return NextResponse.json(
        { error: "Clients can only respond to UPZ project updates" },
        { status: 400 }
      );
    }

    if (action === "approved" && parsedUpdate.kind !== "approval_request") {
      return NextResponse.json(
        { error: "This update does not require approval" },
        { status: 400 }
      );
    }

    if (
      action === "revision_requested" &&
      !["approval_request", "feedback_request"].includes(parsedUpdate.kind)
    ) {
      return NextResponse.json(
        { error: "This update does not accept revision requests" },
        { status: 400 }
      );
    }

    if (action === "approved") {
      const existingApproval = await prisma.projectNote.findFirst({
        where: {
          projectId: project.id,
          visibility: "client",
          body: { startsWith: `[[thread:${update.id};action:approved]]` },
        },
        select: { id: true },
      });

      if (existingApproval) {
        return NextResponse.json(
          { error: "This review has already been approved" },
          { status: 409 }
        );
      }
    }

    const author = `${company.shortName || company.name} Client`;
    const storedBody = encodeClientResponse(
      action === "approved" ? "Approved" : message,
      update.id,
      action
    );

    const [note] = await prisma.$transaction([
      prisma.projectNote.create({
        data: {
          projectId: project.id,
          body: storedBody,
          visibility: "client",
          author,
        },
      }),
      prisma.projectActivity.create({
        data: {
          projectId: project.id,
          type: `client_${action}`,
          message: `Client ${action.replaceAll("_", " ")} on ${project.title}`,
          actor: author,
          metadata: JSON.stringify({ updateId: update.id }),
        },
      }),
      prisma.project.update({
        where: { id: project.id },
        data: { updatedAt: new Date() },
      }),
    ]);

    const parsed = parseProjectMessage(note.body);

    return NextResponse.json(
      { ...note, ...parsed },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Portal project message error:", error);
    return NextResponse.json(
      { error: "Unable to send response" },
      { status: 500 }
    );
  }
}
