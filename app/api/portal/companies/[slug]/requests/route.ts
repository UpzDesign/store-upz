import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({ where: { slug } });

    if (!company || !company.portalEnabled) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    const requests = await prisma.marketingRequest.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Portal requests API error:", error);
    return NextResponse.json({ error: "Unable to load requests" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json().catch(() => null);
    const company = await prisma.company.findUnique({ where: { slug } });

    if (!company || !company.portalEnabled) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    const service = String(body?.service || "General Marketing Request").trim();
    const projectTitle = String(body?.projectTitle || service).trim();

    if (!projectTitle) {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }

    const details = [
      body?.contactName ? `Contact: ${String(body.contactName).trim()}` : null,
      body?.contactEmail ? `Email: ${String(body.contactEmail).trim()}` : null,
      body?.propertyAddress ? `Property / Address: ${String(body.propertyAddress).trim()}` : null,
      body?.deadline ? `Requested Deadline: ${String(body.deadline).trim()}` : null,
      body?.budget ? `Budget / Range: ${String(body.budget).trim()}` : null,
      body?.deliverables ? `Requested Deliverables: ${String(body.deliverables).trim()}` : null,
      body?.notes ? `Notes:\n${String(body.notes).trim()}` : null,
    ].filter(Boolean).join("\n\n");

    const marketingRequest = await prisma.marketingRequest.create({
      data: {
        companyId: company.id,
        type: service,
        title: projectTitle,
        description: details || null,
        priority: String(body?.priority || "normal"),
        status: "open",
      },
    });

    return NextResponse.json(marketingRequest, { status: 201 });
  } catch (error) {
    console.error("Portal create request API error:", error);
    return NextResponse.json({ error: "Unable to submit project request" }, { status: 500 });
  }
}
