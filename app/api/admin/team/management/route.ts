import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

export async function GET() {
  const session = await requireStaffSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [members, projects, tasks] = await Promise.all([
    prisma.teamMember.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.project.findMany({
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        assignedTo: true,
        dueDate: true,
        company: { select: { name: true, shortName: true } },
      },
    }),
    prisma.projectTask.findMany({
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        assignedTo: true,
        dueDate: true,
        projectId: true,
        project: { select: { title: true, company: { select: { shortName: true } } } },
      },
    }),
  ]);

  const enriched = members.map((member) => {
    const assignedProjects = projects.filter((project) => project.assignedTo === member.name);
    const assignedTasks = tasks.filter((task) => task.assignedTo === member.name);
    const openTasks = assignedTasks.filter((task) => task.status !== "complete");
    return {
      ...member,
      assignedProjects,
      assignedTasks,
      workload: {
        projects: assignedProjects.length,
        tasks: assignedTasks.length,
        openTasks: openTasks.length,
        remainingCapacity: Math.max(0, member.capacity - openTasks.length),
      },
    };
  });

  return NextResponse.json({ members: enriched, projects, tasks }, { headers: { "Cache-Control": "private, no-store" } });
}
