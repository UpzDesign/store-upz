import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

const DEFAULT_STAGES=["Preparation","Production","Installation","Final review"];
const slugify=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,55)||"project";
export async function POST(request:NextRequest){
 try{
  const session=await requireStaffSession(["admin","manager"]);
  if(!session)return NextResponse.json({error:"Admin or manager access required"},{status:403});
  const body=await request.json().catch(()=>({}));
  const engagementId=body.engagementId?Number(body.engagementId):null;
  const companyId=Number(body.companyId),title=String(body.title||"").trim(),address=String(body.address||"").trim();
  if(!Number.isSafeInteger(companyId)||companyId<=0||!title||title.length>180)return NextResponse.json({error:"Select a client and enter a project title."},{status:400});
  const company=await prisma.company.findUnique({where:{id:companyId},select:{id:true}});
  if(!company)return NextResponse.json({error:"Client not found"},{status:404});
  const assignedTo=String(body.assignedTo||"").trim()||(session.role==="manager"?session.name:null);
  if(session.role==="manager"&&assignedTo!==session.name)return NextResponse.json({error:"Managers can only create their own projects"},{status:403});
  const stages=Array.isArray(body.stages)?body.stages.map((s:unknown)=>String(s||"").trim()).filter(Boolean).slice(0,20):DEFAULT_STAGES;
  if(!stages.length)return NextResponse.json({error:"At least one stage is required"},{status:400});
  const amount=(v:unknown)=>v==null||v===""?null:Number(v);
  const budget=amount(body.budget),internalCost=amount(body.internalCost);
  if([budget,internalCost].some(v=>v!==null&&(!Number.isFinite(v)||v<0||v>100000000)))return NextResponse.json({error:"Invalid financial amount"},{status:400});
  const dueDate=body.dueDate?new Date(String(body.dueDate)+"T12:00:00"):null;
  if(dueDate&&Number.isNaN(dueDate.getTime()))return NextResponse.json({error:"Invalid due date"},{status:400});
  if(engagementId){const existing=await prisma.engagement.findFirst({where:{id:engagementId,companyId},select:{id:true}});if(!existing)return NextResponse.json({error:"Selected portfolio does not belong to this client"},{status:400});}
  const project=await prisma.$transaction(async tx=>{
   const base=slugify(title),slug=`${base}-${Date.now().toString(36)}`;
   const engagement=engagementId?{id:engagementId}:await tx.engagement.create({data:{companyId,name:String(body.portfolioName||title).trim().slice(0,180)||title,slug,type:"property",address:address||null,description:String(body.description||"").trim()||null,clientVisible:false}});
   const created=await tx.project.create({data:{companyId,engagementId:engagement.id,title,description:String(body.description||"").trim()||null,status:"new",priority:"normal",assignedTo,dueDate,budget,internalCost,clientVisible:false,tasks:{create:stages.map((stage:string,i:number)=>({title:stage,sortOrder:i,status:i===0?"ready":"todo",assignedTo}))},activities:{create:{type:"project_created",message:"Work Order created directly by staff.",actor:session.name}}}});
   return created;
  });
  return NextResponse.json({id:project.id,url:`/admin/project/${project.id}`},{status:201});
 }catch(error){console.error(error);return NextResponse.json({error:"Unable to create project"},{status:500})}
}
