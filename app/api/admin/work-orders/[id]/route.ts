import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
 const {id}=await context.params;const body=await request.json();
 const allowed=["new","in_progress","waiting_client","review","complete","cancelled"];
 if(body.status&&!allowed.includes(body.status))return NextResponse.json({error:"Invalid status"},{status:400});
 const project=await prisma.project.update({where:{id:Number(id)},data:{status:body.status,assignedTo:body.assignedTo===undefined?undefined:body.assignedTo||null,dueDate:body.dueDate===undefined?undefined:body.dueDate?new Date(body.dueDate):null}});
 await prisma.projectActivity.create({data:{projectId:project.id,type:"work_order_updated",message:`Work order updated${body.status?` to ${body.status.replaceAll("_"," ")}`:""}`,actor:"UPZ Admin"}});
 return NextResponse.json(project);
}
