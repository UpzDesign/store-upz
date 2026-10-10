import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

const allowed = new Set(["approved","changes_requested","waiting_for_review"]);
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=await requireStaffSession();
 if(!session||session.role!=="admin")return NextResponse.json({error:"Admin access required"},{status:403});
 const {id}=await context.params;
 const deliverableId=Number(id);
 if(!Number.isInteger(deliverableId)||deliverableId<=0)return NextResponse.json({error:"Invalid deliverable"},{status:400});
 const body=await request.json().catch(()=>null);
 const status=String(body?.status||"");
 const note=String(body?.note||"").trim().slice(0,1000);
 if(!allowed.has(status))return NextResponse.json({error:"Invalid review status"},{status:400});
 if(status==="changes_requested"&&!note)return NextResponse.json({error:"A revision note is required"},{status:400});
 const rows=await prisma.$queryRaw<Array<{projectId:number;title:string}>>`SELECT "projectId",title FROM "Deliverable" WHERE id=${deliverableId}`;
 const item=rows[0];
 if(!item)return NextResponse.json({error:"Deliverable not found"},{status:404});
 await prisma.$transaction(async tx=>{
  await tx.$executeRaw`UPDATE "Deliverable" SET status=${status},"updatedAt"=NOW() WHERE id=${deliverableId}`;
  await tx.$executeRaw`UPDATE "DeliverableVersion" SET status=${status} WHERE id=(SELECT id FROM "DeliverableVersion" WHERE "deliverableId"=${deliverableId} ORDER BY "versionNumber" DESC LIMIT 1)`;
  await tx.projectActivity.create({data:{projectId:item.projectId,type:"deliverable_review",message:`Review ${status.replaceAll("_"," ")}: ${item.title}${note?" — "+note:""}`,actor:session.name||"UPZ Admin",metadata:JSON.stringify({deliverableId,status,note,reviewedAt:new Date().toISOString()})}});
  await tx.project.update({where:{id:item.projectId},data:{updatedAt:new Date()}});
 });
 return NextResponse.json({ok:true,status});
}
