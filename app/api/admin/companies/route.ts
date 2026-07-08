import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
