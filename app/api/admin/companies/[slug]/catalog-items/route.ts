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
        catalogItems: {
          include: {
            collection: true,
            product: true,
          },
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company.catalogItems);
  } catch (error) {
    console.error("Admin catalog items API error:", error);
    return NextResponse.json({ error: "Unable to load catalog items" }, { status: 500 });
  }
}
