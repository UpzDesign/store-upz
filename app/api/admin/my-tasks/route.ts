import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

export async function GET(request: NextRequest) {
  const session = await requireStaffSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const requested = request.nextUrl.searchParams.get("member")?.trim() || "";
  const team = await prisma.teamMember.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, capacity: true },
  });

  const member = session.role === "admin" ? requested : session.name;
  if (!member) return NextResponse.json({ team: session.role === "admin" ? team : [], member: null, tasks: [], session }, { headers: { "Cache-Control": "private, no-store" } });
  const selected = team.find((item) => item.name === member);
  if (!selected) return NextResponse.json({ error: "Team member not found" }, { status: 404 });

  const tasks = await prisma.projectTask.findMany({
    where: { assignedTo: selected.name },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
    include: {
      checklist: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      comments: { orderBy: { createdAt: "desc" }, take: 5 },
      attachments: { orderBy: { createdAt: "desc" }, take: 5 },
      project: { include: { company: { select: { name: true, shortName: true, slug: true, primaryColor: true } }, engagement: { select: { id: true, name: true, address: true } } } },
    },
  });

  return NextResponse.json({ team: session.role === "admin" ? team : [], member: selected, tasks, session }, { headers: { "Cache-Control": "private, no-store" } });
}
