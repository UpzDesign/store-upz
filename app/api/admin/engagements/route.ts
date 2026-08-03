import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

export async function GET() {
  try {
    const session=await requireStaffSession();
    if(!session)return NextResponse.json({error:"Authentication required"},{status:401});
    const engagements = await prisma.engagement.findMany({
      where: session.role==="manager"?{workOrders:{some:{assignedTo:session.name}}}:undefined,
      include: {
        company: { select: { id: true, name: true, shortName: true, slug: true, logo: true, primaryColor: true } },
        workOrders: {
          where:session.role==="manager"?{assignedTo:session.name}:undefined,
          select: {id:true,title:true,status:true,priority:true,budget:true,internalCost:true,dueDate:true,updatedAt:true,tasks:{select:{status:true}}},
          orderBy: { updatedAt: "desc" },
        },
        assets: { select: { id: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(engagements.map((engagement) => {
      const totalTasks = engagement.workOrders.reduce((sum, project) => sum + project.tasks.length, 0);
      const completeTasks = engagement.workOrders.reduce((sum, project) => sum + project.tasks.filter((task) => ["complete","completed"].includes(task.status)).length, 0);
      const workOrderBudget = engagement.workOrders.reduce((sum, project) => sum + Number(project.budget || 0), 0);
      const cost = engagement.workOrders.reduce((sum, project) => sum + Number(project.internalCost || 0), 0);
      const activeOrders = engagement.workOrders.filter((project) => !["complete", "completed", "cancelled"].includes(project.status.toLowerCase())).length;
      return { ...engagement, progress: totalTasks ? Math.round((completeTasks / totalTasks) * 100) : 0, totalBudget: Number(engagement.budget || workOrderBudget), cost, activeOrders, assetCount: engagement.assets.length };
    }));
  } catch (error) {
    console.error("Admin properties error:", error);
    return NextResponse.json({ error: "Unable to load properties" }, { status: 500 });
  }
}
