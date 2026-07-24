import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function labelFromKey(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company || !company.portalEnabled) return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    const requests = await prisma.marketingRequest.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "desc" }, take: 12 });
    return NextResponse.json(requests, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Portal requests API error:", error);
    return NextResponse.json({ error: "Unable to load requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = await request.json().catch(() => null);
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company || !company.portalEnabled) return NextResponse.json({ error: "Portal not found" }, { status: 404 });

    const service = String(body?.service || body?.type || "Custom Project").trim();
    const submittedTitle = String(body?.projectTitle || body?.title || service).trim();
    const engagementName = String(body?.engagementName || body?.propertyName || body?.projectName || body?.address || body?.propertyAddress || submittedTitle).trim();
    const workOrderTitle = String(body?.workOrderTitle || `${service}${engagementName && engagementName !== service ? ` — ${engagementName}` : ""}`).trim();
    const propertyAddress = String(body?.propertyAddress || body?.address || "").trim();
    if (!engagementName) return NextResponse.json({ error: "Project or campaign name is required" }, { status: 400 });

    const ignoredKeys = new Set(["projectTitle", "title", "workOrderTitle", "projectName", "engagementName", "engagementId", "propertyName", "priority", "service", "type", "packageId", "packageTitle"]);
    const answers = body?.answers && typeof body.answers === "object" ? body.answers : body;
    const details = Object.entries(answers || {})
      .filter(([key, value]) => !ignoredKeys.has(key) && value !== "" && value !== null && value !== undefined && value !== false)
      .map(([key, value]) => `${labelFromKey(key)}: ${Array.isArray(value) ? value.join(", ") : String(value).trim()}`)
      .join("\n\n");
    const packageSummary = body?.packageId ? `Package ID: ${String(body.packageId)}${body?.packageTitle ? `\nPackage: ${String(body.packageTitle).trim()}` : ""}` : "";
    const contextData = JSON.stringify({
      engagementId: body?.engagementId ? Number(body.engagementId) : null,
      engagementName,
      engagementType: propertyAddress ? "property" : String(body?.engagementType || "campaign"),
      propertyAddress: propertyAddress || null,
      packageId: body?.packageId ? Number(body.packageId) : null,
      service,
    });
    const description = [packageSummary, details, `__UPZ_CONTEXT__${contextData}`].filter(Boolean).join("\n\n");
    const priority = String(body?.priority || answers?.priority || "normal");

    const marketingRequest = await prisma.marketingRequest.create({
      data: { companyId: company.id, type: service, title: workOrderTitle, description: description || null, priority, status: "new" },
    });

    return NextResponse.json({ request: marketingRequest, pendingApproval: true }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Portal create request API error:", error);
    return NextResponse.json({ error: "Unable to submit request" }, { status: 500 });
  }
}
