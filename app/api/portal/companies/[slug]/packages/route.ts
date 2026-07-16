import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        packages: {
          where: { active: true },
          include: { items: { include: { catalogItem: true } } },
          orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { title: "asc" }],
        },
      },
    });
    if (!company || !company.portalEnabled) return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    return NextResponse.json(company.packages);
  } catch (error) {
    console.error("Portal packages API error:", error);
    return NextResponse.json({ error: "Unable to load packages" }, { status: 500 });
  }
}
