import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";
export async function GET(){
 const session=await requireStaffSession();
 if(!session)return NextResponse.json({error:"Authentication required"},{status:401});
 const rows=await prisma.projectActivity.findMany({where:{type:"daily_log"},orderBy:{createdAt:"desc"},take:12,select:{id:true,projectId:true,message:true,metadata:true,createdAt:true,actor:true,project:{select:{title:true}}}});
 return NextResponse.json(rows.map(row=>({id:row.id,projectId:row.projectId,projectTitle:row.project.title,message:row.message,metadata:row.metadata,createdAt:row.createdAt,actor:row.actor})),{headers:{"Cache-Control":"no-store"}});
}
