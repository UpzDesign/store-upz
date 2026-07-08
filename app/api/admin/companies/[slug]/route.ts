import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        products: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
        collections: true,
        packages: true,
        assets: true,
        requests: true,
        orders: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Admin company detail API error:", error);
    return NextResponse.json(
      { error: "Unable to load company" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json().catch(() => null);

    const currentCompany = await prisma.company.findUnique({ where: { slug } });

    if (!currentCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const nextSlug = String(body?.slug || currentCompany.slug)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!nextSlug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const updatedCompany = await prisma.company.update({
      where: { slug },
      data: {
        name: String(body?.name || currentCompany.name).trim(),
        slug: nextSlug,
        shortName: String(body?.shortName || currentCompany.shortName).trim(),
        logo: body?.logo === "" ? null : String(body?.logo || currentCompany.logo || ""),
        primaryColor: String(body?.primaryColor || currentCompany.primaryColor).trim(),
        secondaryColor: String(body?.secondaryColor || currentCompany.secondaryColor).trim(),
        heroTitle: String(body?.heroTitle || currentCompany.heroTitle).trim(),
        heroText: String(body?.heroText || currentCompany.heroText).trim(),
        portalPassword: String(body?.portalPassword || currentCompany.portalPassword).trim(),
        printfulTokenEnv:
          body?.printfulTokenEnv === ""
            ? null
            : String(body?.printfulTokenEnv || currentCompany.printfulTokenEnv || ""),
        portalEnabled: Boolean(body?.portalEnabled),
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error: any) {
    console.error("Admin company update API error:", error);

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "That slug is already in use" }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Unable to update company" },
      { status: 500 }
    );
  }
}
