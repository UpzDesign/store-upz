import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPLETE = new Set(["complete", "completed", "delivered", "cancelled", "archived"]);
const taskComplete = (status?: string | null) => COMPLETE.has(String(status || "").toLowerCase());
const projectClosed = (status?: string | null) => COMPLETE.has(String(status || "").toLowerCase());
function requestContext(value?:string|null){const source=value||"",marker="__UPZ_CONTEXT__",index=source.lastIndexOf(marker);if(index<0)return{} as any;try{return JSON.parse(source.slice(index+marker.length).trim())}catch{return{} as any}}

export async function GET() {
  try {
    const activityCutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    const [requests, activities, projects] = await Promise.all([
      prisma.marketingRequest.findMany({
        where: { status: { in: ["new", "pending", "submitted", "reviewing", "needs_info"] }, project: { is: null } },
        include: { company: { select: { name: true, shortName: true, slug: true, logo: true, primaryColor: true } }, project: { select: { id: true, status: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.projectActivity.findMany({
        where: { type: { in: ["client_reply", "client_revision_requested", "client_approved"] }, createdAt: { gte: activityCutoff } },
        include: { project: { select: { id: true, title: true, status: true, company: { select: { name: true, shortName: true, slug: true, logo: true, primaryColor: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 75,
      }),
      prisma.project.findMany({
        where: { status: { notIn: ["complete", "completed", "delivered", "cancelled", "archived"] } },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          assignedTo: true,
          dueDate: true,
          updatedAt: true,
          company: { select: { name: true, shortName: true, slug: true, logo: true, primaryColor: true } },
          tasks: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, status: true, assignedTo: true, dueDate: true, sortOrder: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 150,
      }),
    ]);

    const grouped=new Map<string,typeof requests>();
    const standalone:typeof requests=[];
    for(const item of requests){const context=requestContext(item.description),groupId=String(context?.requestGroup?.id||"").trim();if(!groupId){standalone.push(item);continue}const list=grouped.get(groupId)||[];list.push(item);grouped.set(groupId,list)}
    const groupedItems=Array.from(grouped.entries()).map(([groupId,list])=>{const first=list[0],context=requestContext(first.description),group=context?.requestGroup||{},services=Array.isArray(group.services)?group.services.map((service:any)=>String(service?.name||service?.slug||"")).filter(Boolean):list.map(item=>item.type);return{id:first.id,sourceIds:list.map(item=>item.id),requestGroupId:groupId,inboxKind:"request" as const,kind:"request_group",type:"multi_service_request",title:`${String(group.projectName||context.portfolioName||"Project request")} · ${list.length} service${list.length===1?"":"s"}`,description:`${String(group.address||context.propertyAddress||"")}${services.length?`\n${services.join(" · ")}`:""}`.trim(),priority:list.some(item=>item.priority==="urgent")?"urgent":list.some(item=>item.priority==="high")?"high":first.priority,status:"pending",createdAt:first.createdAt,company:first.company,project:null,actionLabel:"Review Services",href:`/admin/request/${first.id}`}});
    const standaloneItems=standalone.map((item) => ({ ...item, inboxKind: "request" as const, kind: "request", actionLabel: "Review Request", href: `/admin/request/${item.id}` }));
    const requestItems=[...groupedItems,...standaloneItems];
    const activityItems = activities.filter(item => !projectClosed(item.project.status)).map((item) => ({
      id: 1000000000 + item.id,
      sourceId: item.id,
      inboxKind: "client_activity" as const,
      kind: "client_response",
      type: item.type,
      title: item.project.title,
      description: item.message,
      priority: item.type === "client_revision_requested" ? "high" : "normal",
      status: "attention",
      createdAt: item.createdAt,
      company: item.project.company,
      project: { id: item.project.id, status: item.project.status },
      actionLabel: "Open Work Order",
      href: `/admin/project/${item.project.id}`,
    }));

    const operationalItems: any[] = [];
    const now = new Date();
    for (const project of projects) {
      if (projectClosed(project.status)) continue;
      if (String(project.status).toLowerCase() === "waiting_client") {
        operationalItems.push({ id: 2000000000 + project.id, inboxKind: "operation", kind: "waiting_client", type: "waiting_client", title: project.title, description: "This work order is waiting for client input or approval.", priority: project.priority === "urgent" ? "urgent" : "normal", status: "attention", createdAt: project.updatedAt, company: project.company, project: { id: project.id, status: project.status }, actionLabel: "Open Work Order", href: `/admin/project/${project.id}` });
      }
      project.tasks.forEach((task, index) => {
        if (taskComplete(task.status)) return;
        const previous = index > 0 ? project.tasks[index - 1] : null;
        const blocked = Boolean(previous && !taskComplete(previous.status));
        const assignee = task.assignedTo || project.assignedTo;
        if (task.dueDate && new Date(task.dueDate) < now) {
          operationalItems.push({ id: 3000000000 + task.id, inboxKind: "operation", kind: "overdue_stage", type: "overdue_stage", title: task.title, description: `${project.title} · Stage was due ${new Date(task.dueDate).toLocaleDateString("en-US")}.`, priority: "urgent", status: "attention", createdAt: task.dueDate, company: project.company, project: { id: project.id, status: project.status }, task: { id: task.id }, actionLabel: "Manage Stage", href: `/admin/operations?project=${project.id}` });
        } else if (!blocked && !assignee) {
          operationalItems.push({ id: 4000000000 + task.id, inboxKind: "operation", kind: "unassigned_stage", type: "unassigned_stage", title: task.title, description: `${project.title} · Actionable stage has no assignee.`, priority: project.priority === "urgent" ? "urgent" : "high", status: "attention", createdAt: project.updatedAt, company: project.company, project: { id: project.id, status: project.status }, task: { id: task.id }, actionLabel: "Assign Stage", href: `/admin/operations?project=${project.id}` });
        } else if (blocked && project.priority === "urgent") {
          operationalItems.push({ id: 5000000000 + task.id, inboxKind: "operation", kind: "blocked_stage", type: "blocked_stage", title: task.title, description: `${project.title} · Blocked by “${previous?.title}”.`, priority: "high", status: "attention", createdAt: project.updatedAt, company: project.company, project: { id: project.id, status: project.status }, task: { id: task.id }, actionLabel: "Review Workflow", href: `/admin/operations?project=${project.id}` });
        }
      });
    }

    const priorityWeight: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    const sorted = [...requestItems, ...activityItems, ...operationalItems].sort((a, b) => {
      const priorityDiff = (priorityWeight[String(a.priority).toLowerCase()] ?? 2) - (priorityWeight[String(b.priority).toLowerCase()] ?? 2);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(sorted, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin inbox API error:", error);
    return NextResponse.json({ error: "Unable to load action center" }, { status: 500 });
  }
}
