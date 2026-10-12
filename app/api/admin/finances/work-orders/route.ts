import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireStaffSession} from "@/lib/staff-auth";
export async function GET(){
 const session=await requireStaffSession(["admin"]);
 if(!session)return NextResponse.json({error:"Admin required"},{status:403});
 const projects=await prisma.project.findMany({select:{id:true,title:true,companyId:true,budget:true},orderBy:{updatedAt:"desc"},take:500});
 return NextResponse.json(projects,{headers:{"Cache-Control":"no-store"}});
}
