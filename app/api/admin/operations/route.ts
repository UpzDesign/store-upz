import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isProjectActive, normalizeProjectStage } from "@/lib/project-status";

export async function GET() {
  const [projects, engagements, assets, services, teamMembers] = await Promise.all([
    prisma.project.findMany({
      include: {
        company: { select: { name: true, shortName: true, slug: true } },
        engagement: { select: { id: true, name: true } },
        tasks: { orderBy: { sortOrder: "asc" } },
        notes: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.engagement.findMany({ include: { company: { select: { name: true, shortName: true, slug: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.engagementAsset.findMany({ include: { engagement: { select: { id: true, name: true, company: { select: { shortName: true } } } } }, where: { active: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.teamMember.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const normalizedProjects = projects.map((project) => ({ ...project, status: normalizeProjectStage(project.status) }));
  const activeProjects = normalizedProjects.filter((project) => isProjectActive(project.status));
  const workload = teamMembers.map((member) => {
    const assignedProjects = activeProjects.filter((project) => project.assignedTo === member.name);
    const assignedTasks = assignedProjects.flatMap((project) => project.tasks).filter((task) => task.assignedTo === member.name && !["complete", "completed"].includes(task.status));
    const overdue = assignedProjects.filter((project) => project.dueDate && new Date(project.dueDate) < new Date()).length + assignedTasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date()).length;
    return { ...member, active: assignedProjects.length, tasks: assignedTasks.length, overdue };
  });

  return NextResponse.json(
    { projects: activeProjects, engagements, assets, services, team: workload },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
