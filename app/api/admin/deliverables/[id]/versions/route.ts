import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 try{
  const{id}=await context.params;const deliverableId=Number(id);const body=await request.json();
  const fileUrl=String(body?.fileUrl||"").trim();const fileName=String(body?.fileName||"").trim()||null;const fileType=String(body?.fileType||"").trim()||null;const notes=String(body?.notes||"").trim()||null;const createdBy=String(body?.createdBy||"UPZ Admin").trim();
  if(!deliverableId||!fileUrl)return NextResponse.json({error:"File URL is required"},{status:400});
  const rows=await prisma.$queryRaw<Array<{projectId:number;title:string}>>`SELECT "projectId",title FROM "Deliverable" WHERE id=${deliverableId}`;
  if(!rows[0])return NextResponse.json({error:"Deliverable not found"},{status:404});
  const result=await prisma.$transaction(async tx=>{
   const nextRows=await tx.$queryRaw<Array<{next:number}>>`SELECT COALESCE(MAX("versionNumber"),0)+1 AS next FROM "DeliverableVersion" WHERE "deliverableId"=${deliverableId}`;
   const versionNumber=Number(nextRows[0]?.next||1);
   const [version]=await tx.$queryRaw<Array<{id:number}>>`INSERT INTO "DeliverableVersion" ("deliverableId","versionNumber","label","fileUrl","fileName","fileType","notes","status","createdBy","createdAt") VALUES (${deliverableId},${versionNumber},${`Version ${versionNumber}`},${fileUrl},${fileName},${fileType},${notes},'waiting_for_review',${createdBy},NOW()) RETURNING id`;
   await tx.$executeRaw`UPDATE "Deliverable" SET status='waiting_for_review',"updatedAt"=NOW() WHERE id=${deliverableId}`;
   await tx.projectActivity.create({data:{projectId:rows[0].projectId,type:"deliverable_version_added",message:`New version uploaded: ${rows[0].title} v${versionNumber}`,actor:createdBy,metadata:JSON.stringify({deliverableId,versionId:version.id})}});
   await tx.project.update({where:{id:rows[0].projectId},data:{updatedAt:new Date()}});
   return{versionId:version.id,versionNumber};
  });
  return NextResponse.json(result,{status:201});
 }catch(error){console.error(error);return NextResponse.json({error:"Unable to add version"},{status:500});}
}