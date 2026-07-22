import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 const {id}=await context.params;const body=await request.json();const decision=String(body.decision||"");
 if(!["approved","changes_requested","sent_for_review"].includes(decision))return NextResponse.json({error:"Invalid decision"},{status:400});
 const projectId=Number(id);const message=body.comment?`${decision.replaceAll("_"," ")}: ${body.comment}`:decision.replaceAll("_"," ");
 await prisma.$transaction([
  prisma.projectNote.create({data:{projectId,body:message,visibility:"client",author:body.author||"UPZ Admin"}}),
  prisma.projectActivity.create({data:{projectId,type:"client_approval",message,actor:body.author||"UPZ Admin"}}),
  prisma.project.update({where:{id:projectId},data:{status:decision==="approved"?"complete":decision==="changes_requested"?"in_progress":"waiting_client"}})
 ]);
 return NextResponse.json({ok:true});
}
