import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
    const requestCounts = new Map<number, number>();
    try {
      const requests = await prisma.marketingRequest.findMany({ select: { companyId: true, status: true, project: { select: { status: true } } } });
      requests.forEach((request) => {
        const requestStatus = String(request.status || "open").toLowerCase();
        const projectStatus = request.project?.status ? String(request.project.status).toLowerCase() : null;
        const requestIsOpen = !["complete", "completed", "cancelled", "closed"].includes(requestStatus);
        if (requestIsOpen && (!projectStatus || projectStatus === "new")) requestCounts.set(request.companyId, (requestCounts.get(request.companyId) || 0) + 1);
      });
    } catch (notificationError) {
      console.error("Admin request notification query unavailable:", notificationError);
    }
    return NextResponse.json(companies.map((company) => ({ ...company, newRequestCount: requestCounts.get(company.id) || 0 })));
  } catch (error) {
    console.error("Admin companies API error:", error);
    return NextResponse.json({ error: "Unable to load companies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const name = String(body?.name || "").trim();
    const slug = normalizeSlug(String(body?.slug || name));
    const shortName = String(body?.shortName || name || slug).trim();
    const portalPassword = String(body?.portalPassword || `${slug}demo`).trim();
    const logoType = ["image", "text", "none"].includes(String(body?.logoType)) ? String(body.logoType) : "image";
    if (!name || !slug || !portalPassword) return NextResponse.json({ error: "Company name, slug, and password are required" }, { status: 400 });

    const company = await prisma.company.create({
      data: {
        name,
        slug,
        shortName,
        logo: logoType === "image" && body?.logo ? String(body.logo).trim() : null,
        logoType,
        logoText: logoType === "text" ? String(body?.logoText || shortName).trim() : null,
        logoTextColor: body?.logoTextColor ? String(body.logoTextColor).trim() : null,
        logoFontStyle: body?.logoFontStyle ? String(body.logoFontStyle).trim() : "sans",
        primaryColor: String(body?.primaryColor || "#edbf2d").trim(),
        secondaryColor: String(body?.secondaryColor || "#010101").trim(),
        heroTitle: String(body?.heroTitle || `${shortName} Brand Portal`).trim(),
        heroText: String(body?.heroText || `Approved merchandise, marketing materials, and brand assets for the ${shortName} team.`).trim(),
        portalPassword,
        printfulTokenEnv: body?.printfulTokenEnv ? String(body.printfulTokenEnv).trim() : null,
        portalEnabled: Boolean(body?.portalEnabled ?? true),
      },
    });

    await prisma.collection.createMany({ data: [
      { companyId: company.id, name: "Apparel", slug: "apparel", sortOrder: 1 },
      { companyId: company.id, name: "Drinkware", slug: "drinkware", sortOrder: 2 },
      { companyId: company.id, name: "Office", slug: "office", sortOrder: 3 },
      { companyId: company.id, name: "Accessories", slug: "accessories", sortOrder: 4 },
    ] });

    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error("Admin create company API error:", error);
    if (error?.code === "P2002") return NextResponse.json({ error: "That slug is already in use" }, { status: 409 });
    return NextResponse.json({ error: "Unable to create company" }, { status: 500 });
  }
}
