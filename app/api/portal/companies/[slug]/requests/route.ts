import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function labelFromKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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

    const service = String(body?.service || body?.type || "Custom Project").trim();
    const projectTitle = String(body?.projectTitle || body?.title || service).trim();

    if (!projectTitle) {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }

    const ignoredKeys = new Set(["projectTitle", "priority"]);
    const answers = body?.answers && typeof body.answers === "object" ? body.answers : body;
    const details = Object.entries(answers || {})
      .filter(([key, value]) => !ignoredKeys.has(key) && value !== "" && value !== null && value !== undefined && value !== false)
      .map(([key, value]) => `${labelFromKey(key)}: ${Array.isArray(value) ? value.join(", ") : String(value).trim()}`)
      .join("\n\n");

    const packageSummary = body?.packageId
      ? `Package ID: ${String(body.packageId)}${body?.packageTitle ? `\nPackage: ${String(body.packageTitle).trim()}` : ""}`
      : "";

    const description = [packageSummary, details].filter(Boolean).join("\n\n");

    const marketingRequest = await prisma.marketingRequest.create({
      data: {
        companyId: company.id,
        type: service,
        title: projectTitle,
        description: description || null,
        priority: String(body?.priority || answers?.priority || "normal"),
        status: "open",
      },
    });

    return NextResponse.json(marketingRequest, { status: 201 });
  } catch (error) {
    console.error("Portal create request API error:", error);
    return NextResponse.json({ error: "Unable to submit project request" }, { status: 500 });
  }
}
