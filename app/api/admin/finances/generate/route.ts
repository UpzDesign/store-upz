import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireStaffSession} from "@/lib/staff-auth";
import {renderInvoicePDF} from "@/lib/invoice-pdf";
export const runtime="nodejs";
const dateString=(value:Date)=>value.toISOString().slice(0,10);
export async function POST(request:NextRequest){
 const session=await requireStaffSession(["admin"]);if(!session)return NextResponse.json({error:"Admin required"},{status:403});
 const body=await request.json().catch(()=>null);
 const companyId=Number(body?.companyId),projectId=body?.projectId?Number(body.projectId):null;
 const title=String(body?.title||"").trim().slice(0,180);
 const number=String(body?.invoiceNumber||"").trim().slice(0,80);
 type InvoiceItem={description:string;quantity:number;rate:number};
 const rawItems:unknown[]=Array.isArray(body?.items)?body.items:[];
 const items:InvoiceItem[]=rawItems.slice(0,30).map((value:unknown)=>{const item=(value&&typeof value==="object"?value:{}) as {description?:unknown;quantity?:unknown;rate?:unknown};return {description:String(item.description||"").trim().slice(0,160),quantity:Number(item.quantity),rate:Number(item.rate)}});
 if(!Number.isSafeInteger(companyId)||companyId<1||!title||!number||!items.length||items.some(i=>!i.description||!Number.isFinite(i.quantity)||i.quantity<=0||i.quantity>100000||!Number.isFinite(i.rate)||i.rate<0||i.rate>10000000))return NextResponse.json({error:"Company, invoice number, description and valid line items are required"},{status:400});
 const company=await prisma.company.findUnique({where:{id:companyId}});
 if(!company)return NextResponse.json({error:"Company not found"},{status:404});
 if(projectId!==null){if(!Number.isSafeInteger(projectId)||projectId<1)return NextResponse.json({error:"Invalid Work Order"},{status:400});const project=await prisma.project.findFirst({where:{id:projectId,companyId},select:{id:true}});if(!project)return NextResponse.json({error:"Work Order must belong to the selected company"},{status:400})}
 const issued=body?.date?new Date(String(body.date)+"T12:00:00Z"):new Date(),due=body?.dueDate?new Date(String(body.dueDate)+"T12:00:00Z"):issued;
 if(Number.isNaN(issued.getTime())||Number.isNaN(due.getTime()))return NextResponse.json({error:"Invalid dates"},{status:400});
 const total=Math.round(items.reduce((s,i)=>s+i.quantity*i.rate,0)*100)/100;
 const billTo=[company.billingName||company.name,company.billingContact||"",company.billingAddress1||"",company.billingAddress2||"",[company.billingCity,company.billingState,company.billingPostalCode].filter(Boolean).join(", "),company.billingCountry||"",company.billingEmail||""].filter(Boolean);
 const notes=String(body?.notes||"").trim().slice(0,1000);
 const scope=String(body?.scope||"").trim().slice(0,2500);
 const settings=await prisma.invoiceSettings.findUnique({where:{id:1}});
 const sender={name:settings?.businessName||"UPZ Design LLC",address:[settings?.address||"3623 30th Street, Astoria, NY 11106"],email:settings?.email||"info@upzdesign.com",phone:settings?.phone||"347.596.9032",website:settings?.website||"www.upzdesign.com"};
 const pdf=await renderInvoicePDF({number,date:dateString(issued),dueDate:dateString(due),billTo,title,items,scope,notes,terms:company.paymentTerms||undefined,sender,logoSvg:settings?.logoSvg,paymentInstructions:settings?.paymentInstructions||undefined,footerNote:settings?.footerNote||undefined});
 const endpoint=process.env.UPZ_STORAGE_ENDPOINT,key=process.env.UPZ_STORAGE_KEY;
 if(!endpoint||!key)return NextResponse.json({error:"Storage unavailable"},{status:503});
 const target=new URL(endpoint);if(target.protocol!=="https:")return NextResponse.json({error:"Secure storage required"},{status:503});
 const filename="Invoice-"+number.replace(/[^a-zA-Z0-9_-]/g,"-")+".pdf";
 const payload=new FormData();payload.append("file",new Blob([new Uint8Array(pdf)],{type:"application/pdf"}),filename);payload.append("projectId",String(companyId));
 try{
  const response=await fetch(target,{method:"POST",headers:{"X-UPZ-Storage-Key":key},body:payload,cache:"no-store",signal:AbortSignal.timeout(60000)});
  const stored=await response.json();if(!response.ok||!/^[a-f0-9]{40}$/.test(String(stored.id)))throw new Error(stored.error||"Storage rejected PDF");
  const invoice=await prisma.standaloneInvoice.create({data:{companyId,projectId,title,invoiceNumber:number,amount:total,storageId:stored.id,fileName:filename}});
  return NextResponse.json({ok:true,id:invoice.id,amount:total},{status:201});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invoice creation failed"},{status:502})}
}
