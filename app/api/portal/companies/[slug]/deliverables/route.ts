import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Row={id:number;projectId:number;stageId:number|null;title:string;description:string|null;category:string;status:string;updatedAt:Date;projectTitle:string;engagementName:string|null;versionId:number|null;versionNumber:number|null;label:string|null;fileUrl:string|null;fileName:string|null;fileType:string|null;notes:string|null;versionStatus:string|null;createdAt:Date|null};
type Review={id:number;versionId:number;action:string;message:string|null;author:string|null;createdAt:Date};

export async function GET(_request:NextRequest,context:{params:Promise<{slug:string}>}){
 try{
  const{slug}=await context.params;const company=await prisma.company.findUnique({where:{slug,portalEnabled:true},select:{id:true}});
  if(!company)return NextResponse.json({error:"Company not found"},{status:404});
  const rows=await prisma.$queryRaw<Row[]>`SELECT d.id,d."projectId",d."stageId",d.title,d.description,d.category,d.status,d."updatedAt",p.title AS "projectTitle",e.name AS "engagementName",v.id AS "versionId",v."versionNumber",v.label,v."fileUrl",v."fileName",v."fileType",v.notes,v.status AS "versionStatus",v."createdAt" FROM "Deliverable" d JOIN "Project" p ON p.id=d."projectId" LEFT JOIN "Engagement" e ON e.id=p."engagementId" LEFT JOIN "DeliverableVersion" v ON v."deliverableId"=d.id WHERE p."companyId"=${company.id} AND p."clientVisible"=true AND d."clientVisible"=true ORDER BY d."updatedAt" DESC,v."versionNumber" DESC`;
  const versionIds=rows.map(row=>row.versionId).filter((id):id is number=>Boolean(id));
  const reviews=versionIds.length?await prisma.$queryRaw<Review[]>`SELECT r.* FROM "DeliverableReview" r JOIN "DeliverableVersion" v ON v.id=r."versionId" JOIN "Deliverable" d ON d.id=v."deliverableId" JOIN "Project" p ON p.id=d."projectId" WHERE p."companyId"=${company.id} ORDER BY r."createdAt" ASC`:[];
  const map=new Map<number,any>();for(const row of rows){if(!map.has(row.id))map.set(row.id,{id:row.id,projectId:row.projectId,stageId:row.stageId,title:row.title,description:row.description,category:row.category,status:row.status,updatedAt:row.updatedAt,projectTitle:row.projectTitle,engagementName:row.engagementName,versions:[]});if(row.versionId)map.get(row.id).versions.push({id:row.versionId,versionNumber:row.versionNumber,label:row.label,fileUrl:row.fileUrl,fileName:row.fileName,fileType:row.fileType,notes:row.notes,status:row.versionStatus,createdAt:row.createdAt,reviews:reviews.filter(review=>review.versionId===row.versionId)});}
  return NextResponse.json(Array.from(map.values()),{headers:{"Cache-Control":"private, no-store, max-age=0"}});
 }catch(error){console.error(error);return NextResponse.json({error:"Unable to load deliverables"},{status:500});}
}