import { NextRequest, NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export async function GET(_request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=await requireStaffSession(["admin","manager"]);
 if(!session)return NextResponse.json({error:"Unauthorized"},{status:403});
 const id=Number((await context.params).id);
 const record=await prisma.projectActivity.findUnique({where:{id},include:{project:{select:{assignedTo:true}}}});
 if(!record||record.type!=="project_file")return NextResponse.json({error:"Not found"},{status:404});
 if(session.role==="manager"&&record.project.assignedTo!==session.name)return NextResponse.json({error:"Forbidden"},{status:403});
 const data=JSON.parse(record.metadata||"{}");
 const endpoint=process.env.UPZ_STORAGE_ENDPOINT,key=process.env.UPZ_STORAGE_KEY;
 if(!endpoint||!key)return NextResponse.json({error:"Storage not configured"},{status:503});
 const url=new URL(endpoint);
 if(url.protocol!=="https:")return NextResponse.json({error:"HTTPS required"},{status:503});
 url.searchParams.set("id",data.storageId);
 url.searchParams.set("projectId",String(record.projectId));
 const result=await fetch(url,{headers:{"X-UPZ-Storage-Key":key},cache:"no-store"});
 if(!result.ok)return NextResponse.json({error:"File unavailable"},{status:502});
 return new NextResponse(result.body,{headers:{"Content-Type":"application/octet-stream","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
