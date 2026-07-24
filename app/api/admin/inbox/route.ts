import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const requests = await prisma.marketingRequest.findMany({
      where: {
        status: { in: ["new", "pending", "submitted", "reviewing", "needs_info"] },
        project: { is: null },
      },
      include: {
        company: { select: { name: true, shortName: true, slug: true, logo: true, primaryColor: true } },
        project: { select: { id: true, status: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    });

    const priorityWeight: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    const sorted = requests.sort((a, b) => {
      const priorityDiff = (priorityWeight[a.priority.toLowerCase()] ?? 2) - (priorityWeight[b.priority.toLowerCase()] ?? 2);
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json(sorted, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin inbox API error:", error);
    return NextResponse.json({ error: "Unable to load inbox" }, { status: 500 });
  }
}
