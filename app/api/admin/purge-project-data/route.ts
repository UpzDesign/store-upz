import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

async function authorize(){
 const session=await requireStaffSession(["admin"]);
 return Boolean(session&&session.role==="admin");
}
async function counts(){
 const [requests,projects,properties]=await Promise.all([
  prisma.marketingRequest.count(),prisma.project.count(),prisma.engagement.count()
 ]);
 return {requests,workOrders:projects,properties};
}
export async function GET(){
 if(!await authorize())return NextResponse.json({error:"Admin access required"},{status:403});
 return NextResponse.json(await counts(),{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 if(!await authorize())return NextResponse.json({error:"Admin access required"},{status:403});
 const body=await request.json().catch(()=>({}));
 if(body.confirmation!=="PURGE PROJECT DATA")return NextResponse.json({error:"Confirmation phrase does not match"},{status:400});
 try{
  const before=await counts();
  await prisma.$transaction(async tx=>{
   await tx.project.deleteMany({});
   await tx.marketingRequest.deleteMany({});
   await tx.engagement.deleteMany({});
  });
  return NextResponse.json({success:true,deleted:before});
 }catch(error){
  console.error("Project purge failed",error);
  return NextResponse.json({error:"Unable to purge project data. No partial changes were committed."},{status:500});
 }
}
