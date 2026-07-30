import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [requests, activities] = await Promise.all([
      prisma.marketingRequest.findMany({
        where: { status: { in: ["new", "pending", "submitted", "reviewing", "needs_info"] }, project: { is: null } },
        include: { company: { select: { name: true, shortName: true, slug: true, logo: true, primaryColor: true } }, project: { select: { id: true, status: true } } },
        orderBy: [{ createdAt: "desc" }],
        take: 100,
      }),
      prisma.projectActivity.findMany({
        where: { type: { in: ["client_reply", "client_revision_requested"] } },
        include: { project: { select: { id: true, title: true, status: true, company: { select: { name: true, shortName: true, slug: true, logo: true, primaryColor: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const requestItems = requests.map((item) => ({ ...item, inboxKind: "request" as const }));
    const activityItems = activities.map((item) => ({
      id: 1000000000 + item.id,
      sourceId: item.id,
      inboxKind: "client_activity" as const,
      type: item.type,
      title: item.project.title,
      description: item.message,
      priority: item.type === "client_revision_requested" ? "high" : "normal",
      status: "attention",
      createdAt: item.createdAt,
      company: item.project.company,
      project: { id: item.project.id, status: item.project.status },
    }));

    const priorityWeight: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    const sorted = [...requestItems, ...activityItems].sort((a, b) => {
      const priorityDiff = (priorityWeight[a.priority.toLowerCase()] ?? 2) - (priorityWeight[b.priority.toLowerCase()] ?? 2);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(sorted, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin inbox API error:", error);
    return NextResponse.json({ error: "Unable to load inbox" }, { status: 500 });
  }
}
