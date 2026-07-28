import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request:NextRequest,context:{params:Promise<{slug:string;versionId:string}>}){
 try{
  const{slug,versionId}=await context.params;const id=Number(versionId);const body=await request.json();
  const action=String(body?.action||"");const message=String(body?.message||"").trim()||null;const author=String(body?.author||"Client").trim();
  if(!id||!["approved","revision_requested","comment"].includes(action))return NextResponse.json({error:"Invalid review"},{status:400});
  if(action==="revision_requested"&&!message)return NextResponse.json({error:"Revision details are required"},{status:400});
  const rows=await prisma.$queryRaw<Array<{projectId:number;deliverableId:number;title:string}>>`SELECT p.id AS "projectId",d.id AS "deliverableId",d.title FROM "DeliverableVersion" v JOIN "Deliverable" d ON d.id=v."deliverableId" JOIN "Project" p ON p.id=d."projectId" JOIN "Company" c ON c.id=p."companyId" WHERE v.id=${id} AND c.slug=${slug} AND c."portalEnabled"=true AND p."clientVisible"=true AND d."clientVisible"=true`;
  if(!rows[0])return NextResponse.json({error:"Deliverable not found"},{status:404});
  await prisma.$transaction(async tx=>{
   await tx.$executeRaw`INSERT INTO "DeliverableReview" ("versionId",action,message,author,"createdAt") VALUES (${id},${action},${message},${author},NOW())`;
   if(action!=="comment"){
    const status=action==="approved"?"approved":"revision_requested";
    await tx.$executeRaw`UPDATE "DeliverableVersion" SET status=${status} WHERE id=${id}`;
    await tx.$executeRaw`UPDATE "Deliverable" SET status=${status},"updatedAt"=NOW() WHERE id=${rows[0].deliverableId}`;
   }
   await tx.projectActivity.create({data:{projectId:rows[0].projectId,type:`deliverable_${action}`,message:`${rows[0].title}: ${action.replaceAll("_"," ")}`,actor:author,metadata:JSON.stringify({deliverableId:rows[0].deliverableId,versionId:id,message})}});
   await tx.project.update({where:{id:rows[0].projectId},data:{updatedAt:new Date()}});
  });
  return NextResponse.json({ok:true});
 }catch(error){console.error(error);return NextResponse.json({error:"Unable to save review"},{status:500});}
}