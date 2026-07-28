import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type DeliverableRow={id:number;projectId:number;stageId:number|null;title:string;description:string|null;category:string;status:string;clientVisible:boolean;createdAt:Date;updatedAt:Date;projectTitle:string;companyName:string};
type VersionRow={id:number;deliverableId:number;versionNumber:number;label:string|null;fileUrl:string;fileName:string|null;fileType:string|null;notes:string|null;status:string;createdBy:string|null;createdAt:Date};

export async function GET(){
 try{
  const deliverables=await prisma.$queryRaw<DeliverableRow[]>`SELECT d.*,p.title AS "projectTitle",c.name AS "companyName" FROM "Deliverable" d JOIN "Project" p ON p.id=d."projectId" JOIN "Company" c ON c.id=p."companyId" ORDER BY d."updatedAt" DESC`;
  const versions=deliverables.length?await prisma.$queryRaw<VersionRow[]>`SELECT * FROM "DeliverableVersion" ORDER BY "deliverableId", "versionNumber" DESC`:[];
  return NextResponse.json(deliverables.map(item=>({...item,versions:versions.filter(version=>version.deliverableId===item.id)})),{headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error(error);return NextResponse.json({error:"Unable to load deliverables"},{status:500});}
}

export async function POST(request:NextRequest){
 try{
  const body=await request.json();
  const projectId=Number(body?.projectId);const stageId=body?.stageId?Number(body.stageId):null;
  const title=String(body?.title||"").trim();const description=String(body?.description||"").trim()||null;
  const category=String(body?.category||"general").trim();const fileUrl=String(body?.fileUrl||"").trim();
  const fileName=String(body?.fileName||"").trim()||null;const fileType=String(body?.fileType||"").trim()||null;
  const notes=String(body?.notes||"").trim()||null;const createdBy=String(body?.createdBy||"UPZ Admin").trim();
  if(!projectId||!title||!fileUrl)return NextResponse.json({error:"Project, title, and file URL are required"},{status:400});
  const project=await prisma.project.findUnique({where:{id:projectId},select:{id:true,tasks:{select:{id:true}}}});
  if(!project)return NextResponse.json({error:"Project not found"},{status:404});
  const validStageId=stageId&&project.tasks.some(task=>task.id===stageId)?stageId:null;
  const result=await prisma.$transaction(async tx=>{
   const [deliverable]=await tx.$queryRaw<Array<{id:number}>>`INSERT INTO "Deliverable" ("projectId","stageId","title","description","category","status","clientVisible","createdAt","updatedAt") VALUES (${projectId},${validStageId},${title},${description},${category},'waiting_for_review',true,NOW(),NOW()) RETURNING id`;
   const [version]=await tx.$queryRaw<Array<{id:number;versionNumber:number}>>`INSERT INTO "DeliverableVersion" ("deliverableId","versionNumber","label","fileUrl","fileName","fileType","notes","status","createdBy","createdAt") VALUES (${deliverable.id},1,'Version 1',${fileUrl},${fileName},${fileType},${notes},'waiting_for_review',${createdBy},NOW()) RETURNING id,"versionNumber"`;
   await tx.projectActivity.create({data:{projectId,type:"deliverable_created",message:`Deliverable created: ${title}`,actor:createdBy,metadata:JSON.stringify({deliverableId:deliverable.id,versionId:version.id})}});
   await tx.project.update({where:{id:projectId},data:{updatedAt:new Date()}});
   return{deliverableId:deliverable.id,versionId:version.id};
  });
  return NextResponse.json(result,{status:201});
 }catch(error){console.error(error);return NextResponse.json({error:"Unable to create deliverable"},{status:500});}
}