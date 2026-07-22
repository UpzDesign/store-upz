import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({ where: { slug } });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const safe = async <T,>(loader: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await loader();
      } catch (error) {
        console.error(`Unable to load related company data for ${slug}:`, error);
        return fallback;
      }
    };

    const [products, collections, packages, assets, requests, orders] = await Promise.all([
      safe(() => prisma.product.findMany({ where: { companyId: company.id }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }), []),
      safe(() => prisma.collection.findMany({ where: { companyId: company.id }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }), []),
      safe(() => prisma.package.findMany({ where: { companyId: company.id } }), []),
      safe(() => prisma.brandAsset.findMany({ where: { companyId: company.id } }), []),
      safe(() => prisma.marketingRequest.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "desc" } }), []),
      safe(() => prisma.order.findMany({ where: { companyId: company.id } }), []),
    ]);

    return NextResponse.json({ ...company, products, collections, packages, assets, requests, orders });
  } catch (error) {
    console.error("Admin company detail API error:", error);
    return NextResponse.json({ error: "Unable to load company" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = await request.json().catch(() => null);
    const currentCompany = await prisma.company.findUnique({ where: { slug } });
    if (!currentCompany) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    const nextSlug = String(body?.slug || currentCompany.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!nextSlug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });
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
        printfulTokenEnv: body?.printfulTokenEnv === "" ? null : String(body?.printfulTokenEnv || currentCompany.printfulTokenEnv || ""),
        portalEnabled: Boolean(body?.portalEnabled),
      },
    });
    return NextResponse.json(updatedCompany);
  } catch (error: any) {
    console.error("Admin company update API error:", error);
    if (error?.code === "P2002") return NextResponse.json({ error: "That slug is already in use" }, { status: 409 });
    return NextResponse.json({ error: "Unable to update company" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    await prisma.project.deleteMany({ where: { companyId: company.id } });
    await prisma.catalogItem.deleteMany({ where: { companyId: company.id } });
    await prisma.product.deleteMany({ where: { companyId: company.id } });
    await prisma.collection.deleteMany({ where: { companyId: company.id } });
    await prisma.packageItem.deleteMany({ where: { package: { companyId: company.id } } });
    await prisma.package.deleteMany({ where: { companyId: company.id } });
    await prisma.brandAsset.deleteMany({ where: { companyId: company.id } });
    await prisma.marketingRequest.deleteMany({ where: { companyId: company.id } });
    await prisma.order.deleteMany({ where: { companyId: company.id } });
    await prisma.company.delete({ where: { id: company.id } });
    return NextResponse.json({ deleted: true, slug });
  } catch (error) {
    console.error("Admin company delete error:", error);
    return NextResponse.json({ error: "Unable to delete company" }, { status: 500 });
  }
}
