import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const requests = await prisma.marketingRequest.findMany({
      where: { status: { notIn: ["complete", "completed", "cancelled", "closed"] } },
      include: {
        company: { select: { name: true, shortName: true, slug: true, logo: true, primaryColor: true } },
        project: { select: { id: true, status: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    });

    const priorityWeight: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    const sorted = requests.sort((a, b) => {
      const aNew = !a.project || a.project.status.toLowerCase() === "new";
      const bNew = !b.project || b.project.status.toLowerCase() === "new";
      if (aNew !== bNew) return aNew ? -1 : 1;
      const priorityDiff = (priorityWeight[a.priority.toLowerCase()] ?? 2) - (priorityWeight[b.priority.toLowerCase()] ?? 2);
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Admin inbox API error:", error);
    return NextResponse.json({ error: "Unable to load inbox" }, { status: 500 });
  }
}
