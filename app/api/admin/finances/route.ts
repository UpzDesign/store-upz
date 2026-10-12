import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

export async function GET(){
 const session=await requireStaffSession(["admin"]);
 if(!session)return NextResponse.json({error:"Admin access required"},{status:403});
 const projects=await prisma.project.findMany({
  where:{OR:[{status:{in:["complete","completed"]}},{activities:{some:{type:{in:["finance_invoice","finance_payment"]}}}}]},
  select:{id:true,title:true,status:true,budget:true,dueDate:true,updatedAt:true,company:{select:{name:true,shortName:true}},engagement:{select:{name:true}},activities:{where:{type:{in:["finance_invoice","finance_payment"]}},orderBy:{createdAt:"desc"},select:{id:true,type:true,metadata:true,createdAt:true}}},
  orderBy:{updatedAt:"desc"},take:500
 });
 return NextResponse.json(projects.map(project=>{
  const invoice=project.activities.find(a=>a.type==="finance_invoice");
  const payment=project.activities.find(a=>a.type==="finance_payment");
  let invoiceInfo:{fileId?:number;fileName?:string;invoiceNumber?:string;amount?:number}|null=null;
  if(invoice){try{invoiceInfo=JSON.parse(invoice.metadata||"{}")}catch{}}
  const paid=Boolean(invoice&&payment&&payment.createdAt>=invoice.createdAt);
  return {id:project.id,title:project.title,status:project.status,budget:project.budget,company:project.company,portfolio:project.engagement?.name||null,invoice:invoiceInfo,invoiceDate:invoice?.createdAt||null,paid,paymentDate:paid?payment?.createdAt:null};
 }),{headers:{"Cache-Control":"no-store"}});
}

export async function POST(request:NextRequest){
 const session=await requireStaffSession(["admin"]);
 if(!session)return NextResponse.json({error:"Admin access required"},{status:403});
 const body=await request.json().catch(()=>null);
 const projectId=Number(body?.projectId);
 if(!Number.isSafeInteger(projectId)||projectId<1)return NextResponse.json({error:"Invalid Work Order"},{status:400});
 const project=await prisma.project.findUnique({where:{id:projectId},select:{status:true,activities:{where:{type:{in:["finance_invoice","finance_payment"]}},orderBy:{createdAt:"desc"},take:10}}});
 if(!project)return NextResponse.json({error:"Work Order not found"},{status:404});
 if(body?.action==="invoice"){
  if(!["complete","completed"].includes(project.status)&&!project.activities.some(a=>a.type==="finance_invoice"))return NextResponse.json({error:"Complete the Work Order before invoicing"},{status:400});
  const fileId=Number(body.fileId),fileName=String(body.fileName||"").slice(0,180),invoiceNumber=String(body.invoiceNumber||"").trim().slice(0,100),amount=body.amount===""||body.amount==null?null:Number(body.amount);
  if(!Number.isSafeInteger(fileId)||fileId<1||!fileName.toLowerCase().endsWith(".pdf")||amount!==null&&(!Number.isFinite(amount)||amount<0))return NextResponse.json({error:"Upload a valid PDF invoice and enter a valid amount"},{status:400});
  const file=await prisma.projectActivity.findFirst({where:{id:fileId,projectId,type:"project_file"}});
  if(!file)return NextResponse.json({error:"Invoice PDF must belong to this Work Order"},{status:400});
  let meta:Record<string,unknown>={};try{meta=JSON.parse(file.metadata||"{}")}catch{}
  if(String(meta.name||"").split(".").pop()?.toLowerCase()!=="pdf")return NextResponse.json({error:"Only PDF invoices are accepted"},{status:400});
  await prisma.projectActivity.create({data:{projectId,type:"finance_invoice",message:"Invoice uploaded: "+fileName,actor:session.name,metadata:JSON.stringify({fileId,fileName,invoiceNumber,amount})}});
  return NextResponse.json({ok:true});
 }
 if(body?.action==="paid"){
  const latestInvoice=project.activities.find(a=>a.type==="finance_invoice");
  if(!latestInvoice)return NextResponse.json({error:"Upload an invoice first"},{status:400});
  const latestPayment=project.activities.find(a=>a.type==="finance_payment");
  if(latestPayment&&latestPayment.createdAt>=latestInvoice.createdAt)return NextResponse.json({error:"Payment already recorded"},{status:409});
  await prisma.projectActivity.create({data:{projectId,type:"finance_payment",message:"Payment received",actor:session.name,metadata:JSON.stringify({invoiceActivityId:latestInvoice.id,receivedAt:new Date().toISOString()})}});
  return NextResponse.json({ok:true});
 }
 return NextResponse.json({error:"Unknown action"},{status:400});
}
