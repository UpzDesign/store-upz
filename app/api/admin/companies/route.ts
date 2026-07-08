import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Admin companies API error:", error);
    return NextResponse.json(
      { error: "Unable to load companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const name = String(body?.name || "").trim();
    const slug = normalizeSlug(String(body?.slug || name));
    const shortName = String(body?.shortName || name || slug).trim();
    const portalPassword = String(body?.portalPassword || `${slug}demo`).trim();

    if (!name || !slug || !portalPassword) {
      return NextResponse.json(
        { error: "Company name, slug, and password are required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name,
        slug,
        shortName,
        logo: body?.logo ? String(body.logo).trim() : null,
        primaryColor: String(body?.primaryColor || "#edbf2d").trim(),
        secondaryColor: String(body?.secondaryColor || "#010101").trim(),
        heroTitle: String(body?.heroTitle || `${shortName} Brand Portal`).trim(),
        heroText: String(
          body?.heroText ||
            `Approved merchandise, marketing materials, and brand assets for the ${shortName} team.`
        ).trim(),
        portalPassword,
        printfulTokenEnv: body?.printfulTokenEnv ? String(body.printfulTokenEnv).trim() : null,
        portalEnabled: Boolean(body?.portalEnabled ?? true),
      },
    });

    await prisma.collection.createMany({
      data: [
        { companyId: company.id, name: "Apparel", slug: "apparel", sortOrder: 1 },
        { companyId: company.id, name: "Drinkware", slug: "drinkware", sortOrder: 2 },
        { companyId: company.id, name: "Office", slug: "office", sortOrder: 3 },
        { companyId: company.id, name: "Accessories", slug: "accessories", sortOrder: 4 },
      ],
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error("Admin create company API error:", error);

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "That slug is already in use" }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Unable to create company" },
      { status: 500 }
    );
  }
}
