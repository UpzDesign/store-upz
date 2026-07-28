import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        engagements: {
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
        projects: {
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            title: true,
            status: true,
            engagementId: true,
            tasks: {
              orderBy: { sortOrder: "asc" },
              select: { id: true, title: true, status: true },
            },
          },
        },
      },
    });

    return NextResponse.json(companies, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to load project options" },
      { status: 500 },
    );
  }
}
