import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; projectId: string }> }
) {
  try {
    const { slug, projectId } = await context.params;
    const body = await request.json().catch(() => null);
    const message = String(body?.message || "").trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message must be 4,000 characters or fewer" },
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

    const author = `${company.shortName || company.name} Client`;

    const note = await prisma.projectNote.create({
      data: {
        projectId: project.id,
        body: message,
        visibility: "client",
        author,
      },
      select: {
        id: true,
        body: true,
        visibility: true,
        author: true,
        createdAt: true,
      },
    });

    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        type: "client_message",
        message: `Client replied on ${project.title}`,
        actor: author,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Portal project message error:", error);
    return NextResponse.json({ error: "Unable to send message" }, { status: 500 });
  }
}
