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
